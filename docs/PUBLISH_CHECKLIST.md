# Lista de verificación para publicación

## Web
- [ ] `npm test` y `npm run e2e` en verde
- [ ] `npm run build`; subir `dist/` a Netlify / Cloudflare Pages / GitHub Pages (fallback SPA a `index.html`)
- [ ] Verificar HTTPS (necesario para micrófono, service worker, notificaciones)
- [ ] Probar instalación PWA y actualización (cambiar `CACHE` en `public/sw.js` al publicar)
- [ ] Política de privacidad enlazada (`docs/SECURITY_PRIVACY.md`)
- [ ] Revisar límites del plan gratuito del hosting vigente

## Android (pendiente de entorno: JDK 17 + Android SDK)
- [ ] `npm run build && npx cap sync android`
- [ ] APK de prueba: `cd android && gradlew assembleDebug` → `android/app/build/outputs/apk/debug/`
- [ ] Icono/splash definitivos (`npx @capacitor/assets generate`)
- [ ] Crear keystore **fuera del repo**: `keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`
- [ ] AAB: `gradlew bundleRelease`, firmar con la clave de subida
- [ ] Cuenta de Google Play Console (pago único de Google), ficha, política de privacidad, Data safety (micrófono: no se sube), clasificación de contenido
- [ ] Probar en dispositivos reales (micrófono, TTS, reconocimiento de voz del WebView)

No se ha publicado nada en Google Play ni en ningún dominio.
