(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var base = document.body.dataset.base || '';

  // Menú móvil
  var mb = $('.menu-btn');
  if (mb) mb.addEventListener('click', function () {
    var m = $('#menu'); var o = m.classList.toggle('open'); mb.setAttribute('aria-expanded', String(o));
  });

  // Vista (completa / ejecutiva / técnica): la preferencia se conserva entre páginas.
  function setView(v) {
    document.body.dataset.view = v;
    $$('[data-set-view]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.setView === v)); });
    try { localStorage.setItem('view', v); } catch (e) {}
  }
  var saved = 'all';
  try { saved = localStorage.getItem('view') || 'all'; } catch (e) {}
  setView(['all', 'exec', 'tech'].indexOf(saved) > -1 ? saved : 'all');
  $$('[data-set-view]').forEach(function (b) { b.addEventListener('click', function () { setView(b.dataset.setView); }); });

  // Copiar, compartir, imprimir
  function copy(text, btn) {
    var done = function () { var t = btn.textContent; btn.textContent = 'Enlace copiado'; setTimeout(function () { btn.textContent = t; }, 1800); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, function () { window.prompt('Copie el enlace:', text); });
    else window.prompt('Copie el enlace:', text);
  }
  $$('[data-copy]').forEach(function (b) { b.addEventListener('click', function () { copy(b.dataset.copy, b); }); });
  $$('[data-share]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (navigator.share) navigator.share({ title: b.dataset.title, url: b.dataset.url }).catch(function () {});
      else copy(b.dataset.url, b);
    });
  });
  $$('[data-print]').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });

  // Filtro genérico por select -> atributo data-*
  function filterList(sel, items, attr, none) {
    var s = $(sel); if (!s) return;
    s.addEventListener('change', function () {
      var shown = 0;
      items.forEach(function (el) { var ok = !s.value || el.getAttribute(attr) === s.value; el.hidden = !ok; if (ok) shown++; });
      if (none) none.hidden = shown > 0;
    });
  }
  var none = $('#none');
  var certs = $$('#certs .cert');
  $$('[data-f]').forEach(function (s) {
    s.addEventListener('change', function () {
      var f = {}; $$('[data-f]').forEach(function (x) { f[x.dataset.f] = x.value; });
      var shown = 0;
      certs.forEach(function (c) { var ok = (!f.issuer || c.dataset.issuer === f.issuer) && (!f.cat || c.dataset.cat === f.cat) && (!f.year || c.dataset.year === f.year); c.hidden = !ok; if (ok) shown++; });
      if (none) none.hidden = shown > 0;
    });
  });
  $$('[data-cert-view]').forEach(function (b) {
    b.addEventListener('click', function () {
      $('#certs').classList.toggle('list', b.dataset.certView === 'list');
      $$('[data-cert-view]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    });
  });
  filterList('[data-pf]', $$('#projs > article'), 'data-type');
  filterList('[data-df]', $$('#docs > li'), 'data-cat');

  // =========================================================================
  // MOTOR DE TRADUCCIÓN NATIVO Y GESTIÓN MULTILINGÜE
  // =========================================================================

  var I18N = {
    en: {
      "Inicio": "Home",
      "Perfil ejecutivo": "Executive Profile",
      "Perfil técnico": "Technical Profile",
      "Trayectoria": "Career Timeline",
      "Logros": "Achievements & Metrics",
      "Certificaciones": "Certifications & Badges",
      "Proyectos": "Projects",
      "Documentos": "Documents & CV",
      "Contacto": "Contact",
      "Buscador": "Search",
      "Buscar": "Search",
      "Vista:": "View:",
      "Completa": "Full",
      "Ejecutiva": "Executive",
      "Técnica": "Technical",
      "Menú": "Menu",
      "Saltar al contenido": "Skip to content",
      "Buscar en el sitio": "Search the site",
      "Buscar empresa, tecnología, proyecto…": "Search company, tech, project…",

      "Gerente de Tecnología y Procesos | Eficiencia, Cumplimiento y Mejora Continua · Ingeniero en Sistemas":
        "IT & Process Manager | Efficiency, Compliance & Continuous Improvement · Systems Engineer",
      "Transformo necesidades de negocio en soluciones tecnológicas seguras, estables, eficientes y medibles.":
        "Transforming business needs into secure, stable, efficient, and measurable technology solutions.",
      "Santo Domingo Oeste, Santo Domingo, República Dominicana": "Santo Domingo, Dominican Republic",

      "Ver trayectoria": "View Career Timeline",
      "Descargar currículum": "Download Resume (CV)",
      "Consultar currículum": "View Resume (CV)",
      "Compartir portafolio": "Share Portfolio",
      "Compartir enlace": "Share Link",
      "Copiar enlace": "Copy Link",
      "Enlace copiado": "Link copied!",
      "Imprimir o guardar PDF": "Print or Save PDF",
      "Enlace permanente:": "Permanent link:",
      "Volver al inicio": "Back to Home",
      "Abrir": "Open",
      "Descargar": "Download",
      "Verificar credencial en emisor oficial": "Verify credential on official issuing site",
      "Perfiles oficiales para verificación directa": "Official Profiles for Direct Verification",
      "Para corroborar la autenticidad de cada credencial e insignia, los reclutadores pueden consultar los registros públicos oficiales:":
        "To verify the authenticity of each credential and badge, recruiters can access the official public registries:",
      "Todas": "All",
      "Todos": "All",
      "Tarjetas": "Cards",
      "Lista compacta": "Compact list",
      "Entidad": "Issuer",
      "Categoría": "Category",
      "Año": "Year",
      "Tipo de proyecto": "Project type",
      "Empresa": "Company",
      "Área": "Area",
      "Tecnología": "Technology",
      "Certificación": "Certification",
      "Texto": "Text",

      "Resumen ejecutivo": "Executive Summary",
      "Resumen de trayectoria ejecutiva": "Executive Career Summary",
      "Áreas de especialización": "Areas of Expertise",
      "Sectores": "Industry Sectors",
      "Resultados profesionales": "Key Professional Results",
      "Explore el expediente": "Explore the Professional Dossier",
      "Dos formas de lectura:": "Two reading modes:",
      "perfil ejecutivo": "executive profile",
      "para dirección y selección, y": "for senior leadership and hiring, and",
      "perfil operativo y técnico": "operational & technical profile",
      "para entrevistadores especializados.": "for specialized interviewers.",
      "Evaluación de Competencias Directivas (Personal de dirección y alta gerencia (ISCO Grupo 1))":
        "Executive Leadership Competencies Assessment (Senior Management & Executives - ISCO Group 1)",
      "Calificación obtenida en evaluación profesional para posiciones de dirección y alta gerencia de tecnología:":
        "Score obtained in professional assessment for IT directorship and senior technology management roles:",
      "Conocimientos": "Knowledge",
      "Habilidades": "Skills",
      "Comprensión": "Comprehension",
      "Actitudes": "Attitudes",
      "Aptitudes y Habilidades Clave": "Key Aptitudes & Leadership Skills",
      "Comunicación asertiva": "Assertive communication",
      "Desarrollo del trabajo y liderazgo": "Job execution & team leadership",
      "Resistencia a la adversidad y manejo de presión": "Resilience & pressure management",
      "Relaciones interpersonales y colaboración": "Interpersonal relations & collaboration",
      "Condiciones y Modalidades de Contratación": "Hiring Terms & Availability",
      "Modalidades Aceptadas": "Accepted Work Arrangements",
      "Situación laboral:": "Current status:",
      "Movilidad:": "Mobility:",
      "Ubicación y Relocalización": "Location & Relocation",
      "Ubicación actual:": "Current location:",
      "Relocalizable en:": "Relocatable to:",
      "Nivel de inglés:": "English level:",
      "Formación académica:": "Academic degree:",
      "Referencias Directivas y Laborales": "Executive & Professional References",
      "Competencias directivas demostradas": "Demonstrated Executive Competencies",
      "Competencias estratégicas respaldadas por cargos gerenciales y consultoría en entornos de alta exigencia.":
        "Strategic competencies backed by managerial positions and consulting in high-demand environments.",
      "Perfil operativo y técnico": "Operational & Technical Profile",
      "Para gerentes de TI, líderes técnicos, responsables de infraestructura y entrevistadores especializados. Cada competencia indica su uso práctico y alcance real.":
        "For IT managers, technical leads, infrastructure directors, and technical interviewers. Each competence indicates practical application and real-world scope.",
      "Trayectoria profesional": "Career Timeline",
      "Cronología de empresas y posiciones confirmadas, de la más reciente a la más antigua. Cada expediente tiene su propio enlace permanente.":
        "Chronology of confirmed companies and positions, from most recent to oldest. Each dossier has its own permanent link.",
      "Logros y métricas": "Verified Achievements & Metrics",
      "Cada resultado se asocia a la empresa y al proyecto que lo originó, con su método de cálculo y fuente de validación. No se suman resultados de proyectos distintos.":
        "Each result is tied to the company and project that originated it, with its calculation methodology and validation source. Metrics from separate projects are never combined.",
      "Certificaciones, cursos e insignias": "Certifications, Courses & Badges",
      "Credenciales con denominación oficial, fecha y enlace original de verificación directa con el emisor.":
        "Credentials with official titles, dates, and direct links to verify with the issuing authority.",
      "Proyectos tecnológicos": "Technology Projects",
      "Cada ficha indica su estado real y el rol desempeñado. Un prototipo no se presenta como producto terminado.":
        "Each profile indicates its real status and role played. Prototypes are never represented as finished products.",
      "Biblioteca de documentos": "Document Library",
      "Documentos públicos o autorizados. Cada versión nueva reemplaza a la anterior para evitar datos inconsistentes.":
        "Public or authorized documents. Each new version supersedes the previous one to avoid inconsistent data.",
      "Contacto profesional": "Professional Contact",
      "Canales directos para reclutadores, comités de selección y directores ejecutivos.":
        "Direct communication channels for recruiters, selection committees, and executive directors.",
      "Datos de Contacto Directo": "Direct Contact Details",
      "Modalidades de Contratación": "Hiring Arrangements",
      "Abierto a propuestas formales que requieran liderazgo y resolución técnica:":
        "Open to formal proposals requiring technology leadership and technical execution:",
      "Referencias Profesionales": "Professional References",

      "años en tecnología": "years in technology",
      "años en gerencia de TI": "years in IT management",
      "empresas confirmadas": "confirmed companies",
      "métricas validadas": "validated metrics",
      "disponibilidad en servicios críticos": "availability in critical services",
      "reducción en incidentes de seguridad": "reduction in security incidents",

      "años de experiencia en tecnología": "years of technology experience",
      "años en posiciones gerenciales de TI": "years in IT management positions",
      "25+ años de trayectoria profesional, incluyendo 17 años en dirección tecnológica y gestión de infraestructura en logística, manufactura, finanzas y operaciones continuas.":
        "25+ years of professional career, including 17 years in technology leadership and infrastructure management across logistics, manufacturing, finance, and continuous operations.",
      "Ingeniero en Sistemas de Computación con más de 25 años de experiencia en tecnología y 17 años en dirección tecnológica, infraestructura y operaciones TI.":
        "Systems Engineer with over 25 years of experience in technology and 17 years in technology leadership, infrastructure, and IT operations.",
      "Ingeniero en Sistemas de Computación con más de 21 años de experiencia en tecnología y más de 12 años en liderazgo de infraestructura, operaciones TI y procesos de información.":
        "Systems Engineer with over 25 years of experience in technology and more than 17 years in leadership of IT infrastructure, operations, and information processes.",
      "Trayectoria consolidada en entornos de alta exigencia: sector logístico (almacén de 30,000+ ft²), manufactura industrial continua 24/7 y sector financiero regulado (UNIPAGO / BCRD / SIMV).":
        "Established track record in high-demand environments: logistics (30,000+ sq ft warehouse), continuous 24/7 industrial manufacturing, and regulated financial sector (UNIPAGO / Central Bank BCRD / SIMV).",
      "Especialista en dirección estratégica de TI, arquitectura cloud híbrida (Azure/AWS), redes empresariales y de planta, ciberseguridad (Zero Trust, NIST CSF, ISO 27001), gobierno de servicios (SLA) y sistemas ERP (SAP S/4HANA, SAP Business One).":
        "Specialist in strategic IT leadership, hybrid cloud architecture (Azure/AWS), enterprise & industrial networks, cybersecurity (Zero Trust, NIST CSF, ISO 27001), IT service governance (SLA), and ERP systems (SAP S/4HANA, SAP Business One).",
      "Historial comprobado de resultados medibles: 99.9% de disponibilidad operativa durante más de 3 años, 60% de reducción en incidentes de seguridad, cero hallazgos críticos en 3 ciclos de auditorías financieras y +30% de incremento en eficiencia operativa.":
        "Proven history of measurable results: 99.9% operational availability over 3+ years, 60% reduction in security incidents, zero critical findings across 3 financial audit cycles, and +30% increase in operational efficiency.",

      "Dirección estratégica de TI y alineación con objetivos de negocio": "Strategic IT leadership and business alignment",
      "Gestión de infraestructura, servidores y cloud híbrido (Azure/AWS)": "Infrastructure, server & hybrid cloud management (Azure/AWS)",
      "Continuidad del negocio (BCP), recuperación ante desastres (DRP) y alta disponibilidad (99.9%)": "Business Continuity (BCP), Disaster Recovery (DRP) & High Availability (99.9%)",
      "Ciberseguridad corporativa, Zero Trust, NIST CSF e ISO 27001": "Enterprise cybersecurity, Zero Trust, NIST CSF & ISO 27001",
      "Administración de redes empresariales, conectividad LAN/WAN y seguridad perimetral": "Enterprise networks, LAN/WAN connectivity & perimeter security",
      "Gobierno de servicios TI, acuerdos de nivel de servicio (SLA) y mesa de ayuda": "IT service governance, SLAs & helpdesk management",
      "Gestión presupuestaria (CAPEX/OPEX), optimización FinOps y negociación con proveedores": "Budget management (CAPEX/OPEX), FinOps optimization & vendor negotiation",
      "Sistemas empresariales y ERP (SAP S/4HANA, SAP Business One, WMS/RF)": "Enterprise systems & ERP (SAP S/4HANA, SAP Business One, WMS/RF)",
      "Gestión de bases de datos y analítica (SQL Server, MySQL, Oracle, SSIS, SSRS, Power BI)": "Database management & analytics (SQL Server, MySQL, Oracle, SSIS, SSRS, Power BI)",
      "Automatización de procesos administrativos e integración de Inteligencia Artificial": "Administrative process automation & Artificial Intelligence integration",

      "Logística y Cadena de Suministro": "Logistics & Supply Chain",
      "Manufactura e Industria Continua 24/7": "24/7 Continuous Manufacturing & Industry",
      "Servicios Financieros Regulados": "Regulated Financial Services",
      "Operaciones y Servicios Tecnológicos": "Technology Operations & Services",

      "Fijo / Indefinido": "Full-time / Permanent",
      "Por obra y servicio / Proyectos": "Project-based / Contract",
      "Consultoría / Freelance": "Consulting / Freelance",
      "Teletrabajo / Remoto / Híbrido": "Remote / Hybrid / On-site",
      "Actualmente con empleo · Abierto a oportunidades directivas y gerenciales": "Currently employed · Open to executive & directorship opportunities",
      "Licencia y vehículo propio": "Valid driver's license and private vehicle",
      "Profesional (Lectura y conversación fluida técnica)": "Professional (Fluent technical reading and conversation)",
      "Ingeniero en Sistemas de Computación": "Systems Engineer",

      "Resultado": "Result",
      "Empresa y proyecto": "Company & Project",
      "Período": "Period",
      "Antes → después": "Before → After",
      "Método": "Method",
      "Fuente": "Source",
      "Alcance": "Scope"
    },
    fr: {
      "Inicio": "Accueil",
      "Perfil ejecutivo": "Profil Exécutif",
      "Perfil técnico": "Profil Technique",
      "Trayectoria": "Parcours",
      "Logros": "Réalisations",
      "Certificaciones": "Certifications",
      "Proyectos": "Projets",
      "Documentos": "Documents",
      "Contacto": "Contact",
      "Buscador": "Recherche",
      "Buscar": "Rechercher",
      "Vista:": "Vue :",
      "Completa": "Complète",
      "Ejecutiva": "Exécutive",
      "Técnica": "Technique",
      "Menú": "Menu",
      "Ver trayectoria": "Voir le parcours",
      "Descargar currículum": "Télécharger le CV",
      "Consultar currículum": "Consulter le CV",
      "Compartir portafolio": "Partager le portfolio",
      "Copiar enlace": "Copier le lien",
      "Enlace copiado": "Lien copié !",
      "Resumen ejecutivo": "Résumé Exécutif",
      "Áreas de especialización": "Domaines d'expertise",
      "Sectores": "Secteurs d'activité",
      "Resultados profesionales": "Résultats Professionnels",
      "Explore el expediente": "Explorer le dossier",
      "Conocimientos": "Connaissances",
      "Habilidades": "Compétences",
      "Comprensión": "Compréhension",
      "Actitudes": "Attitudes",
      "Ubicación y Relocalización": "Localisation et Mobilité",
      "Referencias Directivas y Laborales": "Références de Direction",
      "Competencias directivas demostradas": "Compétences de Direction Démontrées",
      "Perfil operativo y técnico": "Profil Opérationnel et Technique",
      "Trayectoria profesional": "Parcours Professionnel",
      "Logros y métricas": "Réalisations et Métriques",
      "Certificaciones, cursos e insignias": "Certifications et Badges",
      "Proyectos tecnológicos": "Projets Technologiques",
      "Biblioteca de documentos": "Bibliothèque de Documents",
      "Contacto profesional": "Contact Professionnel"
    },
    pt: {
      "Inicio": "Início",
      "Perfil ejecutivo": "Perfil Executivo",
      "Perfil técnico": "Perfil Técnico",
      "Trayectoria": "Trajetória",
      "Logros": "Conquistas",
      "Certificaciones": "Certificações",
      "Proyectos": "Projetos",
      "Documentos": "Documentos",
      "Contacto": "Contato",
      "Buscador": "Buscador",
      "Buscar": "Buscar",
      "Vista:": "Visualização:",
      "Completa": "Completa",
      "Ejecutiva": "Executiva",
      "Técnica": "Técnica",
      "Menú": "Menu",
      "Ver trayectoria": "Ver trajetória",
      "Descargar currículum": "Baixar Currículo",
      "Consultar currículum": "Consultar Currículo",
      "Compartir portafolio": "Compartilhar portfólio",
      "Copiar enlace": "Copiar link",
      "Enlace copiado": "Link copiado!",
      "Resumen ejecutivo": "Resumo Executivo",
      "Áreas de especialización": "Áreas de Especialização",
      "Sectores": "Setores de Atuação",
      "Resultados profesionales": "Resultados Profissionais",
      "Explore el expediente": "Explorar o Dossiê",
      "Conocimientos": "Conhecimentos",
      "Habilidades": "Habilidades",
      "Comprensión": "Compreensão",
      "Actitudes": "Atitudes",
      "Ubicación y Relocalización": "Localização e Relocação",
      "Referencias Directivas y Laborales": "Referências Trabalhistas",
      "Competencias directivas demostradas": "Competências Diretivas Demonstradas",
      "Perfil operativo y técnico": "Perfil Operacional e Técnico",
      "Trayectoria profesional": "Trajetória Profissional",
      "Logros y métricas": "Conquistas e Métricas",
      "Certificaciones, cursos e insignias": "Certificações e Emblemas",
      "Proyectos tecnológicos": "Projetos Tecnológicos",
      "Biblioteca de documentos": "Biblioteca de Documentos",
      "Contacto profesional": "Contato Profissional"
    },
    de: {
      "Inicio": "Startseite",
      "Perfil ejecutivo": "Führungsprofil",
      "Perfil técnico": "Technisches Profil",
      "Trayectoria": "Werdegang",
      "Logros": "Erfolge",
      "Certificaciones": "Zertifizierungen",
      "Proyectos": "Projekte",
      "Documentos": "Dokumente",
      "Contacto": "Kontakt",
      "Buscador": "Suche",
      "Buscar": "Suchen",
      "Vista:": "Ansicht:",
      "Completa": "Vollständig",
      "Ejecutiva": "Führung",
      "Técnica": "Technik",
      "Menú": "Menü",
      "Ver trayectoria": "Werdegang ansehen",
      "Descargar currículum": "Lebenslauf herunterladen",
      "Consultar currículum": "Lebenslauf ansehen",
      "Compartir portafolio": "Portfolio teilen",
      "Copiar enlace": "Link kopieren",
      "Enlace copiado": "Link kopiert!",
      "Resumen ejecutivo": "Zusammenfassung für Führungskräfte",
      "Áreas de especialización": "Fachbereiche",
      "Sectores": "Branchen",
      "Resultados profesionales": "Berufliche Erfolge",
      "Explore el expediente": "Dossier erkunden",
      "Conocimientos": "Fachwissen",
      "Habilidades": "Fähigkeiten",
      "Comprensión": "Verständnis",
      "Actitudes": "Haltung",
      "Ubicación y Relocalización": "Standort & Mobilität",
      "Referencias Directivas y Laborales": "Führungszeugnisse & Referenzen",
      "Competencias directivas demostradas": "Nachgewiesene Führungskompetenzen",
      "Perfil operativo y técnico": "Operatives & Technisches Profil",
      "Trayectoria profesional": "Beruflicher Werdegang",
      "Logros y métricas": "Erfolge & Kennzahlen",
      "Certificaciones, cursos e insignias": "Zertifizierungen & Badges",
      "Proyectos tecnológicos": "Technologische Projekte",
      "Biblioteca de documentos": "Dokumentenbibliothek",
      "Contacto profesional": "Professioneller Kontakt"
    },
    it: {
      "Inicio": "Home",
      "Perfil ejecutivo": "Profilo Esecutivo",
      "Perfil técnico": "Profilo Tecnico",
      "Trayectoria": "Percorso",
      "Logros": "Traguardi",
      "Certificaciones": "Certificazioni",
      "Proyectos": "Progetti",
      "Documentos": "Documenti",
      "Contacto": "Contatto",
      "Buscador": "Cerca",
      "Buscar": "Cerca",
      "Vista:": "Vista:",
      "Completa": "Completa",
      "Ejecutiva": "Esecutiva",
      "Técnica": "Tecnica",
      "Menú": "Menu",
      "Ver trayectoria": "Vedi percorso",
      "Descargar currículum": "Scarica CV",
      "Consultar currículum": "Consulta CV",
      "Compartir portafolio": "Condividi portfolio",
      "Copiar enlace": "Copia link",
      "Enlace copiado": "Link copiato!",
      "Resumen ejecutivo": "Sintesi Esecutiva",
      "Áreas de especialización": "Aree di Competenza",
      "Sectores": "Settori",
      "Resultados profesionales": "Risultati Professionali",
      "Explore el expediente": "Esplora il Fascicolo",
      "Conocimientos": "Conoscenze",
      "Habilidades": "Competenze",
      "Comprensión": "Comprensione",
      "Actitudes": "Attitudini",
      "Ubicación y Relocalización": "Ubicazione e Rilocazione",
      "Referencias Directivas y Laborales": "Referenze Direttive",
      "Competencias directivas demostradas": "Competenze Direttive Dimostrate",
      "Perfil operativo y técnico": "Profilo Operativo e Tecnico",
      "Trayectoria profesional": "Percorso Professionale",
      "Logros y métricas": "Traguardi e Metriche",
      "Certificaciones, cursos e insignias": "Certificazioni e Badge",
      "Proyectos tecnológicos": "Progetti Tecnologici",
      "Biblioteca de documentos": "Biblioteca Documenti",
      "Contacto profesional": "Contatto Professionale"
    }
  };

  // Mapas para almacenar el contenido original en español
  var originalTexts = new Map();
  var originalAttrs = new Map();

  function walkDomNodes(node, callback) {
    if (!node) return;
    if (node.nodeType === 3) { // Text Node
      callback(node);
    } else if (node.nodeType === 1) { // Element Node
      var tag = node.tagName ? node.tagName.toLowerCase() : '';
      if (tag === 'script' || tag === 'style' || tag === 'noscript') return;
      if (node.classList && (node.classList.contains('notranslate') || (node.closest && node.closest('.notranslate')))) return;
      var child = node.firstChild;
      while (child) {
        walkDomNodes(child, callback);
        child = child.nextSibling;
      }
    }
  }

  function translateDom(targetLang) {
    document.documentElement.lang = targetLang;
    var dict = I18N[targetLang];

    if (!dict || targetLang === 'es') {
      originalTexts.forEach(function (orig, node) {
        if (node.nodeValue !== orig) node.nodeValue = orig;
      });
      originalAttrs.forEach(function (origMap, el) {
        Object.keys(origMap).forEach(function (attr) {
          el.setAttribute(attr, origMap[attr]);
        });
      });
      return;
    }

    var keys = Object.keys(dict).sort(function (a, b) { return b.length - a.length; });

    walkDomNodes(document.body, function (node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return;
      if (!originalTexts.has(node)) {
        originalTexts.set(node, node.nodeValue);
      }
      var current = originalTexts.get(node);
      var trimmed = current.trim();
      if (dict[trimmed]) {
        node.nodeValue = current.replace(trimmed, dict[trimmed]);
      } else {
        var replaced = current;
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];
          if (replaced.indexOf(k) > -1) {
            replaced = replaced.split(k).join(dict[k]);
          }
        }
        if (replaced !== current) {
          node.nodeValue = replaced;
        }
      }
    });

    var inputs = Array.prototype.slice.call(document.querySelectorAll('input[placeholder], [title]'));
    inputs.forEach(function (el) {
      if (el.closest && el.closest('.notranslate')) return;
      if (!originalAttrs.has(el)) originalAttrs.set(el, {});
      var stored = originalAttrs.get(el);
      ['placeholder', 'title'].forEach(function (attr) {
        var val = el.getAttribute(attr);
        if (val) {
          if (!stored[attr]) stored[attr] = val;
          var orig = stored[attr];
          if (dict[orig.trim()]) {
            el.setAttribute(attr, dict[orig.trim()]);
          }
        }
      });
    });
  }

  function getBrowserLang() {
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || navigator.userLanguage || 'es'];
    for (var i = 0; i < list.length; i++) {
      var raw = (list[i] || '').toLowerCase().trim();
      if (!raw) continue;
      if (raw.startsWith('zh-tw') || raw.startsWith('zh-hk')) return 'zh-TW';
      if (raw.startsWith('zh')) return 'zh-CN';
      var primary = raw.split('-')[0];
      if (primary) return primary;
    }
    return 'es';
  }

  function setTransCookie(targetLang) {
    var val = '/es/' + (targetLang === 'es' ? 'es' : targetLang);
    document.cookie = 'googtrans=' + val + '; path=/; SameSite=Lax';
    if (base) {
      document.cookie = 'googtrans=' + val + '; path=' + base + '; SameSite=Lax';
      document.cookie = 'googtrans=' + val + '; path=' + base + '/; SameSite=Lax';
    }
  }

  function triggerGoogleTranslate(targetLang) {
    var tries = 0;
    var interval = setInterval(function () {
      tries++;
      var combo = document.querySelector('.goog-te-combo');
      if (combo) {
        clearInterval(interval);
        if (combo.value !== targetLang) {
          combo.value = targetLang;
          combo.dispatchEvent(new Event('change'));
        }
      } else if (tries > 35) {
        clearInterval(interval);
      }
    }, 100);
  }

  function updateLangUI(lang) {
    $$('.lang-btn').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang));
    });
    var sel = $('.lang-select');
    if (sel) {
      sel.value = (['es','en','fr','pt','de','it'].indexOf(lang) > -1) ? '' : lang;
    }
  }

  function applyLanguage(targetLang) {
    if (!targetLang) targetLang = 'es';
    try { localStorage.setItem('portfolio_lang', targetLang); } catch (e) {}
    updateLangUI(targetLang);

    // Eliminar cookies previas de googtrans para que no quede residuo en el navegador
    try {
      var d = new Date();
      d.setTime(d.getTime() - 10000);
      var expires = 'expires=' + d.toUTCString();
      document.cookie = 'googtrans=; path=/; ' + expires;
      if (base) {
        document.cookie = 'googtrans=; path=' + base + '; ' + expires;
        document.cookie = 'googtrans=; path=' + base + '/; ' + expires;
      }
    } catch (e) {}

    // Traducción nativa inmediata en el DOM (latencia 0 ms)
    translateDom(targetLang);
  }

  // Asegurar que la barra superior de Google Translate permanezca oculta y no desplace el body
  function suppressGoogleBanner() {
    var banner = document.querySelector('.goog-te-banner-frame');
    if (banner) {
      banner.style.display = 'none';
      banner.style.visibility = 'hidden';
      banner.style.height = '0';
    }
    // Suprimir cualquier iframe inyectado directamente en el body por Google Translate
    var bodyIframes = document.querySelectorAll('body > iframe, body > .skiptranslate');
    bodyIframes.forEach(function (el) {
      if (!el.classList.contains('lang-bar')) {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.height = '0';
      }
    });
    if (document.body.style.top && document.body.style.top !== '0px') {
      document.body.style.top = '0px';
    }
    if (document.documentElement.style.top && document.documentElement.style.top !== '0px') {
      document.documentElement.style.top = '0px';
    }
  }
  setInterval(suppressGoogleBanner, 100);

  // Inicialización de idioma
  var savedLang = null;
  try { savedLang = localStorage.getItem('portfolio_lang'); } catch (e) {}
  var activeLang = savedLang || getBrowserLang() || 'es';

  updateLangUI(activeLang);
  if (activeLang && activeLang !== 'es') {
    applyLanguage(activeLang);
  }

  // Eventos de usuario para selección de idioma
  $$('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyLanguage(btn.dataset.lang);
    });
  });

  var lSelect = $('.lang-select');
  if (lSelect) {
    lSelect.addEventListener('change', function () {
      if (lSelect.value) {
        applyLanguage(lSelect.value);
      }
    });
  }

  // Integración opcional con widget oficial de Google Translate si carga en segundo plano
  window.googleTranslateElementInit = function () {
    if (window.google && window.google.translate) {
      new window.google.translate.TranslateElement({
        pageLanguage: 'es',
        autoDisplay: false,
        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
      }, 'google_translate_element');

      if (activeLang && activeLang !== 'es') {
        setTimeout(function () {
          triggerGoogleTranslate(activeLang);
        }, 200);
      }
    }
  };

})();
