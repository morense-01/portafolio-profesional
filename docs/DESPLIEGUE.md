# Publicación privada por enlace (gratis)

**Objetivo:** el código vive en un repositorio **privado** y el sitio solo lo conocen quienes reciben el enlace. No se indexa en buscadores.

## Por qué no GitHub Pages
En el plan gratuito, GitHub Pages exige repositorio público, y en planes de pago el sitio sigue siendo accesible por URL pública. Por eso se usa **Cloudflare Pages** (gratis), que sí despliega desde un repositorio privado.

## Qué hace el proyecto para no ser indexado
- `content/site.json` → `"indexable": false` (valor actual).
- Todas las páginas llevan `<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">`.
- `robots.txt` contiene `Disallow: /` y **no se genera `sitemap.xml`**.
- Para hacerlo público en el futuro: `"indexable": true`; se generan canonical, sitemap y robots permisivo.

Importante: `robots.txt` y `noindex` son indicaciones que los buscadores respetan, no un control de acceso. Cualquiera con el enlace puede abrirlo y reenviarlo. No use contraseñas compartidas; si necesita acceso restringido real, Cloudflare Access (gratis hasta 50 usuarios) puede pedir un código por correo, a costa de que el reclutador se identifique.

## Pasos
1. Repositorio privado: ya creado como `morense-01/portafolio-profesional`.
2. Cloudflare: cree cuenta gratuita → **Workers & Pages → Create → Pages → Connect to Git** → autorice solo ese repositorio.
3. Configuración de build: comando `npm run build`, directorio de salida `dist`, variable `SITE_URL` = `https://<nombre-del-proyecto>.pages.dev`. Nombre sugerido del proyecto: `portafolio-mario`. Para un enlace difícil de adivinar, elija un nombre menos obvio y ponga el mismo valor en `siteUrl` de `content/site.json`.
4. Cada `git push` a `main` publica de nuevo. El enlace general es la URL `pages.dev`; cada expediente tiene el suyo (`/experiencia/madeco/`).
5. Desactive las vistas previas públicas: **Settings → Enable access policy** en Cloudflare Pages protege las URL de vista previa de ramas.

## Limitaciones
- Las vistas previas de LinkedIn/WhatsApp funcionan con la URL pública final (Open Graph); el `noindex` no las impide.
- No hay formulario de contacto: solo enlaces a canales verificados.
- Sin dominio propio la URL termina en `.pages.dev`; un dominio propio es opcional.
