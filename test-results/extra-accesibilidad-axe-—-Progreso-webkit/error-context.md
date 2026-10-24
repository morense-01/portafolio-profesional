# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: extra.spec.ts >> accesibilidad (axe) — Progreso
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
      - heading "Mapa A1 → B2 (orientativo)" [level=2] [ref=e6]
      - generic [ref=e7]:
        - heading "A1" [level=3] [ref=e8]
        - list [ref=e9]:
          - listitem [ref=e10]:
            - text: 🔒 Saludos y presentaciones
            - generic [ref=e11]: — te faltan 1 lección(es) aprobada(s) (≥ 80) para desbloquearla
          - listitem [ref=e12]:
            - text: 🔒 Rutinas diarias
            - generic [ref=e13]: — te faltan 2 lección(es) aprobada(s) (≥ 80) para desbloquearla
          - listitem [ref=e14]:
            - text: 🔒 Comida y compras
            - generic [ref=e15]: — te faltan 3 lección(es) aprobada(s) (≥ 80) para desbloquearla
      - generic [ref=e16]:
        - heading "A2" [level=3] [ref=e17]
        - list [ref=e18]:
          - listitem [ref=e19]:
            - text: 🔒 Pasado simple y viajes
            - generic [ref=e20]: — te faltan 4 lección(es) aprobada(s) (≥ 80) para desbloquearla
          - listitem [ref=e21]:
            - text: 🔒 Trabajo básico
            - generic [ref=e22]: — te faltan 5 lección(es) aprobada(s) (≥ 80) para desbloquearla
          - listitem [ref=e23]:
            - text: 🔒 Tecnología cotidiana
            - generic [ref=e24]: — te faltan 6 lección(es) aprobada(s) (≥ 80) para desbloquearla
      - generic [ref=e25]:
        - heading "B1" [level=3] [ref=e26]
        - list [ref=e27]:
          - listitem [ref=e28]:
            - text: 🔒 Experiencias y planes
            - generic [ref=e29]: — te faltan 7 lección(es) aprobada(s) (≥ 80) para desbloquearla
          - listitem [ref=e30]:
            - text: 🔒 Entrevistas
            - generic [ref=e31]: — te faltan 8 lección(es) aprobada(s) (≥ 80) para desbloquearla
          - listitem [ref=e32]:
            - text: 🔒 Infraestructura y nube
            - generic [ref=e33]: — te faltan 9 lección(es) aprobada(s) (≥ 80) para desbloquearla
      - generic [ref=e34]:
        - heading "B2" [level=3] [ref=e35]
        - list [ref=e36]:
          - listitem [ref=e37]:
            - text: 🔒 Opiniones y debate
            - generic [ref=e38]: — te faltan 10 lección(es) aprobada(s) (≥ 80) para desbloquearla
          - listitem [ref=e39]:
            - text: 🔒 Ciberseguridad
            - generic [ref=e40]: — te faltan 11 lección(es) aprobada(s) (≥ 80) para desbloquearla
          - listitem [ref=e41]:
            - text: 🔒 IA en el trabajo
            - generic [ref=e42]: — te faltan 12 lección(es) aprobada(s) (≥ 80) para desbloquearla
      - paragraph [ref=e43]: "Lecciones aprobadas: 0. Los niveles son orientativos, no certificaciones."
    - generic [ref=e44]:
      - heading "Competencias (promedio de tests)" [level=2] [ref=e45]
      - generic [ref=e46]:
        - text: "reading: sin datos"
        - progressbar "Competencia reading" [ref=e47]
      - generic [ref=e48]:
        - text: "writing: sin datos"
        - progressbar "Competencia writing" [ref=e49]
      - generic [ref=e50]:
        - text: "listening: sin datos"
        - progressbar "Competencia listening" [ref=e51]
      - generic [ref=e52]:
        - text: "speaking: sin datos"
        - progressbar "Competencia speaking" [ref=e53]
    - generic [ref=e54]:
      - heading "XP y racha" [level=2] [ref=e55]
      - paragraph [ref=e56]: 0 XP · racha 0 día(s). El XP tiene tope diario por actividad. Si pierdes la racha, vuelve a empezar con cualquier actividad real.
    - generic [ref=e57]:
      - heading "Logros" [level=2] [ref=e58]
      - list [ref=e59]:
        - listitem [ref=e60]: 🔒 Primera canción completada
        - listitem [ref=e61]: 🔒 Siete días de práctica
        - listitem [ref=e62]: 🔒 Diez dictados completados
        - listitem [ref=e63]: 🔒 Cinco lecciones aprobadas
        - listitem [ref=e64]: 🔒 Cien palabras aprendidas
        - listitem [ref=e65]: 🔒 Primera conversación completa
    - generic [ref=e66]:
      - heading "Diagnóstico" [level=2] [ref=e67]
      - paragraph [ref=e68]: Aún no hay hallazgos con evidencia suficiente.
      - paragraph [ref=e69]: "Datos insuficientes para: Escucha vs lectura (necesita ≥3 dictados y ≥3 recuperaciones); Speaking (sin intentos con reconocimiento de voz)."
      - paragraph [ref=e70]: "Tarjetas: ninguna"
    - generic [ref=e71]:
      - heading "Resumen semanal" [level=2] [ref=e72]
      - paragraph [ref=e73]: "Actividades en 7 días: 0 · intentos de escritura: 0"
      - paragraph [ref=e74]: Sin mediciones comparables todavía (se necesitan ≥3 intentos en cada semana); no se calcula mejora.
  - navigation "Navegación principal" [ref=e75]:
    - button "Inicio" [ref=e76]
    - button "Canciones" [ref=e77]
    - button "Repasar" [ref=e78]
    - button "Escribir" [ref=e79]
    - button "Tutor" [ref=e80]
    - button "Misiones" [ref=e81]
    - button "Progreso" [ref=e82]
    - button "Ajustes" [ref=e83]
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