# Portafolio profesional digital: Mario Méndez

Expediente profesional estático: perfil ejecutivo y técnico, un expediente independiente por empresa, logros con método de validación, certificaciones, proyectos, biblioteca de documentos, buscador y enlaces permanentes. Sin servidor, sin base de datos, sin servicios de pago y sin dependencias de npm.

## Decisión de hosting: repositorio privado en GitHub + Cloudflare Pages

Acceso solo por enlace, sin indexación (noindex, robots.txt `Disallow: /`, sin sitemap). GitHub Pages no sirve aquí porque exige repositorio público en el plan gratuito. Detalles y límites en [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md).

## Tecnología

- Generador propio en Node.js (`scripts/build.mjs`): lee JSON de `content/` y produce HTML en `dist/`. Código fuente 100% exportable, sin herramientas de IA ni servicios externos en tiempo de ejecución.
- CSS y JavaScript sin librerías. Fuentes del sistema. Sin cookies, sin analítica.
- Ambas vistas (ejecutiva y técnica) se generan desde los mismos datos; el selector solo muestra u oculta bloques.

## Inicio rápido

```bash
npm test        # genera dist/ en modo local y ejecuta las pruebas de calidad
npm run dev     # genera y sirve en http://localhost:4173
npm run build   # genera dist/ para producción (usa `SITE_URL`/`basePath`)
```

Requiere Node.js 18 o superior.

## Estructura

```
content/
  site.json                  URL pública, basePath, título y descripción
  profile/profile.json       perfil, competencias, enlaces, contacto
  experiencia/<empresa>/experiencia.json   un expediente por empresa
  achievements/achievements.json           repositorio central de métricas
  certifications/certifications.json       certificaciones, cursos, insignias
  projects/<proyecto>.json                 catálogo de proyectos
  documents/documents.json                 biblioteca de documentos
public/
  assets/                    CSS, JS, favicon
  documents/                 archivos publicables (PDF)
  certifications/            imágenes de insignias autorizadas
scripts/                     build.mjs, check.mjs, serve.mjs
docs/                        mantenimiento, despliegue, pruebas, pendientes
```

## Regla de publicación

Un registro aparece en el sitio, en el buscador y en el mapa del sitio solo si cumple:

- **Experiencias y proyectos:** `"public": true`.
- **Métricas:** `"public": true` y `"status": "validada"`.
- **Certificaciones:** `"public": true` y `"status": "verificada"`.
- **Documentos:** `"public": true`.
- **Enlaces de perfil:** `"verified": true`.

Los datos que no cumplen quedan solo en el repositorio de trabajo. Nota: el repositorio es privado, pero igualmente no escriba en ellos datos confidenciales (use únicamente cifras y nombres que no le importe que se vean, o guarde los borradores sensibles fuera del repositorio).

## Documentación

- [Mantenimiento: cómo editar y añadir contenido](docs/MANTENIMIENTO.md)
- [Despliegue gratuito paso a paso](docs/DESPLIEGUE.md)
- [Pruebas realizadas y errores detectados](docs/PRUEBAS.md)
- [Información pendiente de confirmar](docs/PENDIENTES.md) (generada por `npm run build`)
