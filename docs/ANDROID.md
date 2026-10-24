# Compilación Android (Capacitor)

Paquete: `com.linguasongs.app`.
Permisos configurados:
- `android.permission.RECORD_AUDIO`
- `android.permission.MODIFY_AUDIO_SETTINGS`
- `android.permission.INTERNET`
- `android.permission.POST_NOTIFICATIONS`
- `android.permission.SCHEDULE_EXACT_ALARM`

## Plugins nativos integrados
1. `@capacitor-community/speech-recognition@7.0.1`: Permite reconocimiento de voz nativo en Android (solucionando la limitación del WebView estándar).
2. `@capacitor/local-notifications@8.3.1`: Permite alarmas y notificaciones locales del sistema programables que se ejecutan incluso con la app cerrada.

## Requisitos de compilación
- **JDK**: Java 23 (probado y verificado en `C:\Program Files\Java\jdk-23`). La configuración en `android/build.gradle` alinea `jvmToolchain(23)` y `jvmTarget = JVM_21` para compatibilidad entre Kotlin y Java.
- **Android SDK**: instalado en `%LOCALAPPDATA%\Android\Sdk`.

## Compilar APK de prueba (Debug)
```powershell
npm run build
npx cap sync android
cd android
$env:JAVA_HOME='C:\Program Files\Java\jdk-23'
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:GRADLE_USER_HOME="$env:USERPROFILE\.gradle"
.\gradlew.bat assembleDebug
# Genera: android/app/build/outputs/apk/debug/app-debug.apk (~4.28 MB)
```

## Compilar AAB para Google Play (Release)
1. Generar keystore de producción (fuera del repositorio):
```powershell
keytool -genkeypair -v -keystore my-release-key.jks -alias my-alias -keyalg RSA -keysize 2048 -validity 10000
```
2. Configurar firma en `android/app/build.gradle` mediante variables de entorno (`KEYSTORE_PATH`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`).
3. Ejecutar:
```powershell
.\gradlew.bat bundleRelease
# Genera: android/app/build/outputs/bundle/release/app-release.aab
```
4. Subir a Google Play Console.
