---
name: auditor-orquestador-web-android
description: Orquestador maestro de auditoría integral para aplicaciones Web y Android. Coordina la revisión de código, seguridad OWASP/MASVS, calidad QA, accesibilidad WCAG, persistencia local y compilación móvil.
---

# Auditor Orquestador Web y Android

Este skill orquesta y ejecuta el ciclo de vida completo de auditoría, verificación y remediación técnica para aplicaciones Web (PWA/React) y móviles Android (Capacitor/Nativo).

## Fases de Orquestación

1. **Inspección de Entorno y Arquitectura:**
   - Detección de dependencias, manifiestos y estructura modular.
   - Verificación de herramientas de compilación (`tsc`, `vite`, `gradlew`, `cap`).

2. **Auditoría de Calidad de Código y Tipado:**
   - Análisis estático (`tsc --noEmit`).
   - Pruebas unitarias de lógica pura y funciones de dominio (`vitest`).

3. **Auditoría de Seguridad y Resiliencia:**
   - Verificación de secretos y credenciales.
   - Análisis de configuración Android (`allowBackup`, permisos, componentes exportados).
   - Políticas Web (Content Security Policy, mitigación XSS).

4. **Auditoría E2E, Accesibilidad y Usabilidad:**
   - Pruebas dinámicas multi-navegador con Playwright.
   - Auditoría automatizada de accesibilidad WCAG 2.1 AA con Axe-Core.

5. **Auditoría y Validación de Compilación Nativa:**
   - Sincronización de activos (`npx cap sync android`).
   - Compilación real del APK (`gradlew assembleDebug`).

6. **Consolidación del Informe:**
   - Emisión y actualización de `AUDIT_REPORT.md` con hallazgos clasificados por severidad y plan de remediación.
