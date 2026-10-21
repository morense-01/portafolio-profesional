# Mantenimiento del portafolio

Después de cualquier cambio: `npm test`. Si pasa, haga `git commit` y `git push`; Cloudflare Pages publica el sitio (y GitHub Actions ejecuta las pruebas).

## Añadir una empresa

1. Cree `content/experiencia/<slug>/experiencia.json` (copie otra carpeta de empresa). El `slug` define la URL: `/experiencia/<slug>/`.
2. Complete los campos. Esquema:

| Campo | Contenido |
|---|---|
| `slug`, `order` | Identificador y orden de aparición (0 = primero). |
| `public` | `true` para publicar. |
| `company`, `location`, `sector` | Datos de la empresa. Los vacíos o con "por confirmar" no se muestran. |
| `relationship` | Empleado, consultor externo o fundador. |
| `role`, `roleConfirmed` | El cargo solo se muestra si `roleConfirmed` es `true`. |
| `start`, `end`, `periodDisplay`, `periodNote` | Fechas y texto visible del período. |
| `summary`, `context[]` | Secciones 1 y 2. |
| `executive[]`, `operational[]` | Secciones 3 y 4 (visibles según la vista). |
| `cases[]` | Casos: `title`, `situation`, `problem`, `goal`, `responsibility`, `solution`, `technologies[]`, `result`, `metric`, `scope` (individual, equipo o empresa), `evidence`, `lessons`. |
| `impact[]` | Sección 6, solo con sustento. |
| `technologies[]` | `{ "name", "context" }`. |
| `evidence[]` | `{ "title", "url", "type" }`. Solo documentos autorizados. |
| `recruiterSummary[]` | De 5 a 8 puntos. |
| `pending[]` | Datos por confirmar; se listan en `docs/PENDIENTES.md`, nunca en el sitio. |

3. La empresa aparece sola en trayectoria, navegación entre expedientes, buscador y sitemap. Para guardar capturas o documentos de la empresa, use `public/documents/<slug>/` y enlácelos en `evidence`.

## Editar un puesto

Modifique el JSON de la empresa. Cuando confirme el cargo, escriba `role` y ponga `roleConfirmed: true`. Quite de `pending` lo ya resuelto.

## Registrar una certificación

En `content/certifications/certifications.json`, edite el registro: nombre oficial exacto, `issuer`, `type` (`certificacion`, `curso`, `insignia`, `formacion`), `date` (AAAA-MM), `expires`, `credentialId`, `verifyUrl`, `badgeImage` (archivo en `public/certifications/`, imagen oficial del emisor), `skills[]`. Para publicar: `"public": true` y `"status": "verificada"`. Las categorías están en el mismo archivo.

## Añadir un proyecto

Cree `content/projects/<slug>.json` copiando uno existente. Use `relatedCompany` con el slug de una empresa para vincularlo a su expediente. Indique `role` (empleado, consultor, fundador o independiente) y `status` reales. Nunca incluya claves, tokens ni accesos. Los diagramas deben estar sanitizados.

## Cambiar o publicar una métrica

En `content/achievements/achievements.json` complete **todos** los campos: `company` (nombre exacto de la empresa), `project`, `period`, `definition`, `baseline`, `result`, `method`, `validationSource`, `confidentiality` y `scope` (individual, equipo o empresa). Después cambie `status` a `validada` y `public` a `true`. No sume métricas de proyectos distintos.

## Reemplazar un documento (CV u otro)

1. Copie el archivo nuevo a `public/documents/` con nombre versionado, por ejemplo `cv-ejecutivo-2026-10.pdf`.
2. En `content/documents/documents.json`, agregue o edite el registro: `title`, `description`, `category`, `date`, `file`, `public: true`.
3. **Elimine el archivo anterior y su registro** para no dejar versiones inconsistentes. El botón de currículum del inicio usa el primer documento cuya categoría empiece por "CV".
4. Verifique que el contenido coincide con fechas y cargos de los expedientes.

## Datos de contacto

Complete `contact.email` y `contact.phone` en `content/profile/profile.json`. Se mostrarán en Contacto. Considere que un correo publicado puede recibir correo no deseado.

## Actualizar enlaces

En `profile.json` → `links`: ponga `verified: true` solo tras abrir el enlace y confirmar que es el perfil correcto.

## Imagen de previsualización

Reemplace `public/assets/og-default.png` (1200×630 px) por una imagen propia. La incluida es un degradado sin texto.

## Mantenimiento periódico

- Revise `docs/PENDIENTES.md` en cada actualización.
- Actualice `lastReview` en `content/site.json`.
- Revise enlaces externos cada trimestre.
