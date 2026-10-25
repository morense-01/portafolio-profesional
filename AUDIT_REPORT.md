# INFORME DE AUDITORÍA PROFESIONAL DE SOFTWARE, SEGURIDAD Y QA
**Aplicación:** Lingua Songs AI (Multiplataforma Web PWA + Android Capacitor)  
**Fecha de Auditoría:** 24 de Octubre de 2026  
**Auditor:** Antigravity Senior Engineering, QA & Cybersecurity Auditor  
**Estado General:** Aceptable para pruebas y staging (NO lista para producción en Google Play sin subsanaciones)

---

## 1. RESUMEN EJECUTIVO

Se ha ejecutado una auditoría integral, estática y dinámica sobre el código fuente, configuración, dependencias, compilación nativa y flujos de usuario de **Lingua Songs AI**.

El sistema presenta una arquitectura limpia, modular y altamente reactiva construida con **React 19 + TypeScript + Vite + Capacitor 8**, con persistencia local asíncrona mediante **IndexedDB** (`idb-keyval`) y soporte offline garantizado a través de Service Workers PWA. La suite de pruebas automáticas cuenta con una cobertura sólida de 54 pruebas unitarias en **Vitest** y 15 pruebas End-to-End con análisis automatizado de accesibilidad WCAG AA en **Playwright + Axe-Core**, todas superadas al 100%.

No obstante, la auditoría identificó **7 hallazgos clave** (0 Críticos, 2 Altos, 3 Medios, 1 Bajo, 1 Informativo), principalmente centrados en la configuración de publicación y permisos en Android (`allowBackup=true`, sintaxis no normalizada de saltos de línea en el manifiesto), falta de Content Security Policy (CSP) en el contenedor web y vulnerabilidades moderadas en herramientas de desarrollo del ecosistema npm.

### Resumen de Hallazgos por Severidad
| Severidad | Cantidad | Descripción Principal |
| :--- | :---: | :--- |
| **CRÍTICA** | **0** | No se detectaron vulnerabilidades críticas ni exposición de secretos o RCE. |
| **ALTA** | **2** | `android:allowBackup="true"` en Android y falta de Content Security Policy (CSP). |
| **MEDIA** | **3** | Caracteres literales `` `n `` en AndroidManifest, falta de minificación Proguard/R8 en release, vulnerabilidades moderadas en npm CLI (`uuid` / `xcode`). |
| **BAJA** | **1** | Falta de verificación de cuota de almacenamiento en IndexedDB. |
| **INFORMATIVA** | **1** | Módulo de backend Supabase documentado con esquema SQL pero sin conexión activa a producción. |

---

## 2. ARQUITECTURA Y TECNOLOGÍAS IDENTIFICADAS

* **Frontend Web:** React 19.3.1, TypeScript 7.0.2, Vite 8.3.5, CSS3 nativo con diseño adaptativo estilo Duolingo y soporte de tema claro/oscuro.
* **PWA:** Service Worker (`sw.js`) con estrategia Cache-First para recursos estáticos y Network-First para datos, Web App Manifest (`manifest.webmanifest`).
* **Capa Móvil Nativa:** Capacitor 8.5.3, `@capacitor-community/speech-recognition 7.0.1`, `@capacitor/local-notifications 8.3.1`.
* **Motor Nativo Android:** Android Gradle Plugin 8.14.3, Java JDK 23, `compileSdk 36`, `minSdk 24`, `targetSdk 36`.
* **Persistencia:** Capa de repositorio asíncrona con IndexedDB (`idb-keyval 6.3.0`) con fallback y migración automática transparente desde `localStorage`.
* **Backend Opcional / Sincronización:** Especificación PostgREST / Supabase documentada con esquema DDL (`supabase/schema.sql`) y pruebas unitarias de transporte HTTP (`src/core/sync.ts`). No conectado a base de datos de producción activa (desarrollo puramente local).
* **Calidad y Testing:** Vitest 5.0.5 (54 pruebas unitarias), Playwright 1.64.1 (15 pruebas E2E multi-navegador), `@axe-core/playwright 4.14.0` (WCAG 2.1 Nivel AA).

---

## 3. MATRIZ DE COBERTURA Y RESULTADOS DE PRUEBAS

| Área Evaluada | Herramienta / Método | Estado | Observaciones |
| :--- | :--- | :---: | :--- |
| **Tipado y Compilación TypeScript** | `tsc --noEmit` | **PASS** | 0 errores de tipos en todo el proyecto. |
| **Compilación Web (Bundle)** | `vite build` | **PASS** | Generado bundle minificado en `dist/` en 591ms. |
| **Pruebas Unitarias** | `vitest run` | **PASS** | 54/54 pruebas unitarias y de lógica aprobadas (extractor, léxico, SRS, XP, lecciones). |
| **Pruebas E2E & Accesibilidad** | `playwright test --project=chromium` | **PASS** | 15/15 pruebas superadas (incluye análisis de contraste, roles accesibles y navegación con teclado). |
| **Auditoría de Dependencias** | `npm audit` | **FAIL** | 3 vulnerabilidades moderadas en devDependencies (`uuid` -> `xcode` -> `@capacitor/cli`). |
| **Compilación APK Android** | `gradlew.bat assembleDebug` | **PASS** | APK compilado exitosamente (`app-debug.apk`, 4.4 MB). |
| **Instalación en Dispositivo Físico/AVD** | `adb install` | **BLOCKED** | Ningún dispositivo Android conectado por USB ni emulador activo durante el análisis. |
| **Auditoría de Backend en la Nube** | Conexión HTTP / API | **NOT APPLICABLE** | La app funciona en modo autónomo local; backend Supabase es puramente opcional/desconectado. |

---

## 4. DETALLE DE HALLAZGOS DE AUDITORÍA

### [AND-001] Respaldo de datos de aplicación habilitado por defecto (`allowBackup="true"`)
* **Severidad:** ALTA (OWASP MASVS-STORAGE)
* **Estado:** Confirmado
* **Ubicación:** `android/app/src/main/AndroidManifest.xml#L5`
* **Evidencia:**
  ```xml
  <application
      android:allowBackup="true"
  ```
