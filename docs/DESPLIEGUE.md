# Despliegue en GitHub Pages (Activo)

El portafolio está publicado y en línea de forma gratuita mediante GitHub Pages y GitHub Actions.

## Enlace público activo
- **URL principal del portafolio:** https://morense-01.github.io/portafolio-profesional/

## Enlaces directos por expediente
- **ODS Logistics:** https://morense-01.github.io/portafolio-profesional/experiencia/ods-odw-logistics/
- **MADECO:** https://morense-01.github.io/portafolio-profesional/experiencia/madeco/
- **UNIPAGO:** https://morense-01.github.io/portafolio-profesional/experiencia/unipago/
- **Dominicana de Cales:** https://morense-01.github.io/portafolio-profesional/experiencia/dominicana-de-cales/
- **VICRISA:** https://morense-01.github.io/portafolio-profesional/experiencia/vicrisa/

## Privacidad ante buscadores (Modo privado por enlace)
- Todas las páginas tienen `<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">`.
- El archivo `robots.txt` bloquea a todos los rastreadores con `Disallow: /`.
- No existe `sitemap.xml`.
- **Resultado:** Ningún buscador (Google, Bing, etc.) indexará el portafolio. Solo podrán acceder las personas con las que compartas el enlace directo.

## Despliegue continuo automático
Cada vez que hagas cambios y ejecutes `git push`, el flujo de trabajo `.github/workflows/pages.yml` se ejecuta automáticamente:
1. Valida las pruebas de calidad (`npm test`).
2. Compila el sitio estático (`npm run build`).
3. Publica la versión actualizada en GitHub Pages en segundos.
