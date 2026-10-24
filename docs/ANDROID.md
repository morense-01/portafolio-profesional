# Compilación Android (Capacitor)

Paquete: `com.linguasongs.app`. Permisos añadidos: `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS` (+ INTERNET de Capacitor).

## Requisitos
JDK 21+ (Capacitor actual rechaza Java 17: «invalid source release: 21»; probado con JDK 23), Android SDK.

## APK de prueba (verificado: compila)
```powershell
npm run build; npx cap sync android
cd android
$env:JAVA_HOME='C:\Program Files\Java\jdk-23'; $env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
.\gradlew.bat assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```
`android/local.properties` (ruta del SDK) está ignorado por git; créalo con `sdk.dir=...`.

## AAB de producción (no ejecutado)
1. Crea un keystore fuera del repo (ver `docs/PUBLISH_CHECKLIST.md`).
2. Configura `signingConfigs` leyendo contraseñas de variables de entorno o `~/.gradle/gradle.properties`.
3. `.\gradlew.bat bundleRelease` → `app/build/outputs/bundle/release/app-release.aab`.
4. Sube a Google Play Console (cuenta de desarrollador requerida).

## Limitaciones conocidas del WebView
- `SpeechRecognition` normalmente no está disponible en Android WebView → Speaking quedará «pendiente» salvo que se añada un plugin nativo.
- El micrófono en WebView puede requerir un manejador de permisos nativo adicional: **sin probar en dispositivo**.
- YouTube necesita red.
