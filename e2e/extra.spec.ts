import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { LISTEN_ITEMS } from '../src/data/content';

async function toTest(page: any) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Omitir' }).click();
  await page.getByRole('button', { name: 'Canciones' }).click();
  await page.getByLabel('URL de YouTube').fill('https://youtu.be/dQw4w9WgXcQ');
  await page.getByLabel('Título').fill('Demo');
  await page.getByRole('button', { name: 'Crear lección' }).click();
  await page.getByRole('button', { name: 'Terminé de escuchar' }).click();
  await page.getByRole('button', { name: 'Sí, empezar Reading' }).click();
  await page.getByRole('button', { name: 'Continuar a Writing' }).click();
  await page.getByRole('button', { name: 'Continuar a Speaking' }).click();
  await page.getByRole('button', { name: 'Ir al test final' }).click();
}

test('migra datos antiguos de localStorage a IndexedDB', async ({ page, context }) => {
  await context.addInitScript(() => {
    if (!localStorage.getItem('seeded')) {
      localStorage.setItem('seeded', '1');
      localStorage.setItem('lingua-songs-db', JSON.stringify({ version: 1, songs: [{ id: 's1', title: 'Cancion Antigua', artist: '', videoId: 'dQw4w9WgXcQ', url: '', level: 'A1', accent: 'US', transcript: '', transcriptSource: 'none', createdAt: 1 }], lessons: [{ id: 'l1', songId: 's1', stage: 'listening', confirmedReading: false, listening: { seconds: 0, replays: 0 }, completed: {} }], placementDone: true, settings: { level: 'B1' } }));
    }
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Canciones' }).click();
  await expect(page.getByText('Cancion Antigua')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Canciones' }).click();
  await expect(page.getByText('Cancion Antigua')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('lingua-songs-db'))).toBeNull();
});

test('Listening: respuestas correctas con audio → 25/25 evaluado', async ({ page }) => {
  await toTest(page);
  for (const it of LISTEN_ITEMS.slice(0, 4)) await page.getByLabel(it.say, { exact: true }).check();
  await page.getByRole('button', { name: 'Calificar' }).click();
  await expect(page.getByText('Listening: 25/25')).toBeVisible();
});

test('Listening: sin audio queda pendiente, no inventa nota', async ({ page }) => {
  await toTest(page);
  await page.getByLabel(/No puedo reproducir audio/).check();
  await page.getByRole('button', { name: 'Calificar' }).click();
  await expect(page.getByText(/Listening: pendiente/)).toBeVisible();
});

test('Progreso: mapa con requisitos y diagnóstico sin datos', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Omitir' }).click();
  await page.getByRole('button', { name: 'Progreso' }).click();
  await expect(page.getByText(/te faltan 1 lección/).first()).toBeVisible();
  await expect(page.getByText(/Sin mediciones comparables/)).toBeVisible();
});

for (const [name, nav] of [['Inicio', null], ['Canciones', 'Canciones'], ['Progreso', 'Progreso'], ['Ajustes', 'Ajustes'], ['Tutor', 'Tutor']] as const) {
  test(`accesibilidad (axe) — ${name}`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Omitir' }).click();
    if (nav) await page.getByRole('button', { name: nav, exact: true }).click();
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
    expect(bad.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}
