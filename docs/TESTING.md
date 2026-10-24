# Resultados de pruebas (ejecutadas 2026-10-24)

| Prueba | Comando | Resultado |
|---|---|---|
| Unitarias (33) | `npm test` | **33/33 pasan**: URL, diff/dictado, SRS, umbral/mínimos/Speaking pendiente, XP y rachas, lección, tutor, evaluación inicial, misiones, notificaciones y zona horaria |
| E2E Playwright (Chromium escritorio + viewport móvil 390×844) | `npm run e2e` | **12/12 pasan** tras corregir un test de teclado; una primera ejecución falló por un timeout puntual, no reproducido en la segunda |
| Tipos | `npx tsc` | sin errores |
| Auditoría | `npm audit` | 0 vulnerabilidades |
| APK debug | ver `docs/ANDROID.md` | Compila (`app-debug.apk`, ~4,2 MB) |

## E2E cubre
URL inválida rechazada; letra oculta en Listening; confirmación manual antes de Reading; retomar lección tras recargar; flujo hasta el test con Speaking «pendiente»; tutor con corrección; exportación de datos; modo oscuro; foco por teclado.

## NO verificado (pasos manuales)
- APK **no instalado ni ejecutado** en dispositivo/emulador (micrófono, TTS, reconocimiento de voz del WebView, YouTube dentro de la WebView).
- Reproducción real de YouTube (requiere red; en E2E solo se comprobó que el iframe se renderiza o la UI offline).
- Notificaciones reales (solo probada la lógica de horario/zona/permisos).
- Safari/Firefox, lectores de pantalla, auditoría Lighthouse.
- Sincronización/RLS: no existe backend.
