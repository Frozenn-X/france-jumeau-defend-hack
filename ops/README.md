# Livraison continue du frontend

Le frontend et l'API sont déployés séparément. Le domaine canonique est
`https://francejumeau.trauchessec.fr/`. Nginx sert
`/home/frozen/df-energie/dist`, qui pointe vers
`/home/frozen/releases/current/dist`. L'API PM2 sur le port 3001 n'est
ni reconstruite ni redémarrée par ce pipeline.

## Déclenchement

- Une PR vers `main-prod` exécute lint, 14 tests existants, build,
  contrôles SEO du build et tests navigateur Chromium. Elle ne déploie rien.
- Après fusion, la même CI s'exécute sur le commit exact de `main-prod`.
- Le cron du compte `frozen` lance toutes les trois minutes la copie
  installée de `ops/deploy-frontend.sh` dans
  `/home/frozen/bin/ci-deploy-fne`.
- Le script refuse de déployer tant que le job GitHub `quality` du
  push `main-prod` n'a pas conclu `success`.

## Publication et échec

Le VPS reconstruit le commit approuvé dans un worktree temporaire, sous une
image Node 22 épinglée par digest. Il relance les tests, prépare une release
statique et bascule le lien `current` atomiquement. Il compare ensuite la
page servie aux fichiers construits, lit `release-info.json` et teste
`/api/health` ainsi que le GeoJSON des régions, servi par l'API locale sans
source externe. En cas d'échec après la bascule, le lien précédent est
restauré et la nouvelle release incomplète est supprimée. Les releases
précédentes sont conservées pour un retour arrière.

Le job GitHub « Verify automatic VPS deployment » attend le SHA public de
`release-info.json` et échoue si la production ne publie pas le commit
attendu. Aucun secret GitHub ni accès SSH entrant n'est nécessaire : le VPS
lit le dépôt public et l'état de la CI, puis tire le code lui-même.

Avant de fusionner un changement de domaine, installer la version correspondante
de `ops/deploy-frontend.sh` sur le VPS et vérifier que Nginx sert directement
le site sur le nouveau domaine avec un certificat valide. L'ancien domaine peut
ensuite devenir une redirection permanente vers le domaine canonique, après les
contrôles de santé et de contenu sur ce dernier.

## Exploitation

`/home/frozen/bin/ci-deploy-fne --status` affiche la release active et
le dernier SHA déployé. `--force` reconstruit le dernier `main-prod`
après le même contrôle CI. Les journaux sont dans
`/home/frozen/logs/ci-deploy-fne.log`.

Ce mécanisme dépend du cron utilisateur et de l'API publique GitHub.
Une indisponibilité de l'un ou l'autre laisse la release active en place ;
le job GitHub de vérification signale alors l'absence de publication.
Mettre à jour la copie installée du script après toute modification de
`ops/deploy-frontend.sh`.
