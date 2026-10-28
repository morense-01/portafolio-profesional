# Lingua Songs AI - Francés de Canadá (PWA & Android)

Aprende francés de Canadá (Québec y Acadie) con canciones de YouTube: Listening → confirmación → Reading → Writing → Speaking → Test final. Catálogo exclusivo de música en francés canadiense (Céline Dion, Les Cowboys Fringants, Cœur de pirate, Charlotte Cardin, Garou, Daniel Bélanger, Les Colocs, etc.).

## Decisión técnica
**Vite + React + TypeScript (PWA)** en vez de React Native/Expo: una sola base de código, coste cero, y el reproductor oficial de YouTube funciona vía iframe. Android: empaquetar con **Capacitor** (pendiente, ver abajo). La lógica está en `src/core` (funciones puras, testeadas) y la persistencia detrás de una interfaz `Repo` (`src/data/repo.ts`), hoy con localStorage versionado y migrable; SQLite/IndexedDB se pueden añadir implementando `Repo`.

## Arquitectura
```
UI (src/App.tsx) → core (youtube, diff, srs, assessment, xp, lesson) → Repo (localStorage, schema v1)
                 → APIs del navegador: YouTube iframe (nocookie), SpeechSynthesis, SpeechRecognition, MediaRecorder, Notification
```
```
src/core/   lógica pura + core.test.ts
src/data/   repo.ts (esquema, migraciones), content.ts (contenido original)
public/     manifest, icon, sw.js (network-first, solo mismo origen)
```

## Uso
```
npm install
npm run dev      # desarrollo
npm test       # 33 unitarias`nnpm run e2e    # 12 E2E
npm run build    # producción en dist/
npm run preview
```
`.env.example` solo contiene nombres ficticios; no hay secretos en el cliente.

## Estado verificado`n33 pruebas unitarias, 12 E2E (Playwright), tsc y npm audit limpios; APK debug compilado. Detalle y lo NO verificado: `docs/TESTING.md`. Android: `docs/ANDROID.md`. Seguridad: `docs/SECURITY_PRIVACY.md`. Manual: `docs/USER_MANUAL.md`. Publicación: `docs/PUBLISH_CHECKLIST.md`.`n`n## Limitaciones`n- Sin backend, sincronización ni RLS; todo local.`n- Tutor: reglas locales (gratis); IA remota solo mediante tu proxy, desactivada por defecto.`n- Sin evaluación fonética; Speaking depende del reconocimiento del navegador (normalmente ausente en WebView Android → «pendiente»).`n- Listening del test se estima con vocabulario, no con audio autorizado.`n- APK sin probar en dispositivo; AAB firmado y publicación en Play: pendientes (requieren cuenta y keystore).`n- Notificaciones locales solo con la app abierta/instalada; sin garantía en segundo plano.`n- Datos en localStorage (no SQLite/IndexedDB) tras la interfaz `Repo`.`n`n## Servicios
| Servicio | Coste | Notas de privacidad |
|---|---|---|
| YouTube iframe (nocookie) | 0 | Requiere conexión; aplica política de Google |
| SpeechSynthesis/Recognition | 0 | Dependen del navegador; el reconocimiento puede enviar audio al proveedor del navegador |

## Despliegue web
Sirve `dist/` en cualquier hosting estático (Netlify, Cloudflare Pages, GitHub Pages con fallback SPA). Verifica los límites vigentes del plan gratuito antes de usarlo.

## Privacidad
Datos solo locales; exportación JSON y borrado total en Ajustes. Grabaciones no se persisten.

