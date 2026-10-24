# Seguridad y privacidad

**Modelo:** app 100 % local (sin cuentas ni servidor). Los datos viven en `localStorage` del navegador/WebView.

| Tema | Estado |
|---|---|
| Secretos | Ninguno en el repo. `.env.example` solo tiene nombres ficticios. `VITE_*` se incluye en el bundle: **nunca** pongas claves ahí; usa un proxy propio. |
| Validación de entradas | URL de YouTube con `new URL` + lista blanca de hosts + ID de 11 caracteres; longitud máxima de título/transcripción/respuestas del tutor. |
| Inyección | React escapa todo el texto; no se usa `dangerouslySetInnerHTML`. CSV exportado neutraliza fórmulas (`=`, `+`, `-`, `@`). |
| YouTube | Solo iframe oficial `youtube-nocookie.com`; no se extrae audio, letra ni subtítulos. |
| Micrófono | Consentimiento explícito antes de grabar; el audio no se persiste ni se sube; botón para eliminarlo. El reconocimiento de voz del navegador puede enviar audio a su proveedor (Google en Chrome): dependiente del navegador. |
| IA remota | Desactivada por defecto. Solo si configuras tu proxy y marcas la casilla; envía únicamente el texto escrito (≤500 caracteres). |
| Derechos | Transcripciones: solo texto aportado por el usuario con declaración de derechos. |
| Derechos del usuario | Exportar (JSON) y borrar todo desde Ajustes. |
| Notificaciones | Solo tras permiso explícito; máximo una por día; sin entrega garantizada en segundo plano. |
| Dependencias | `npm audit` ejecutado (ver docs/TESTING.md). |
| Sin sincronización | No hay RLS ni autenticación porque no hay backend. Si se añade Supabase: RLS por `auth.uid()`, cola `sync_queue` y resolución de conflictos por `updated_at` mostrando el conflicto al usuario. |

Sin publicidad, sin analítica, sin venta de datos.

## Retención
Los datos permanecen hasta que el usuario los borre. Las grabaciones no se retienen.
