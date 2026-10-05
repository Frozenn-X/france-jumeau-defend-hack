import { expect, test } from '@playwright/test';

test('la carte affiche le nom du site et mène au guide', async ({ page }) => {
  const pageErrors = [];
  const apiRequests = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/api/')) apiRequests.push(url);
  });
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const data = path.includes('/geojson/')
      ? { type: 'FeatureCollection', features: [] }
      : { results: [] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
  });
  await page.goto('/');
  await expect(page).toHaveTitle('France Numérique Énergie');
  await expect(page.getByRole('heading', { name: 'France Numérique Énergie', level: 1 })).toBeVisible();
  await expect.poll(() => apiRequests.some((url) => url.pathname === '/api/energy/national')).toBeTruthy();
  await expect.poll(() => apiRequests.some((url) => url.pathname === '/api/geojson/france-regions')).toBeTruthy();
  expect(apiRequests.every((url) => url.origin === 'http://127.0.0.1:4173')).toBeTruthy();

  const guide = page.getByRole('link', { name: "Comprendre l'électricité en France" });
  await expect(guide).toHaveAttribute('href', '/comprendre-electricite-en-france.html');
  await guide.click();
  await expect(page).toHaveURL(/\/comprendre-electricite-en-france\.html$/);
  await expect(page.getByRole('heading', { name: "Comprendre le parcours de l'électricité en France", level: 1 })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test.describe('guide accessible sans JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('sert un article HTML et un retour vers la carte', async ({ page }) => {
    const response = await page.goto('/comprendre-electricite-en-france.html');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle("Comprendre le parcours de l'électricité en France | France Numérique Énergie");
    await expect(page.getByRole('heading', { name: "Comprendre le parcours de l'électricité en France", level: 1 })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://francejumeau.trauchessec.fr/comprendre-electricite-en-france.html');
    await expect(page.getByRole('link', { name: 'Explorer la carte France Numérique Énergie' })).toHaveAttribute('href', '/');
  });
});

test('le plan du site annonce les deux pages publiées', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  const sitemap = await request.get('/sitemap.xml');
  expect(robots.ok()).toBeTruthy();
  expect(sitemap.ok()).toBeTruthy();
  expect(await robots.text()).toContain('Sitemap: https://francejumeau.trauchessec.fr/sitemap.xml');
  const xml = await sitemap.text();
  expect(xml).toContain('<loc>https://francejumeau.trauchessec.fr/</loc>');
  expect(xml).toContain('<loc>https://francejumeau.trauchessec.fr/comprendre-electricite-en-france.html</loc>');
});
