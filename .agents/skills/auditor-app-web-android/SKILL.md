---
name: auditor-app-web-android
description: Audita aplicaciones web y Android, backend, API, seguridad, calidad del código, pruebas, accesibilidad, rendimiento e integración. Utilízalo cuando se solicite revisar, diagnosticar, auditar o preparar una aplicación para producción.
---

# Auditor de Aplicaciones Web y Android (Multiplataforma)

Este skill proporciona un protocolo estructurado, riguroso y determinista para auditar código fuente, configuración, compilación, seguridad, calidad, pruebas y despliegue en aplicaciones web y Android (nativas, Capacitor, React Native, PWA o híbridas).

## 1. Identificación y Alcance
1. **Detección de Arquitectura:**
   - Inspeccionar estructura de archivos, manifiestos (`package.json`, `build.gradle`, `AndroidManifest.xml`, `capacitor.config.ts`, etc.).
   - Determinar si el proyecto contiene frontend web/PWA, capa nativa móvil (Android/iOS), backend/APIs y almacenamiento de datos (IndexedDB, SQLite, Supabase, LocalStorage).
   - Identificar herramientas de test unitario (`vitest`, `jest`), E2E (`playwright`, `cypress`) y linters.

## 2. Protocolo de Auditoría por Dominios

### A. Arquitectura y Calidad de Código
- **Separación de responsabilidades:** Evaluar si la lógica de negocio, persistencia, llamadas externas y presentación están desacopladas.
- **Tipado y Coherencia:** Validar tipos en TypeScript, prevención de excepciones no controladas (`try-catch`), manejo de nulos/undefined.
- **Ciclo de vida y Estado:** Revisar fugas de memoria en hooks (`useEffect`, listeners globales de eventos `postMessage`, temporizadores `setInterval`).
- **Resiliencia offline / conectividad:** Comportamiento ante fallos de red o servicios externos inaccesibles.

### B. Seguridad (OWASP Top 10 Web & MASVS Android)
- **Credenciales y Secretos:** Detección de claves de API, tokens privados, certificados o credenciales en código cliente o historial Git.
- **Entradas y XSS/Inyección:** Validación de entradas de usuario, enlaces externos (`target="_blank"` con `rel="noopener noreferrer"`), desinfección de HTML incrustado.
- **Comunicaciones y Red:** Tráfico HTTPS forzado, políticas de origen cruzado (CORS), CSP (Content Security Policy).
- **Seguridad Android (MASVS):**
  - Permisos en `AndroidManifest.xml` (principio de mínimo privilegio).
  - Componentes exportados (`exported=true/false`) e intent filters.
  - Configuración de WebView (`allowFileAccess`, `cleartextTraffic`).
  - Almacenamiento seguro de datos locales y copias de seguridad (`android:allowBackup`).

### C. Auditoría Funcional y Accesibilidad (WCAG)
- **Rutas y Flujos de Usuario:** Ejecución de flujos principales sin bloqueos ni estados inconsistentes.
- **Accesibilidad (a11y):** Verificación con `axe-core` para contraste de color (>4.5:1), roles accesibles, etiquetas `aria`, navegación por teclado (Tab, Enter) sin trampas de foco.
- **Responsive & Usabilidad:** Comprobación de viewport en móvil y escritorio sin overflow horizontal involuntario.

### D. Auditoría de Android y Compilación Nativa
- **Entorno de Compilación:** Detección de JDK (versión y compatibilidad Gradle), Android SDK y herramientas de compilación (`gradlew`).
- **Compilación Real:** Ejecutar `gradlew assembleDebug` o `assembleRelease` y registrar warnings o deprecaciones.
- **Sincronización:** Verificar consistencia entre el bundle web y los assets nativos (`cap sync`).

### E. Backend, API y Persistencia
- **Modelado de Datos:** Esquemas SQL, migraciones y reglas de seguridad a nivel de fila (RLS si aplica Supabase/PostgreSQL).
- **Consistencia de Repositorio:** Mecanismos de fallback (IndexedDB con respaldo a localStorage, gestión de cuotas de disco).

## 3. Formato del Informe de Auditoría (`AUDIT_REPORT.md`)
El informe debe generarse en la raíz del proyecto estructurado con:
1. Resumen Ejecutivo y Matriz de Hallazgos por Severidad (CRÍTICA, ALTA, MEDIA, BAJA, INFORMATIVA).
2. Arquitectura Real y Alcance Técnico.
3. Matriz de Cobertura y Resultados de Pruebas (PASS, FAIL, BLOCKED, NOT APPLICABLE).
4. Detalle de Hallazgos con Evidencia (código, ruta, línea), Impacto y Solución Recomendada.
5. Plan de Remediación Priorizado y Criterios de Aceptación.
