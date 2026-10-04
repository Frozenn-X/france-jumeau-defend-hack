#!/usr/bin/env bash
set -Eeuo pipefail
umask 022

# Pull-based CD: only the exact main-prod commit with a successful GitHub
# "quality" job is eligible. The API service and Nginx configuration stay put.
repo=/home/frozen/dev_projects/france-jumeau-dev
releases=/home/frozen/releases
builds=$releases/.builds
current=$releases/current
state=$releases/.ci-deploy-state
site=https://hackaton-energie.trauchessec.fr
api=https://api.github.com/repos/Frozenn-X/france-jumeau-defend-hack
node_image=node:22-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c
force=0

case "${1:-}" in
  "") ;;
  --force) force=1 ;;
  --status)
    printf 'current=%s\n' "$(readlink -f "$current")"
    if [[ -f "$state" ]]; then
      printf 'state='
      cat "$state"
    fi
    exit 0
    ;;
  *) echo "Usage: $0 [--status|--force]" >&2; exit 2 ;;
esac

mkdir -p "$releases" "$builds"
exec 9>"$releases/.ci-deploy.lock"
flock -n 9 || exit 0

[[ -d "$repo/.git" && -L "$current" && -L /home/frozen/df-energie/dist ]]
previous=$(readlink -f "$current")
[[ -d "$previous/dist" ]]
[[ "$(readlink -f /home/frozen/df-energie/dist)" == "$previous/dist" ]]

export GIT_SSH_COMMAND='ssh -i /home/frozen/.ssh/github_france_jumeau_ed25519 -o IdentitiesOnly=yes -o BatchMode=yes'
git -C "$repo" fetch --quiet origin main-prod
target=$(git -C "$repo" rev-parse "refs/remotes/origin/main-prod^{commit}")
tree=$(git -C "$repo" rev-parse "$target^{tree}")
[[ "$target" =~ ^[0-9a-f]{40}$ && "$tree" =~ ^[0-9a-f]{40}$ ]]

deployed_sha=
deployed_path=
if [[ -f "$state" ]]; then
  IFS=$'\t' read -r deployed_sha deployed_path < "$state"
fi
if (( force == 0 )) && [[ "$deployed_sha" == "$target" && "$deployed_path" == "$previous" ]]; then
  exit 0
fi

github_json() {
  curl -fsS --retry 2 --retry-delay 2 --max-time 20 \
    -H 'Accept: application/vnd.github+json' "$1"
}

# The workflow as a whole is still running while its deployment-verification
# job waits for this script. Gate on the completed quality job, not the run.
run_id=$(github_json "$api/actions/runs?head_sha=$target&event=push&branch=main-prod&per_page=20" |
  jq -r --arg sha "$target" '[.workflow_runs[] |
    select(.head_sha == $sha and .head_branch == "main-prod" and
           .event == "push" and .path == ".github/workflows/quality.yml")] |
    sort_by(.run_number) | last | .id // empty')
if [[ ! "$run_id" =~ ^[0-9]+$ ]]; then
  echo "Waiting for the main-prod CI run for $target"
  exit 0
fi
quality=$(github_json "$api/actions/runs/$run_id/jobs?per_page=100" |
  jq -r '[.jobs[] | select(.name == "quality")] | last | .conclusion // empty')
if [[ "$quality" != success ]]; then
  echo "CI quality job for $target is not green (state: ${quality:-pending})"
  exit 0
fi

stamp=$(date -u +%Y%m%dT%H%M%SZ)
builddir="$builds/.build-$stamp-${target:0:12}-$$"
release="$releases/site-$stamp-${target:0:12}-$$"
next="$releases/.current.next-$$"
rollback="$releases/.current.rollback-$$"
state_next="$releases/.ci-deploy-state.next-$$"
worktree_created=0
switched=0

on_exit() {
  code=$?
  trap - EXIT
  if (( code != 0 && switched == 1 )); then
    if ln -s "$previous" "$rollback" && mv -Tf "$rollback" "$current"; then
      echo "Rollback restored $previous" >&2
    else
      echo "CRITICAL: rollback failed; inspect $current immediately" >&2
    fi
  fi
  if (( code != 0 )) && [[ -d "$release" && "$release" == "$releases"/site-* ]] &&
     [[ "$(readlink -f "$current")" != "$release" ]]; then
    rm -r -- "$release" || echo "Could not remove failed release $release" >&2
  fi
  if (( worktree_created == 1 )); then
    git -C "$repo" worktree remove --force "$builddir" || true
  fi
  rm -f -- "$next" "$rollback" "$state_next"
  exit "$code"
}
trap on_exit EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

git -C "$repo" worktree add --detach "$builddir" "$target"
worktree_created=1
docker run --rm \
  --user "$(id -u):$(id -g)" \
  --cap-drop=ALL --security-opt=no-new-privileges \
  -e HOME=/tmp -e NPM_CONFIG_CACHE=/tmp/npm-cache \
  -v "$builddir:/app" -w /app "$node_image" \
  sh -c 'npm ci --no-audit --no-fund && npm test && npm run build && npm run test:seo-build --if-present'
[[ -s "$builddir/dist/index.html" ]]

mkdir -m 755 "$release"
cp -a "$builddir/dist" "$release/dist"
git -C "$repo" worktree remove --force "$builddir"
worktree_created=0

printf '{"commit":"%s","tree":"%s","deployed_at_utc":"%s"}\n' \
  "$target" "$tree" "$stamp" > "$release/dist/release-info.json"
printf 'commit=%s\ntree=%s\ndeployed_at_utc=%s\n' \
  "$target" "$tree" "$stamp" > "$release/RELEASE_METADATA"
chmod -R a+rX "$release/dist"

# Do not publish an older commit if main-prod moved during the build.
git -C "$repo" fetch --quiet origin main-prod
[[ "$(git -C "$repo" rev-parse "refs/remotes/origin/main-prod^{commit}")" == "$target" ]]

ln -s "$release" "$next"
mv -Tf "$next" "$current"
switched=1

expected_hash=$(sha256sum "$release/dist/index.html" | awk '{print $1}')
smoke_ok=0
for attempt in 1 2 3 4 5 6; do
  served=$(curl -fsS --max-time 8 "$site/release-info.json?sha=$target" || true)
  served_hash=$(curl -fsS --max-time 8 "$site/" | sha256sum | awk '{print $1}' || true)
  api_health=$(curl -fsS --max-time 8 "$site/api/health" | jq -r '.status // empty' || true)
  geojson_ok=$(curl -fsS --max-time 8 "$site/api/geojson/france-regions" |
    jq -r 'if .type == "FeatureCollection" and (.features | length) > 0 then "ok" else "bad" end' || true)
  guide_ok=1
  if [[ -f "$release/dist/comprendre-electricite-en-france.html" ]]; then
    curl -fsS --max-time 8 "$site/comprendre-electricite-en-france.html" |
      grep -F "<h1>Comprendre le parcours de l'électricité en France</h1>" >/dev/null || guide_ok=0
  fi
  if jq -e --arg sha "$target" '.commit == $sha' >/dev/null 2>&1 <<< "$served" &&
     [[ "$served_hash" == "$expected_hash" && "$api_health" == ok && "$geojson_ok" == ok && "$guide_ok" == 1 ]]; then
    smoke_ok=1
    break
  fi
  echo "Smoke check $attempt/6 failed for $target; retrying" >&2
  sleep 2
done
[[ "$smoke_ok" == 1 ]]

printf '%s\t%s\n' "$target" "$release" > "$state_next"
mv -Tf "$state_next" "$state"
echo "Deployed $target from green CI run $run_id to $release"