* **Impacto:** Con `allowBackup="true"`, un atacante o software espía con acceso físico o depuración USB (`adb backup`) puede extraer toda la base de datos de la app, estado de usuario, historiales y tokens locales sin necesidad de permisos de root.
* **Remediación:** Establecer `android:allowBackup="false"` o implementar un `data_extraction_rules.xml` estricto antes de publicar en tiendas de aplicaciones.

---

### [SEC-001] Ausencia de cabecera o meta Content Security Policy (CSP) en `index.html`
* **Severidad:** ALTA (OWASP Top 10 A03: Injection / XSS)
* **Estado:** Confirmado
* **Ubicación:** `index.html`
* **Evidencia:**
  El archivo `index.html` carece de etiqueta `<meta http-equiv="Content-Security-Policy" ...>`.
* **Impacto:** Aunque React 19 previene inyecciones básicas en el DOM, la integración con YouTube y scripts de terceros en navegadores web expone a la app si se incrustan recursos no autorizados o si se introducen orígenes desconocidos.
* **Remediación:** Agregar una directiva CSP restrictiva que autorice únicamente `'self'`, scripts propios, y los orígenes de YouTube (`https://www.youtube.com`, `https://www.youtube-nocookie.com`, `https://i.ytimg.com`).

---

### [AND-002] Formato no canónico de saltos de línea en permisos de `AndroidManifest.xml`
* **Severidad:** MEDIA (Calidad de Manifiesto / Integración)
* **Estado:** Confirmado
* **Ubicación:** `android/app/src/main/AndroidManifest.xml#L41`
* **Evidencia:**
  ```xml
  <uses-permission android:name="android.permission.RECORD_AUDIO" />`n    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />`n</manifest>
  ```
* **Impacto:** Aunque AAPT2 procesa el archivo ignorando los literales `` `n ``, esta sintaxis anómala puede provocar errores en analizadores estáticos de seguridad o herramientas de integración continua en Android Studio.
* **Remediación:** Normalizar el archivo con etiquetas XML limpias separadas por saltos de línea estándar `\n`.

---

### [AND-003] Compilación Release sin ofuscación ni reducción de código (R8 / Proguard desactivado)
* **Severidad:** MEDIA (OWASP MASVS-CODE)
* **Estado:** Confirmado
* **Ubicación:** `android/app/build.gradle#L20-L24`
* **Evidencia:**
  ```groovy
  buildTypes {
      release {
          minifyEnabled false
          proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
      }
  }
  ```
