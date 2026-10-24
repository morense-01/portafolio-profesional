# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: extra.spec.ts >> Listening: respuestas correctas con audio → 25/25 evaluado
- Location: e2e\extra.spec.ts:35:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.check: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel('The server is down again.', { exact: true })

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - main [ref=e3]:
    - heading "Lingua Songs AI" [level=1] [ref=e4]
    - heading "Demo" [level=2] [ref=e5]
    - generic "Etapas" [ref=e6]:
      - generic [ref=e7]: Listening
      - generic [ref=e8]: Confirmar
      - generic [ref=e9]: Reading
      - generic [ref=e10]: Writing
      - generic [ref=e11]: Speaking
      - generic [ref=e12]: Test final
      - generic [ref=e13]: Resultado
    - generic [ref=e14]:
      - heading "Test final" [level=3] [ref=e15]
      - group [ref=e16]:
        - generic [ref=e17]:
          - text: ¿Qué significa «look forward to»?
          - button "🔊" [ref=e18] [cursor=pointer]
        - generic [ref=e19]:
          - radio "desplegar" [ref=e20]
          - text: desplegar
        - generic [ref=e21]:
          - radio "esperar con ilusión" [ref=e22]
          - text: esperar con ilusión
        - generic [ref=e23]:
          - radio "horario / programar" [ref=e24]
          - text: horario / programar
      - group [ref=e25]:
        - generic [ref=e26]:
          - text: ¿Qué significa «deploy»?
          - button "🔊" [ref=e27] [cursor=pointer]
        - generic [ref=e28]:
          - radio "contraseña" [ref=e29]
          - text: contraseña
        - generic [ref=e30]:
          - radio "desplegar" [ref=e31]
          - text: desplegar
        - generic [ref=e32]:
          - radio "horario / programar" [ref=e33]
          - text: horario / programar
        - generic [ref=e34]:
          - radio "fiable" [ref=e35]
          - text: fiable
      - group [ref=e36]:
        - generic [ref=e37]:
          - text: ¿Qué significa «password»?
          - button "🔊" [ref=e38] [cursor=pointer]
        - generic [ref=e39]:
          - radio "esperar con ilusión" [ref=e40]
          - text: esperar con ilusión
        - generic [ref=e41]:
          - radio "contraseña" [ref=e42]
          - text: contraseña
        - generic [ref=e43]:
          - radio "fiable" [ref=e44]
          - text: fiable
      - group [ref=e45]:
        - generic [ref=e46]:
          - text: ¿Qué significa «reliable»?
          - button "🔊" [ref=e47] [cursor=pointer]
        - generic [ref=e48]:
          - radio "esperar con ilusión" [ref=e49]
          - text: esperar con ilusión
        - generic [ref=e50]:
          - radio "desplegar" [ref=e51]
          - text: desplegar
        - generic [ref=e52]:
          - radio "fiable" [ref=e53]
          - text: fiable
        - generic [ref=e54]:
          - radio "contraseña" [ref=e55]
          - text: contraseña
      - group [ref=e56]:
        - generic [ref=e57]:
          - text: ¿Qué significa «schedule»?
          - button "🔊" [ref=e58] [cursor=pointer]
        - generic [ref=e59]:
          - radio "esperar con ilusión" [ref=e60]
          - text: esperar con ilusión
        - generic [ref=e61]:
          - radio "desplegar" [ref=e62]
          - text: desplegar
        - generic [ref=e63]:
          - radio "horario / programar" [ref=e64]
          - text: horario / programar
      - 'heading "Listening: ¿qué oyes?" [level=4] [ref=e65]'
      - paragraph [ref=e66]: Frases originales leídas por la voz de tu dispositivo (no son letras de canciones). Escucha y elige lo que oyes.
      - generic [ref=e67]:
        - checkbox "No puedo reproducir audio ahora (Listening quedará pendiente)" [checked] [ref=e68]
        - text: No puedo reproducir audio ahora (Listening quedará pendiente)
      - generic [ref=e69]: "Escribe en inglés: «esperar con ilusión»"
      - 'textbox "Escribe en inglés: «esperar con ilusión»" [ref=e70]'
      - button "Calificar" [ref=e71] [cursor=pointer]
  - navigation "Navegación principal" [ref=e72]:
    - button "Inicio" [ref=e73]
    - button "Canciones" [ref=e74]
    - button "Repasar" [ref=e75]
    - button "Escribir" [ref=e76]
    - button "Tutor" [ref=e77]
    - button "Misiones" [ref=e78]
    - button "Progreso" [ref=e79]
    - button "Ajustes" [ref=e80]
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
> 37 |   for (const it of LISTEN_ITEMS.slice(0, 4)) await page.getByLabel(it.say, { exact: true }).check();
     |                                                                                             ^ Error: locator.check: Test timeout of 30000ms exceeded.
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
  62 |     const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  63 |     const bad = r.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
  64 |     expect(bad.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  65 |   });
  66 | }
  67 | 
```