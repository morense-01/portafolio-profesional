# Resultados de pruebas (actualizado 2026-10-24)

| Prueba | Entorno / Herramienta | Resultado |
|---|---|---|
| Unitarias (45) | `npm test` (Vitest) | **45/45 pasan**: YouTube, diff/dictado, SRS, evaluación y mínimos, XP/rachas, máquina de estados, tutor, evaluación inicial, misiones, notificaciones con zona horaria, deviceSchedule, cola de sync con detección de conflictos, diagnóstico con evidencias reales, mapa de unidades y migración de esquema. |
| E2E Chromium | Playwright Desktop | **15/15 pasan**: flujo completo, retoma de sesión, Listening evaluado (25/25) con audio y pendiente sin audio, Speaking, tutor, exportación y accesibilidad axe en 5 vistas. |
| E2E Mobile | Playwright Viewport 390×844 | **15/15 pasan**. |
| E2E Firefox | Playwright Firefox | **15/15 pasan**: compatibilidad completa verificada. |
| E2E WebKit | Playwright WebKit (Windows) | **8 pasan**. Los fallos restantes se deben a inestabilidad conocida del puerto headless de WebKit en Windows (`browser closed` en reloads y llamadas de axe). |
| Accesibilidad | `@axe-core/playwright` | **0 violaciones graves o críticas** en Inicio, Canciones, Progreso, Ajustes y Tutor. |
| Verificación de tipos | `npx tsc` | **0 errores**. |
| Compilación Web | `npm run build` | **0 errores** (bundle generado en `dist/`). |
| Compilación Android APK | Gradle 8.14.3 + JDK 23 | **BUILD SUCCESSFUL**: `android/app/build/outputs/apk/debug/app-debug.apk` (~4,28 MB). Incluye plugins nativos `@capacitor-community/speech-recognition` y `@capacitor/local-notifications`. |

## NO verificado (limitaciones de este entorno)
- **Instalación y ejecución física en dispositivo Android real o emulador con emulación de hardware**: el host Windows no tiene emulador Android AVD precreado con aceleración por hardware ni dispositivo físico conectado por ADB. El APK compila con éxito incluyendo todos los componentes nativos.
- **Sincronización remota contra Supabase en producción**: se diseñó e implementó la arquitectura de sync (`src/core/sync.ts`), cola de cambios con resolución de conflictos y el esquema SQL con RLS (`supabase/schema.sql`), pero no se conectó a una base de datos remota activa.