* **Impacto:** La distribución de un APK o AAB de producción sin minificación expone la lógica interna, nombres de clases y dependencias a ingeniería inversa mediante descompiladores como JADX o Apktool.
* **Remediación:** Configurar `minifyEnabled true` y `shrinkResources true` en el build type de release con reglas de Proguard adaptadas a Capacitor.

---

### [SEC-002] Vulnerabilidades moderadas en cadena de suministro de dependencias (npm audit)
* **Severidad:** MEDIA (OWASP Top 10 A06: Vulnerable and Outdated Components)
* **Estado:** Confirmado
* **Ubicación:** `package.json` -> `@capacitor/cli` -> `xcode` -> `uuid < 11.1.1`
* **Evidencia:**
  `uuid: Missing buffer bounds check in v3/v5/v6 when buf is provided (GHSA-w5hq-g745-h8pq)`.
* **Impacto:** Riesgo limitado a tiempo de desarrollo/compilación de assets nativos de iOS/Android vía CLI de Capacitor; no impacta directamente la ejecución del cliente en runtime de producción, pero incumple estándares estrictos de CI/CD.
* **Remediación:** Actualizar `@capacitor/cli` o sobrescribir la resolución de `uuid` una vez que los mantenedores de Capacitor emitan el parche de dependencias.

---

### [DAT-001] Persistencia en IndexedDB sin control explícito de cuota de disco
* **Severidad:** BAJA (Resiliencia de Almacenamiento)
* **Estado:** Confirmado
* **Ubicación:** `src/data/repo.ts`
* **Evidencia:**
  Las escrituras en IndexedDB mediante `idb-keyval` asumen éxito continuo sin verificar `navigator.storage.estimate()` ni capturar eventos `QuotaExceededError`.
* **Impacto:** En dispositivos con almacenamiento casi lleno, las transacciones pueden fallar silenciosamente provocando pérdida parcial de progreso o tarjetas de repaso.
* **Remediación:** Implementar una captura defensiva de `QuotaExceededError` que informe al usuario en pantalla si el almacenamiento del dispositivo está saturado.

---

### [INF-001] Módulo Backend Supabase en modo no productivo
* **Severidad:** INFORMATIVA
* **Estado:** Confirmado
* **Ubicación:** `supabase/schema.sql`, `src/core/sync.ts`
* **Evidencia:**
  El esquema de base de datos SQL con Row Level Security (RLS) y las interfaces de transporte están correctamente modeladas, pero no hay variables de entorno productivas (`SUPABASE_URL`, `ANON_KEY`) configuradas.
* **Impacto:** La aplicación funciona al 100% de manera local y desconectada; no hay fugas hacia servidores externos.
* **Remediación:** Mantener la arquitectura local actual y solo configurar Supabase si se implementa explícitamente inicio de sesión multi-dispositivo en la nube.

---

## 5. PLAN DE REMEDIACIÓN PRIORIZADO

1. **Prioridad 1 (Inmediata - Seguridad Android):**
   - Corregir `android:allowBackup="false"` y limpiar caracteres `` `n `` en `android/app/src/main/AndroidManifest.xml`.
2. **Prioridad 2 (Inmediata - Seguridad Web):**
   - Añadir política de seguridad de contenido (CSP) en `index.html` restringiendo orígenes de scripts e iframes.
3. **Prioridad 3 (Preparación para Publicación):**
   - Habilitar `minifyEnabled true` en `android/app/build.gradle` para compilaciones firmadas (AAB).
   - Generar Keystore de release y configurar variables de firma documentadas en `docs/PUBLISH_CHECKLIST.md`.
4. **Prioridad 4 (Mantenimiento):**
   - Monitorear parches de `@capacitor/cli` para resolver la vulnerabilidad moderada de `uuid`.

---

## 6. CRITERIOS PARA VALIDAR LAS CORRECCIONES

* `gradlew.bat assembleDebug` compila limpiamente sin advertencias de manifiesto.
* Inspección de `aapt dump xmltree ... AndroidManifest.xml` confirma `allowBackup=false`.
* `npm run build && npx playwright test` pasa al 100% con la cabecera CSP activa sin bloquear recursos de YouTube ni síntesis de voz.
* El informe de vulnerabilidades `npm audit` permanece bajo revisión continua en el pipeline.
