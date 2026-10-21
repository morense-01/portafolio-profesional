# Pruebas realizadas y errores detectados

Fecha: 2026-10-20. Entorno: Windows, Node 24, servidor local que imita GitHub Pages (`/ruta/` → `index.html`, `404.html`).

## Automatizadas (`npm test`, también se ejecutan en cada despliegue)

| Prueba | Resultado |
|---|---|
| 21 páginas responden HTTP 200 por URL directa | Aprobada |
| Título, descripción, Open Graph con imagen absoluta, `lang`, un único `h1`, `alt` en imágenes | Aprobada |
| 414 enlaces y recursos internos, incluidas anclas (`#id`) | Aprobada, sin enlaces rotos |
| Enlaces externos con `rel="noopener noreferrer"` | Aprobada |
| 404 personalizada para rutas inexistentes | Aprobada |
| `robots.txt`, `sitemap.xml`, imagen PNG de Open Graph | Aprobada |
| Métricas, certificaciones y proyectos no validados ausentes del HTML y del índice de búsqueda | Aprobada |
| Enlace no verificado (5mtechnology.com) no publicado | Aprobada |
| Sin IP, credenciales, texto de relleno, scripts/estilos en línea ni rastreadores | Aprobada |
| Build con `SITE_BASE=/portafolio` genera URLs con prefijo | Aprobada |

## Verificaciones externas manuales

| Enlace | Resultado |
|---|---|
| github.com/morense-01 | HTTP 200, perfil `morense-01`. |
| linkedin.com/in/mariomendeza/ | LinkedIn devuelve 999 a clientes automáticos; **confirmar manualmente**. |
| 5mtechnology.com | **Error de confianza del certificado TLS** desde el equipo de prueba. Enlace oculto hasta confirmar. |

## No realizadas (requieren acción del titular)

- **Pruebas en navegador real** (Chrome, Edge, móvil): no hubo navegador disponible en este entorno. Revisar manualmente: menú móvil, selector de vista, filtros de certificaciones/proyectos/documentos y buscador. Su lógica está en `public/assets/app.js` (sintaxis validada). Los filtros de certificaciones y documentos no se ejercitan con datos reales porque aún no hay registros públicos.
- Consola del navegador sin errores, Lighthouse/accesibilidad con herramienta: pendientes de ejecutar tras publicar.
- Apertura de documentos: no hay documentos cargados todavía.
- Vista previa en LinkedIn: requiere la URL pública.

## Errores detectados y corregidos

- Prueba de texto de relleno marcaba la palabra «todo» en español: patrón corregido a coincidencia exacta.
- Ningún otro error pendiente en las pruebas automatizadas.

## Limitaciones conocidas

- Los resultados, certificaciones y documentos están vacíos por diseño hasta su validación (ver `PENDIENTES.md`).
- Los expedientes de varias empresas contienen solo los datos confirmados en el encargo.
