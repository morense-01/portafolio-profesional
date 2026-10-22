# Portafolio Profesional Digital: Mario Méndez

Expediente profesional estático de alta disponibilidad y diseño ejecutivo: perfil de Gerencia de TI y Dirección de Infraestructura/Cloud, expedientes por empresa, logros con métricas cuantificables, catálogo de más de 40 certificaciones e insignias verificadas, proyectos de implementación, repositorio documental, motor multilingüe y vistas especializadas (Ejecutiva / Técnica).

- **URL de Producción (GitHub Pages):** [https://morense-01.github.io/portafolio-profesional/](https://morense-01.github.io/portafolio-profesional/)
- **Acceso:** Exclusivo mediante enlace directo. Configuración estricta de privacidad (`noindex, nofollow`, `robots.txt Disallow: /`, sin `sitemap.xml`) para prevenir indexación en motores de búsqueda públicos.

---

## 1. Características Principales

1. **Identidad Profesional Canónica:** Mario Méndez — Gerente de Tecnología y Procesos | Infraestructura, Cloud & Operaciones.
2. **Sistema de Vistas Especializadas:**
   - **Vista Completa:** Acceso integral a toda la trayectoria, proyectos y credenciales.
   - **Vista Ejecutiva:** Enfoque en gobernanza, ROI, continuidad operativa, SLAs y optimización presupuestaria.
   - **Vista Técnica:** Detalle de topología de redes, nubes híbridas (Azure/GCP/AWS), ciberseguridad perimetral y administración de sistemas ERP (SAP Business One y S/4HANA).
3. **Motor Multilingüe de Ultra Baja Latencia:**
   - Traducción instantánea del lado del cliente para **Español, Inglés, Francés, Portugués, Alemán e Italiano** (0 ms de espera, sin llamadas bloqueantes ni recarga de página).
   - Selector inteligente con detección automática del idioma del navegador y persistencia local.
4. **Catálogo de Credenciales Verificadas (40+ Insignias):**
   - Integración de credenciales oficiales con enlaces de verificación directos a los emisores:
     - **Google Skills:** 16 insignias oficiales en Cloud Computing, Machine Learning, Networking y Generative AI.
     - **Credly:** Insignias validadas de Cisco CCNA (Introduction, Switching/Routing, Enterprise), IBM Cybersecurity, IBM Cloud y AWS Knowledge.
     - **Microsoft Learn:** Rutas certificadas en Azure, M365, Hybrid Cloud y Security.
     - **SAP Community:** Perfil oficial de consultoría y administración ERP.
     - **Anthropic:** Certificación profesional en Prompt Engineering con Claude.
5. **Métricas de Impacto Cuantificables:**
   - 9 indicadores de desempeño auditados (Disponibilidad 99.8%, Reducción del 18% en costos de licencias, 35% de mejora en SLAs de soporte, entre otros).
6. **Arquitectura Zero-Dependency:**
   - Generación estática propia en Node.js puro (`scripts/build.mjs`), sin dependencias de frameworks pesados, sin cookies y con estricta conformidad con Content Security Policy (CSP).

---

## 2. Comandos de Operación

```bash
# Ejecutar verificación de calidad y generación en modo local
npm test

# Servidor de previsualización local en http://localhost:4173
npm run dev

# Generar sitio para producción con basePath de GitHub Pages
npm run build
```

---

## 3. Estructura del Proyecto

```
content/
  site.json                  # Parámetros del sitio (URL pública, basePath, metadatos)
  profile/profile.json       # Datos profesionales, bio, resumen y competencias
  experiencia/               # Expedientes laborales estructurados
  achievements/              # Repositorio central de logros cuantificados
  certifications/            # Catálogo de certificaciones con emisor y enlace de verificación
  projects/                  # Fichas técnicas de proyectos ejecutados
  documents/                 # Catálogo documental y de evidencias
public/
  assets/                    # CSS responsive, JavaScript cliente, favicon
  certifications/            # Insignias gráficas y logotipos de emisores
scripts/
  build.mjs                  # Generador estático autónomo
  check.mjs                  # Suite de pruebas automatizadas (links, CSP, privacidad, 200 OK)
  serve.mjs                  # Servidor HTTP local de pruebas
docs/
  INVESTIGACION.md           # Informe de investigación autónoma y fuentes contrastadas
  MATRIZ_EVIDENCIAS.md       # Matriz de trazabilidad y categorización de evidencias
  INFORME_CALIDAD.md         # Resultados de auditoría y pruebas técnicas (QA)
  DESPLIEGUE.md              # Procedimiento de despliegue en GitHub Pages / Cloudflare
  MANTENIMIENTO.md           # Guía de actualización y mantenimiento del contenido
  PENDIENTES.md              # Estado de elementos pendientes o en preparación
```

---

## 4. Documentación de Referencia

- [Informe de Investigación y Fuentes](docs/INVESTIGACION.md)
- [Matriz de Trazabilidad y Evidencias](docs/MATRIZ_EVIDENCIAS.md)
- [Informe de Calidad y Pruebas Técnicas (QA)](docs/INFORME_CALIDAD.md)
- [Guía de Mantenimiento y Edición](docs/MANTENIMIENTO.md)
- [Guía de Despliegue en Producción](docs/DESPLIEGUE.md)
