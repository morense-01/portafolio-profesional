# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: extra.spec.ts >> accesibilidad (axe) — Tutor
- Location: e2e\extra.spec.ts:58:3

# Error details

```
Error: browserContext.newPage: Target page, context or browser has been closed
 Please check out https://github.com/dequelabs/axe-core-npm/blob/develop/packages/playwright/error-handling.md
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - main [ref=e3]:
    - heading "Lingua Songs AI" [level=1] [ref=e4]
    - generic [ref=e5]:
      - heading "Tutor de conversación" [level=2] [ref=e6]
      - paragraph [ref=e7]: "Proveedor: Local (reglas, gratis). La IA remota no está configurada; el tutor local funciona sin internet ni coste."
      - text: Tema
      - combobox "Tema" [ref=e8]:
        - option "Vida cotidiana" [selected]
        - option "Trabajo y entrevistas"
        - option "Tecnología"
        - option "La canción"
      - button "Empezar" [ref=e9] [cursor=pointer]
  - navigation "Navegación principal" [ref=e10]:
    - button "Inicio" [ref=e11]
    - button "Canciones" [ref=e12]
    - button "Repasar" [ref=e13]
    - button "Escribir" [ref=e14]
    - button "Tutor" [ref=e15]
    - button "Misiones" [ref=e16]
    - button "Progreso" [ref=e17]
    - button "Ajustes" [ref=e18]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import AxeBuilder from '@axe-core/playwright';
  3  | import { LISTEN_ITEMS } from '../src/data/content';
  4  | 
  5  | async function toTest(page: any) {
  6  |   await page.goto('/');
  7  |   await page.getByRole('button', { name: 'Omitir' }).click();
  8  |   await page.getByRole('button', { name: 'Canciones' }).click();
  9  |   await page.getByLabel('URL de YouTube').fill('https://youtu.be/dQw4w9WgXcQ');
  10 |   await page.getByLabel('Título').fill('Demo');
  11 |   await page.getByRole('button', { name: 'Crear lección' }).click();
  12 |   await page.getByRole('button', { name: 'Terminé de escuchar' }).click();
  13 |   await page.getByRole('button', { name: 'Sí, empezar Reading' }).click();
  14 |   await page.getByRole('button', { name: 'Continuar a Writing' }).click();
  15 |   await page.getByRole('button', { name: 'Continuar a Speaking' }).click();
  16 |   await page.getByRole('button', { name: 'Ir al test final' }).click();
  17 | }
  18 | 
  19 | test('migra datos antiguos de localStorage a IndexedDB', async ({ page, context }) => {
  20 |   await context.addInitScript(() => {
  21 |     if (!localStorage.getItem('seeded')) {
  22 |       localStorage.setItem('seeded', '1');
  23 |       localStorage.setItem('lingua-songs-db', JSON.stringify({ version: 1, songs: [{ id: 's1', title: 'Cancion Antigua', artist: '', videoId: 'dQw4w9WgXcQ', url: '', level: 'A1', accent: 'US', transcript: '', transcriptSource: 'none', createdAt: 1 }], lessons: [{ id: 'l1', songId: 's1', stage: 'listening', confirmedReading: false, listening: { seconds: 0, replays: 0 }, completed: {} }], placementDone: true, settings: { level: 'B1' } }));
  24 |     }
  25 |   });
  26 |   await page.goto('/');
  27 |   await page.getByRole('button', { name: 'Canciones' }).click();
  28 |   await expect(page.getByText('Cancion Antigua')).toBeVisible();
  29 |   await page.reload();
  30 |   await page.getByRole('button', { name: 'Canciones' }).click();
  31 |   await expect(page.getByText('Cancion Antigua')).toBeVisible();
  32 |   expect(await page.evaluate(() => localStorage.getItem('lingua-songs-db'))).toBeNull();
  33 | });
  34 | 
  35 | test('Listening: respuestas correctas con audio → 25/25 evaluado', async ({ page }) => {
  36 |   await toTest(page);
  37 |   for (const it of LISTEN_ITEMS.slice(0, 4)) await page.getByLabel(it.say, { exact: true }).check();
  38 |   await page.getByRole('button', { name: 'Calificar' }).click();
  39 |   await expect(page.getByText('Listening: 25/25')).toBeVisible();
  40 | });
  41 | 
  42 | test('Listening: sin audio queda pendiente, no inventa nota', async ({ page }) => {
  43 |   await toTest(page);
  44 |   await page.getByLabel(/No puedo reproducir audio/).check();
  45 |   await page.getByRole('button', { name: 'Calificar' }).click();
  46 |   await expect(page.getByText(/Listening: pendiente/)).toBeVisible();
  47 | });
  48 | 
  49 | test('Progreso: mapa con requisitos y diagnóstico sin datos', async ({ page }) => {
  50 |   await page.goto('/');
  51 |   await page.getByRole('button', { name: 'Omitir' }).click();
  52 |   await page.getByRole('button', { name: 'Progreso' }).click();
  53 |   await expect(page.getByText(/te faltan 1 lección/).first()).toBeVisible();
  54 |   await expect(page.getByText(/Sin mediciones comparables/)).toBeVisible();
  55 | });
  56 | 
  57 | for (const [name, nav] of [['Inicio', null], ['Canciones', 'Canciones'], ['Progreso', 'Progreso'], ['Ajustes', 'Ajustes'], ['Tutor', 'Tutor']] as const) {
  58 |   test(`accesibilidad (axe) — ${name}`, async ({ page }) => {
  59 |     await page.goto('/');
  60 |     await page.getByRole('button', { name: 'Omitir' }).click();
  61 |     if (nav) await page.getByRole('button', { name: nav, exact: true }).click();
> 62 |     const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
     |               ^ Error: browserContext.newPage: Target page, context or browser has been closed
  63 |     const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
  64 |     expect(bad.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  65 |   });
  66 | }
  67 | 
```