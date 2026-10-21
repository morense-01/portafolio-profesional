# Despliegue gratuito en GitHub Pages

URL final recomendada: `https://morense-01.github.io/` (repositorio llamado exactamente `morense-01.github.io`). Si usa otro nombre de repositorio (por ejemplo `portafolio`), la URL será `https://morense-01.github.io/portafolio/` y debe ajustar `basePath`.

## Pasos

1. Cree una cuenta de GitHub si no la tiene (ya existe `morense-01`).
2. Cree un repositorio **público**: `morense-01.github.io` (o `portafolio`).
3. En `content/site.json`:
   - Repositorio `morense-01.github.io`: `"siteUrl": "https://morense-01.github.io"`, `"basePath": ""`.
   - Repositorio `portafolio`: `"siteUrl": "https://morense-01.github.io"`, `"basePath": "/portafolio"`.
4. Desde la carpeta del proyecto:
   ```bash
   git init -b main
   git add .
   git commit -m "Portafolio profesional"
   git remote add origin https://github.com/morense-01/morense-01.github.io.git
   git push -u origin main
   ```
5. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
6. La pestaña **Actions** ejecutará `Publicar en GitHub Pages` (pruebas, build y despliegue). Al terminar, el sitio queda en la URL anterior.
7. Revise la página con el enlace general y una página de empresa, por ejemplo `/experiencia/madeco/`. Comparta ese enlace en LinkedIn, el CV y mensajes a reclutadores.

## Dominio propio (opcional, gratuito si ya lo posee)

**Settings → Pages → Custom domain**. Ajuste `siteUrl` a ese dominio y `basePath` a `""`.

## Previsualizaciones al compartir

LinkedIn y otras redes guardan en caché la vista previa. Tras publicar o cambiar la imagen, use el [Post Inspector de LinkedIn](https://www.linkedin.com/post-inspector/) para refrescarla.

## Alternativa: Cloudflare Pages

Conecte el repositorio, comando de build `npm run build`, directorio de salida `dist`, y defina `SITE_URL` como variable de entorno. `basePath` debe ser `""`.

## Limitaciones del plan gratuito

- El repositorio es público (el contenido de `content/` es visible).
- GitHub Pages no admite cabeceras HTTP propias; la CSP se aplica por `<meta>` y `frame-ancestors` no es posible.
- No hay formulario de contacto: se usan enlaces directos a canales existentes. Un formulario real requeriría un servicio externo (por ejemplo Formspree con plan gratuito limitado); no se incluyó para no simular envíos.
- La previsualización de Open Graph requiere una URL pública; no se puede probar en `localhost`.
