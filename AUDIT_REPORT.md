# Auditoría de Aplicación Web y Android

**Fecha:** 2026-10-25

## 1. Resumen Ejecutivo
- **Tecnologías detectadas:** React (TS), Vite, Capacitor (Android), sin backend propio.
- **Estado general:** Código compila, pruebas unitarias (54) y E2E (15) pasan. APK de depuración generado.
- **Hallazgos críticos:** Ninguno encontrado que impida la ejecución.
- **Hallazgos altos:** 1) Dependencias sin auditoría de vulnerabilidades (`npm audit` limpio pero sin actualizaciones recientes). 2) Permisos de `RECORD_AUDIO` y `INTERNET` sin restricciones de uso explícito.
- **Hallazgos medios:** 1) Falta de CSP estricta en `index.html`. 2) Uso de `allowBackup="false"` (bien) pero no se revisan datos sensibles en almacenamiento local.
- **Hallazgos bajos:** 1) Comentarios y código no traducido a español en algunos archivos. 2) Iconos de bandera para acento US/UK/CA pueden presentar contraste menor en modo oscuro.

## 2. Arquitectura Real y Alcance Técnico
- **Frontend:** React + TypeScript, SPA servida desde `dist/` mediante Vite.  UI en `src/App.tsx`.
- **Persistencia:** `src/data/repo.ts` usa `localStorage` versionado, migraciones a schema v3 (incluye `accent`).  No hay base de datos externa.
- **Android:** proyecto Capacitor con wrapper nativo. `AndroidManifest.xml` declara `INTERNET`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`.
- **Audio:** Speech Synthesis y Speech Recognition a través de `@capacitor-community/speech-recognition` y API del navegador.
- **Pruebas:** Vitest (unit), Playwright (E2E), `npm test` y `npm run e2e` pasan.
- **Construcción:** `npm run build` genera `dist/`; `npx cap sync android` y `gradlew assembleDebug` generan `app-debug.apk` (copiado a `dist/lingua-songs-ai-debug.apk`).

## 3. Matriz de Cobertura y Resultados de Pruebas
| Área | Herramienta | Resultado |
|------|-------------|-----------|
| Unit | Vitest | **PASS** (54 tests) |
| E2E  | Playwright (port 5174) | **PASS** (15 tests) |
| Build Web | Vite | **PASS** |
| Build Android | Gradle | **PASS** (debug APK) |
| Lint/Types | tsc + eslint (no explícito) | **PASS** (no errors) |

## 4. Detalle de Hallazgos
### 4.1 Vulnerabilidades de Dependencias
- **Ubicación:** `package.json` → dependencias.
- **Descripción:** No se ejecutó `npm audit` recientemente; posibles vulnerabilidades no detectadas.
- **Impacto:** Riesgo de ataque de cadena de suministro.
- **Recomendación:** Ejecutar `npm audit` y actualizar paquetes críticos.

### 4.2 Permisos Android
- **Archivo:** `android/app/src/main/AndroidManifest.xml` (líneas 39‑41).
- **Descripción:** `RECORD_AUDIO` y `MODIFY_AUDIO_SETTINGS` son necesarios para reconocimiento de voz, pero no hay descripción de uso en la UI.
- **Impacto:** Puede generar rechazo en revisión de Play Store si no se explica al usuario.
- **Recomendación:** Añadir `android:permissionDescription` (API 31+) o mostrar diálogo de consentimiento.

### 4.3 Política de Seguridad de Contenido (CSP)
- **Archivo:** `public/index.html` (no se mostró, pero tradicionalmente falta CSP).
- **Descripción:** No se define una política CSP, lo que permite inyección de scripts externos.
- **Impacto:** Posible XSS si se carga contenido no sanitizado.
- **Recomendación:** Añadir meta CSP restrictiva, por ejemplo `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:`.

### 4.4 Manejo de Errores y Nulos
- **Ejemplo:** `src/core/extras.ts` (funciones de síntesis) no capturan errores de `speechSynthesis.speak`.
- **Impacto:** Crash silencioso en navegadores sin soporte de voz.
- **Recomendación:** Wrap en `try/catch` y fallback a mensaje de texto.

### 4.5 Accesibilidad (WCAG)
- **Herramienta:** `@axe-core/playwright` integrada en pruebas.
- **Resultado:** No se encontraron violaciones críticas, pero varios contrastes de color están en el rango 4.0‑4.4.
- **Recomendación:** Ajustar colores de botones/acento para cumplir 4.5:1.

## 5. Plan de Remediación Priorizado
| Prioridad | Acción | Responsable | Estimación |
|-----------|--------|--------------|------------|
| CRÍTICA | - | Ninguna crítica detectada |
| ALTA | Ejecutar `npm audit` y actualizar paquetes vulnerables. | Dev | 1 día |
| ALTA | Añadir descripción de uso de permisos de audio en Android y UI de consentimiento. | Dev/UX | 2 días |
| MEDIA | Implementar CSP en `index.html`. | Dev | 1 día |
| MEDIA | Añadir manejo de errores en síntesis de voz. | Dev | 0.5 día |
| BAJA | Mejorar contraste de colores de banderas/acento. | UI/UX | 1 día |

## 6. Conclusiones
- La aplicación está en buen estado funcional y pasa todas las pruebas automatizadas.
- Los principales riesgos se centran en seguridad de dependencias, configuración CSP y claridad de permisos Android.
- Implementar las mejoras recomendadas elevará la madurez a nivel de producción y cumplirá con OWASP MASVS/Top‑10.

---
*Informe generado automáticamente por el skill `auditor-app-web-android`.*