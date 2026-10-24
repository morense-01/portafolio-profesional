# Lingua Songs AI (v0.1, PWA)

Aprende inglés con canciones de YouTube: Listening → confirmación → Reading → Writing → Speaking → Test final.

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
npm test         # 20 pruebas unitarias
npm run build    # producción en dist/
npm run preview
```
`.env.example` solo contiene nombres ficticios; no hay secretos en el cliente.

## Estado verificado (ejecutado 2026-10-24)
- `npm test`: 20/20 pasan (URL válidas/inválidas, diff de dictado, SRS, umbral 80, Speaking pendiente, mínimos por habilidad, tope de XP, transcripción oculta hasta confirmar, 4 etapas).
- `npm run build`: OK.
- **No ejecutado**: pruebas de UI/Playwright, pruebas en dispositivo Android, reproducción real de YouTube, micrófono, notificaciones.

## Limitaciones y pendientes
- Sin tutor de IA ni backend/sincronización/RLS (no implementados).
- Sin APK/AAB: falta Capacitor + Android SDK + firma (nunca versionar keystores).
- Sin evaluación fonética; Speaking solo compara texto reconocido (si el navegador lo soporta). Sin reconocimiento, queda «pendiente».
- Listening del test se estima con preguntas de vocabulario, no con audio autorizado.
- Notificaciones: solo permiso y preferencia; no hay programación en segundo plano.
- Mapa A1–B2, logros y diagnóstico son versiones mínimas; no hay misiones semanales ni resumen semanal.
- Evaluación inicial de nivel, escritura guiada, recuperación de memoria y vistas separadas por pantalla: pendientes.
- Textos: la app no extrae letras/subtítulos; solo usa texto pegado por el usuario con declaración de derechos.

## Servicios
| Servicio | Coste | Notas de privacidad |
|---|---|---|
| YouTube iframe (nocookie) | 0 | Requiere conexión; aplica política de Google |
| SpeechSynthesis/Recognition | 0 | Dependen del navegador; el reconocimiento puede enviar audio al proveedor del navegador |

## Despliegue web
Sirve `dist/` en cualquier hosting estático (Netlify, Cloudflare Pages, GitHub Pages con fallback SPA). Verifica los límites vigentes del plan gratuito antes de usarlo.

## Privacidad
Datos solo locales; exportación JSON y borrado total en Ajustes. Grabaciones no se persisten.
