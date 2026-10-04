import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const site = 'https://hackaton-energie.trauchessec.fr/';
const title = 'France Numérique Énergie';
const description = "France Numérique Énergie est un jumeau numérique interactif pour comprendre le parcours de l'énergie en France, de la production à la consommation.";
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const robots = readFileSync(join(dist, 'robots.txt'), 'utf8');
const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');

const has = (value, label) => assert.ok(html.includes(value), `${label} absent du build`);
has('<html lang="fr">', 'langue française');
has(`<title>${title}</title>`, 'titre');
has(`<meta name="description" content="${description}"`, 'description');
has(`<link rel="canonical" href="${site}"`, 'URL canonique');
has(`<meta property="og:title" content="${title}"`, 'titre Open Graph');
has(`<meta property="og:description" content="${description}"`, 'description Open Graph');
has(`<meta property="og:url" content="${site}"`, 'URL Open Graph');
has(`<meta property="og:image" content="${site}social-preview.jpg"`, 'image Open Graph');
has('<h1>France Numérique Énergie</h1>', 'texte HTML initial');
assert.match(robots, /^User-agent: \*\r?\nAllow: \/\r?\n/m);
assert.ok(robots.includes(`Sitemap: ${site}sitemap.xml`), 'sitemap absent de robots.txt');
assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
assert.ok(sitemap.includes(`<loc>${site}</loc>`), 'URL canonique absente du sitemap');
assert.equal((sitemap.match(/<loc>/g) ?? []).length, 1, 'le sitemap doit déclarer une seule page');

const assets = readdirSync(join(dist, 'assets'));
const script = html.match(/src="\/(assets\/index-[^"]+\.js)"/)?.[1];
assert.ok(script, 'bundle JavaScript non référencé dans index.html');
assert.ok(statSync(join(dist, script)).size > 0, 'bundle JavaScript absent');
assert.ok(assets.some((name) => /^index-.*\.css$/.test(name)), 'feuille CSS absente');
assert.ok(assets.some((name) => /^maplibre-gl-worker-.*\.js$/.test(name)), 'worker MapLibre absent');
const image = readFileSync(join(dist, 'social-preview.jpg'));
assert.ok(image.length > 1024 && image[0] === 0xff && image[1] === 0xd8, 'image sociale JPEG invalide');
assert.ok(statSync(join(dist, 'favicon.svg')).size > 0, 'favicon SVG absent');

console.log('SEO du build vérifié : titre, métadonnées, HTML, sitemap, robots et ressources.');
