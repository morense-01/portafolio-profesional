// Generador del sitio estático. Sin dependencias: solo Node >= 18.
// Lee /content y /public y escribe /dist. Solo publica registros con public:true.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const rd = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const LOCAL = process.argv.includes('--local');

// ---------- carga de contenido ----------
const site = rd('content/site.json');
const profile = rd('content/profile/profile.json');
const BASE = LOCAL ? '' : (process.env.SITE_BASE ?? site.basePath ?? '').replace(/\/$/, '');
const SITE_URL = (process.env.SITE_URL ?? site.siteUrl).replace(/\/$/, '');
const certData = rd('content/certifications/certifications.json');
const docData = rd('content/documents/documents.json');
const achData = rd('content/achievements/achievements.json');
const portfolioData = rd('content/portfolios/portfolios.json');
const portfolios = portfolioData.items || [];

const allExp = fs.readdirSync(path.join(ROOT, 'content/experiencia'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => rd(`content/experiencia/${d.name}/experiencia.json`));
const allProjects = fs.readdirSync(path.join(ROOT, 'content/projects')).filter((f) => f.endsWith('.json')).map((f) => rd(`content/projects/${f}`));

const exps = allExp.filter((e) => e.public).sort((a, b) => a.order - b.order);
const projects = allProjects.filter((p) => p.public);
const certs = certData.items.filter((c) => c.public && c.status === 'verificada');
const docs = docData.items.filter((d) => d.public);
const metrics = achData.items.filter((m) => m.public && m.status === 'validada');
const links = profile.links.filter((l) => l.verified);

// ---------- utilidades ----------
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const L = (p) => BASE + p;
const abs = (p) => SITE_URL + BASE + p;
const clean = (s) => (s && !/por confirmar|por definir/i.test(s) ? s : '');
const ul = (items, cls = '') => (items.length ? `<ul class="${cls}">${items.map((i) => `<li>${esc(i).replace(/&lt;strong&gt;/g, '<strong>').replace(/&lt;\/strong&gt;/g, '</strong>')}</li>`).join('')}</ul>` : '');
const empty = '<p class="muted">Información en preparación.</p>';
const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const ext = (u, t) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t)}</a>`;
const written = [];
function out(rel, content) {
  const f = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
  written.push(rel);
}

// ---------- plantilla ----------
const NAV = [
  ['/', 'Inicio'], ['/perfil-ejecutivo/', 'Perfil ejecutivo'], ['/perfil-tecnico/', 'Perfil Operativo'],
  ['/trayectoria/', 'Trayectoria'], ['/logros/', 'Logros'], ['/certificaciones/', 'Certificaciones'],
  ['/proyectos/', 'Proyectos'], ['/documentos/', 'Documentos'],
];
function layout({ title, desc, route, body, noindex = false, ld = null, type = 'website', standalone = false }) {
  const full = title === site.shortName ? (site.minimal ? site.shortName : site.title) : `${title} | ${site.shortName}`;
  const url = abs(route);
  const nav = NAV.map(([r, t]) => `<li><a href="${L(r)}"${r === route || (r !== '/' && route.startsWith(r)) ? ' aria-current="page"' : ''}>${t}</a></li>`).join('');
  const brandHref = standalone ? '#contenido' : L('/');
  const showMenu = !site.minimal && !standalone;
  return `<!doctype html>
<html lang="${site.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc)}">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; base-uri 'none'; form-action 'none'; object-src 'none'">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="theme-color" content="#0b2545">
${(noindex || !site.indexable) ? '<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">' : `<link rel="canonical" href="${url}">`}
<link rel="icon" href="${L('/assets/favicon.svg')}" type="image/svg+xml">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${esc(site.shortName)}">
<meta property="og:locale" content="${site.locale}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${abs('/assets/og-default.png')}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(site.shortName)}: portafolio profesional">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="${L('/assets/styles.css')}?v=201220">
${ld ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>` : ''}
</head>
<body data-view="all" data-base="${esc(BASE)}">
<a class="skip" href="#contenido">Saltar al contenido</a>
<header class="site-header">
  <div class="wrap bar">
    <a class="brand" href="${brandHref}"><span class="mark" aria-hidden="true">MM</span><span>${esc(site.shortName)}</span></a>
    ${showMenu ? `<button class="menu-btn" aria-expanded="false" aria-controls="menu">Menú</button>
    <nav id="menu" aria-label="Principal"><ul>${nav}</ul></nav>` : ''}
  </div>
</header>
<main id="contenido">
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    ${standalone ? `<p><a href="#contenido">Volver arriba ↑</a></p>` : (site.minimal ? '' : `<p><a href="${L('/')}">Volver al inicio</a></p>`)}
  </div>
</footer>
<script src="${L('/assets/app.js')}?v=201220" defer></script>
</body>
</html>
`;
}
const shareBar = (route, title) => `<div class="actions no-print"><button class="btn ghost" data-share data-url="${abs(route)}" data-title="${esc(title)}">Compartir enlace</button><button class="btn ghost" data-copy="${abs(route)}">Copiar enlace</button><button class="btn ghost" data-print>Imprimir o guardar PDF</button></div>`;
const hero = (h, lead, route, extra = '', showShare = true) => `<section class="page-head"><div class="wrap"><nav class="crumbs" aria-label="Ruta"><a href="${L('/')}">Inicio</a> › <span>${esc(h)}</span></nav><h1>${esc(h)}</h1>${lead ? `<p class="lead">${esc(lead)}</p>` : ''}${extra}${showShare ? shareBar(route, h) : ''}</div></section>`;

// ---------- páginas ----------
const cvDoc = docs.find((d) => /^CV/i.test(d.category));
const cvHref = cvDoc ? L(`/documents/${cvDoc.file}`) : L('/documentos/');
const cvLabel = cvDoc ? 'Descargar currículum' : 'Consultar currículum';
const cvAttr = cvDoc ? ' download' : '';
const company = (e) => `${esc(e.company)}`;
const roleLine = (e) => [e.roleConfirmed && e.role ? e.role : '', clean(e.relationship)].filter(Boolean).join(' · ');

function homeMinimal() {
  const body = `<section class="hero"><div class="wrap">
  <h1>${esc(site.shortName)}</h1>
  <p class="headline">${esc(profile.headline)}</p>
  <p class="eyebrow">${esc(profile.location)}</p>
  <p class="ext">${links.map((l) => ext(l.url, l.label)).join(" · ")}</p>
</div></section>`;
  out('index.html', layout({ title: site.shortName, desc: site.description, route: '/', body }));
}

function home() {
  const jobs = exps.length;
  const facts = [
    [`${profile.yearsTech}`, 'años de experiencia en tecnología'],
    [`${profile.yearsManagement}`, 'años en posiciones gerenciales de TI'],
    [`${exps.length}`, 'expedientes profesionales documentados'],
    [`${profile.sectors.length}`, 'sectores de experiencia'],
  ].map(([n, t]) => `<div class="fact"><b>${esc(n)}</b><span>${esc(t)}</span></div>`).join('');
  const results = metrics.length
    ? `<div class="grid3">${metrics.slice(0, 6).map((m) => `<article class="card"><h3>${esc(m.claimedValue)}</h3><p>${esc(m.title)}</p><p class="muted">${esc(m.company)} · ${esc(m.period)}</p></article>`).join('')}</div><p><a href="${L('/logros/')}">Ver método, tiempo y ruta de cada resultado</a></p>`
    : `<p class="note">Los resultados medibles se publican únicamente después de validar su línea base, período, método de cálculo y fuente. Consulte la sección de <a href="${L('/logros/')}">logros</a>.</p>`;
  const quick = [['/perfil-ejecutivo/', 'Perfil Ejecutivo', 'Gobierno, dirección tecnológica y continuidad operativa.'], ['/trayectoria/', 'Trayectoria', `${exps.length} expedientes por empresa, con enlace propio.`], ['/logros/', 'Logros', 'Resultados con método y fuente de validación.'], ['/certificaciones/', 'Certificaciones', 'Credenciales con enlace de verificación.'], ['/proyectos/', 'Proyectos', 'Proyectos tecnológicos y su estado real.'], ['/documentos/', 'Documentos', 'Biblioteca documental y currículum.']]
    .map(([r, t, d]) => `<a class="card link-card" href="${L(r)}"><h3>${t}</h3><p>${d}</p></a>`).join('');
  const body = `<section class="hero"><div class="wrap">
  <p class="eyebrow">${esc(profile.location)} · <span class="tag demostrada">Actual: Astro - Pico Duarte Cartón</span></p>
  <h1>${esc(profile.name)}</h1>
  <p class="headline">${esc(profile.headline)}</p>
  <p class="lead">${esc(profile.tagline)}</p>
  <div class="card current-role-card"><p><strong>Posición Actual:</strong> Responsable de Tecnología de la Información en <a href="${L('/experiencia/astro-pico-duarte-carton/')}">Astro - Pico Duarte Cartón</a> (Haina, Rep. Dom.) · Liderando infraestructura industrial, desarrollo de soluciones internas, integración con SAP ERP, control digital de calidad e Inteligencia Artificial.</p></div>
  <div class="card current-role-card"><p><strong>Formación Académica Superior:</strong> ${esc(profile.degree)} · <a href="${L('/documents/Titulo_Ingenieria_Sistemas_OyM.pdf')}" target="_blank" rel="noopener">Consultar Título Universitario oficial (PDF)</a> · <a href="${L('/certificaciones/')}">Ver credenciales y títulos</a></p></div>
  <div class="actions"><a class="btn primary" href="${L('/trayectoria/')}">Ver trayectoria</a><a class="btn" href="${L('/proyectos/')}">Ver proyectos</a><a class="btn" href="${cvHref}"${cvAttr}>${cvLabel}</a><button class="btn ghost" data-share data-url="${abs('/')}" data-title="${esc(site.title)}">Compartir portafolio</button><button class="btn ghost" data-copy="${abs('/')}">Copiar enlace</button></div>
  <p class="ext">${links.map((l) => ext(l.url, l.label)).join(' · ')}</p>
</div></section>
<section class="wrap block"><h2>Resumen ejecutivo</h2>${ul(profile.summary, 'summary')}<div class="facts">${facts}</div><p class="muted small">${esc(profile.yearsNote)}</p></section>
<section class="band"><div class="wrap block"><h2>Áreas de especialización</h2><ul class="chips">${profile.specialties.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
<h3>Sectores</h3><ul class="chips alt">${profile.sectors.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div></section>
<section class="wrap block"><h2>Resultados profesionales</h2>${results}</section>
<section class="wrap block"><h2>Explore el expediente</h2><div class="grid3">${quick}</div>
<p>Dos formas de lectura: <a href="${L('/perfil-ejecutivo/')}">perfil ejecutivo</a> para dirección y selección, y <a href="${L('/perfil-tecnico/')}">perfil operativo</a> para entrevistadores técnicos.</p></section>`;
  const ld = { '@context': 'https://schema.org', '@type': 'Person', name: profile.name, jobTitle: 'Gerente de Tecnología e Infraestructura', description: site.description, address: { '@type': 'PostalAddress', addressLocality: 'Santo Domingo', addressCountry: 'DO' }, url: abs('/'), sameAs: links.map((l) => l.url) };
  out('index.html', layout({ title: site.shortName, desc: site.description, route: '/', body, ld }));
}

function perfilEjecutivo() {
  const lab = { demostrada: 'Competencias directivas demostradas', requiere: 'Competencias en documentación' };
  const rows = (ev) => profile.executiveAreas.filter((a) => a.evidence === ev).slice(0, 22).map((a) => `<article class="tech-item"><span class="tech-item-title">${esc(a.title)}</span><p class="tech-item-desc">${esc(a.text)}</p></article>`).join('');

  const currentBox = `<section class="wrap block"><div class="card current-role-card"><p><strong>Desempeño Ejecutivo Actual:</strong> Responsable de Tecnología de la Información en <a href="${L('/experiencia/astro-pico-duarte-carton/')}">Astro - Pico Duarte Cartón</a> (Haina, Rep. Dom.) · Liderazgo estratégico de infraestructura industrial, desarrollo del ecosistema interno de gestión TI, control digital de calidad, integración de facturas electrónicas en SAP y proyectos de IA.</p></div></section>`;

  const execSummaryItems = profile.executiveSummary && profile.executiveSummary.length ? profile.executiveSummary : profile.summary;
  const execCards = execSummaryItems.slice(0, 33).map((item) => {
    const match = item.match(/<strong>(.*?):?<\/strong>\s*(.*)/);
    const title = match ? match[1].replace(/:$/, '') : '';
    const desc = match ? match[2] : item;
    return `<article class="tech-item"><span class="tech-item-title">${esc(title)}</span><p class="tech-item-desc">${esc(desc)}</p></article>`;
  }).join('');
  const execSummaryHtml = execSummaryItems.length ? `<section class="wrap block"><h2>Resumen de trayectoria ejecutiva</h2><p class="muted">Síntesis estructurada de capacidades directivas, gobierno y liderazgo estratégico para evaluación rápida:</p><div class="tech-summary-grid">${execCards}</div></section>` : '';

  const body = hero('Perfil ejecutivo', '', '/perfil-ejecutivo/', '', false) + `
${currentBox}
${execSummaryHtml}
<section class="wrap block"><h2>${lab.demostrada}</h2><p class="muted">Competencias estratégicas respaldadas por cargos gerenciales y consultoría en entornos de alta exigencia.</p><div class="tech-summary-grid">${rows('demostrada')}</div></section>
${profile.executiveAreas.some(a => a.evidence === 'requiere') ? `<section class="band"><div class="wrap block"><h2>${lab.requiere}</h2><p class="muted">Competencias adicionales en proceso de vinculación a casos específicos.</p><div class="tech-summary-grid">${rows('requiere')}</div></div></section>` : ''}`;
  out('perfil-ejecutivo/index.html', layout({ title: 'Perfil ejecutivo', desc: 'Dirección de tecnología, continuidad del negocio, gestión de proveedores y equipos. Experiencia demostrada y competencias directivas.', route: '/perfil-ejecutivo/', body }));
}

function perfilTecnico() {
  const lab = { demostrada: 'Experiencia demostrada', 'por-confirmar': 'Por confirmar con evidencia' };
  const cards = profile.technicalAreas.slice(0, 20).map((a, i) => `<article class="card" id="area-${i + 1}"><span class="tag ${a.level}">${lab[a.level]}</span><h3>${i + 1}. ${esc(a.title)}</h3><p>${esc(a.use)}</p></article>`).join('');

  const currentBox = `<section class="wrap block"><div class="card current-role-card"><p><strong>Entorno Operativo Actual:</strong> Responsable de TI en <a href="${L('/experiencia/astro-pico-duarte-carton/')}">Astro - Pico Duarte Cartón</a> (Haina, Rep. Dom.) · Infraestructura industrial continua, servidores Windows/Linux, desarrollo de software interno, scripts de automatización en Python/PowerShell, integración ERP SAP y modelos de IA.</p></div></section>`;

  const techSummaryItems = profile.technicalSummary && profile.technicalSummary.length ? profile.technicalSummary : [];
  const techCards = techSummaryItems.slice(0, 22).map((item) => {
    const match = item.match(/<strong>(.*?):?<\/strong>\s*(.*)/);
    const title = match ? match[1].replace(/:$/, '') : '';
    const desc = match ? match[2] : item;
    return `<article class="tech-item"><span class="tech-item-title">${esc(title)}</span><p class="tech-item-desc">${esc(desc)}</p></article>`;
  }).join('');
  const techSummaryHtml = techSummaryItems.length ? `<section class="wrap block"><h2>Resumen de trayectoria técnica</h2><p class="muted">Síntesis estructurada de capacidades y dominios técnicos clave para evaluación rápida de reclutadores y líderes de TI:</p><div class="tech-summary-grid">${techCards}</div></section>` : '';
  const dirRows = profile.executiveAreas.filter((a) => a.evidence === 'demostrada').slice(0, 30).map((a) => `<article class="tech-item"><span class="tech-item-title">${esc(a.title)}</span><p class="tech-item-desc">${esc(a.text)}</p></article>`).join('');
  const dirHtml = dirRows ? `<section class="wrap block"><h2>Competencias directivas demostradas</h2><p class="muted">Competencias estratégicas de liderazgo y gestión respaldadas por más de 20 años en dirección tecnológica:</p><div class="tech-summary-grid">${dirRows}</div></section>` : '';
  const body = hero('Perfil Operativo', '', '/perfil-tecnico/', '', false) + `${currentBox}${techSummaryHtml}${dirHtml}<section class="wrap block"><h2>Competencias y Áreas Técnicas</h2><div class="grid2">${cards}</div></section>`;
  out('perfil-tecnico/index.html', layout({ title: 'Perfil Operativo', desc: 'Infraestructura, redes, seguridad, nube híbrida, continuidad, WMS, inteligencia artificial y automatización: competencias técnicas con su contexto de uso.', route: '/perfil-tecnico/', body }));
}

function trayectoria() {
  const renderHighlights = (hl) => {
    if (!hl || !hl.length) return '';
    const items = hl.map((h) => `
      <article class="tech-item">
        <span class="tech-item-title">${esc(h.num)} — ${esc(h.title)}</span>
        <p class="tech-item-desc">${esc(h.desc)}</p>
      </article>`).join('');
    return `<div class="tech-summary-grid spacer-sm">${items}</div>`;
  };
  const item = (e) => {
    const isCurrent = e.end === 'Actual' || String(e.periodDisplay).includes('Actual');
    return `<li class="tl"><article class="card"><p class="period">${esc(e.periodDisplay)} ${isCurrent ? '<span class="tag demostrada">Empleo actual</span>' : ''}</p><h3><a href="${L(`/experiencia/${e.slug}/`)}">${company(e)}</a></h3><p>${esc([e.roleConfirmed ? e.role : '', e.sector].filter(Boolean).join(' · ') || clean(e.relationship) || '')}</p><p>${esc(e.summary)}</p>${e.periodNote ? `<p class="muted small">${esc(e.periodNote)}</p>` : ''}${renderHighlights(e.highlights)}<p class="spacer-sm"><a href="${L(`/experiencia/${e.slug}/`)}">Abrir expediente de ${esc(e.company)}</a></p></article></li>`;
  };
  const body = hero('Trayectoria profesional', '', '/trayectoria/', '', false) + `
<section class="wrap block"><ol class="timeline">${exps.map(item).join('')}</ol></section>`;
  out('trayectoria/index.html', layout({ title: 'Trayectoria profesional', desc: 'Trayectoria cronológica de Mario Méndez: Astro - Pico Duarte Cartón, ODS Logistics, MADECO, UNIPAGO, Dominicana de Cales y VICRISA.', route: '/trayectoria/', body }));
}

function experiencia() {
  exps.forEach((e, i) => {
    const route = `/experiencia/${e.slug}/`;
    const prev = exps[i - 1], next = exps[i + 1];
    const myProj = projects.filter((p) => p.relatedCompany === e.slug);
    const myMetrics = metrics.filter((m) => m.company === e.company || m.companySlug === e.slug || m.company?.includes(e.company));
    const cases = (e.cases || []).map((c) => {
      const fields = [
        ['Situación inicial', c.situation],
        ['Problema o necesidad', c.problem],
        ['Objetivo', c.goal],
        ['Tiempo de ejecución y duración', c.duration || c.time],
        ['Ruta y fases de implementación', c.roadmap],
        ['Responsabilidad específica', c.responsibility],
        ['Solución aplicada', c.solution],
        ['Tecnologías', (c.technologies || []).join(', ')],
        ['Resultado obtenido', c.result],
        ['Métrica antes y después', c.metric],
        ['Alcance del resultado', c.scope],
        ['Evidencia verificable', c.evidence],
        ['Lecciones aprendidas', c.lessons]
      ].filter(([, v]) => v);

      return `<article class="card case" id="${esc(c.id || slugify(c.title))}"><h3>${esc(c.title)}</h3><dl>${fields.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl></article>`;
    }).join('');

    const ev = (e.evidence || []).map((x) => {
      const href = /^https?:/.test(x.url) ? x.url : L('/' + x.url.replace(/^\//, ''));
      return `<li><a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(x.title)}</a>${x.type ? ` <span class="muted">(${esc(x.type)})</span>` : ''}</li>`;
    }).join('');
    const techs = (e.technologies || []).map((t) => `<li><strong>${esc(t.name)}</strong>${clean(t.context) ? `: ${esc(t.context)}` : ''}</li>`).join('');
    const sec = (n, id, t, inner, aud = '') => `<section class="block ${aud}" id="${id}"><h2>${n}. ${t}</h2>${inner || empty}</section>`;

    const metricsHtml = myMetrics.length
      ? `<h3>Métricas y logros validados en esta experiencia (${myMetrics.length})</h3>
         <div class="tech-summary-grid">
           ${myMetrics.map((m) => `
             <article class="tech-item">
               <span class="tech-item-title">${esc(m.claimedValue)} · ${esc(m.title)}</span>
               <p class="tech-item-desc"><strong>Tiempo y duración:</strong> ${esc(m.period)} ${m.duration ? `(${esc(m.duration)})` : ''}</p>
               <p class="tech-item-desc"><strong>Antes → Después:</strong> ${esc(m.baseline)} → ${esc(m.result)}</p>
               ${m.roadmap && m.roadmap.length ? `<p class="tech-item-desc"><strong>Ruta:</strong> ${esc(m.roadmap.map(r => r.phase).join(' → '))}</p>` : ''}
               <p class="tech-item-desc muted small">${esc(m.method)}</p>
             </article>
           `).join('')}
         </div>`
      : '';

    const body = `<section class="page-head"><div class="wrap"><nav class="crumbs" aria-label="Ruta"><a href="${L('/')}">Inicio</a> › <a href="${L('/trayectoria/')}">Trayectoria</a> › <span>${company(e)}</span></nav>
<p class="eyebrow">${esc(e.periodDisplay)}</p><h1>${company(e)}</h1>
<p class="lead">${esc([roleLine(e), clean(e.sector), clean(e.location)].filter(Boolean).join(' · '))}</p>
${e.periodNote ? `<p class="note">${esc(e.periodNote)}</p>` : ''}</div></section>
<div class="wrap exp">
${sec(1, 'resumen', 'Resumen ejecutivo de la experiencia', `<p>${esc(e.summary)}</p>`)}
${sec(2, 'contexto', 'Contexto operativo', ul(e.context || []))}
${sec(3, 'ejecutivas', 'Responsabilidades ejecutivas', ul(e.executive || []), 'aud-exec')}
${sec(4, 'operativas', 'Responsabilidades operativas', ul(e.operational || []), 'aud-tech')}
${sec(5, 'casos', 'Casos de éxito y proyectos ejecutados', cases ? `<p class="muted">Se documenta la situación inicial, problema, tiempo de ejecución, ruta paso a paso de cómo se hizo, tecnologías, métricas y lecciones aprendidas.</p>${cases}` : `${empty}<p class="muted small">Los casos se publican con su evidencia y alcance verificados.</p>`)}
${sec(6, 'impacto', 'Impacto empresarial', ul(e.impact || []) , 'aud-exec')}
${sec(7, 'tecnologias', 'Tecnologías y competencias demostradas', techs ? `<ul>${techs}</ul>` : '', 'aud-tech')}
${sec(8, 'evidencias', 'Evidencias, métricas y proyectos asociados', (ev ? `<ul>${ev}</ul>` : '') + metricsHtml + (myProj.length ? `<h3>Proyectos asociados</h3><ul>${myProj.map((p) => `<li><a href="${L(`/proyectos/${p.slug}/`)}">${esc(p.name)}</a></li>`).join('')}</ul>` : ''))}
${sec(9, 'reclutadores', 'Resumen para reclutadores', e.recruiterSummary?.length ? `<ol class="rec">${e.recruiterSummary.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>` : '')}
<nav class="pager no-print" aria-label="Otras experiencias"><div>${prev ? `← <a href="${L(`/experiencia/${prev.slug}/`)}">${esc(prev.company)}</a>` : ''}</div><div><a href="${L('/trayectoria/')}">Todas las experiencias</a> · <a href="${L('/perfil-ejecutivo/')}">Volver al perfil</a></div><div>${next ? `<a href="${L(`/experiencia/${next.slug}/`)}">${esc(next.company)}</a> →` : ''}</div></nav>
</div>`;
    const ld = { '@context': 'https://schema.org', '@type': 'ProfilePage', mainEntity: { '@type': 'Person', name: profile.name }, name: `${e.company}: experiencia profesional`, url: abs(route) };
    out(`experiencia/${e.slug}/index.html`, layout({ title: `${e.company}: experiencia profesional`, desc: `${e.summary} Expediente profesional de ${profile.name}.`.slice(0, 300), route, body, ld, type: 'article' }));
  });
}

function logros() {
  const companies = [...new Set(metrics.map((m) => m.company))].sort();
  const opt = (a) => a.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('');

  const cards = metrics.map((m) => {
    const rm = (m.roadmap || []).map((step) => `
      <li class="roadmap-step">
        <span class="step-phase">${esc(step.phase)}</span>
        <span class="step-time">${esc(step.time)}</span>
        <p class="step-desc">${esc(step.desc)}</p>
      </li>
    `).join('');

    const roadmapHtml = rm ? `
      <div class="roadmap-container">
        <div class="roadmap-title">Ruta y fases de implementación ("Cómo se hizo"):</div>
        <ul class="roadmap-steps">${rm}</ul>
      </div>
    ` : '';

    const techChips = (m.technologies || []).length
      ? `<ul class="chips">${m.technologies.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`
      : '';

    return `
      <article class="ach-card" data-company="${esc(m.company)}">
        <div class="ach-header">
          <div>
            <h3>${esc(m.title)}</h3>
            <div class="ach-meta">
              <span><strong>Empresa:</strong> ${esc(m.company)}</span>
              <span><strong>Proyecto:</strong> ${esc(m.project)}</span>
              <span><strong>Período:</strong> ${esc(m.period)}</span>
              ${m.duration ? `<span><strong>Duración:</strong> ${esc(m.duration)}</span>` : ''}
            </div>
          </div>
          <div class="ach-claimed">${esc(m.claimedValue)}</div>
        </div>

        <p>${esc(m.definition)}</p>

        <div class="before-after-grid">
          <div class="ba-box before">
            <span class="ba-label">Línea base previa</span>
            <p>${esc(m.baseline)}</p>
          </div>
          <div class="ba-box after">
            <span class="ba-label">Resultado verificado</span>
            <p>${esc(m.result)}</p>
          </div>
        </div>

        ${roadmapHtml}

        ${techChips ? `<div class="spacer-sm">${techChips}</div>` : ''}

        <div class="ach-footer">
          <div><strong>Método de cálculo:</strong> ${esc(m.method)}</div>
          <div><strong>Fuente de validación:</strong> ${esc(m.validationSource)}</div>
          <div><strong>Alcance:</strong> ${esc(m.scope)}</div>
          ${m.notes ? `<div><strong>Notas de impacto:</strong> ${esc(m.notes)}</div>` : ''}
        </div>
      </article>
    `;
  }).join('');

  const rows = metrics.map((m) => `<tr data-company="${esc(m.company)}"><th scope="row">${esc(m.title)}<br><span class="muted small">${esc(m.definition)}</span></th><td>${esc(m.company)}<br><span class="muted small">${esc(m.project)}</span></td><td>${esc(m.period)}<br><span class="muted small">${esc(m.duration || '')}</span></td><td>${esc(m.baseline)} → <strong>${esc(m.result)}</strong></td><td>${esc(m.method)}</td><td>${esc(m.validationSource)}</td><td>${esc(m.scope)}</td></tr>`).join('');

  const body = hero('Logros y métricas', 'Cada resultado profesional se documenta con su empresa, proyecto, período, tiempo de ejecución, la ruta paso a paso de cómo se logró, su método de cálculo y su fuente de validación.', '/logros/', '', false) + `
<section class="wrap block">
  <div class="filters no-print">
    <label>Filtrar por empresa u organización:
      <select data-ach-filter>
        <option value="">Todas las empresas (${metrics.length} métricas validadas)</option>
        ${opt(companies)}
      </select>
    </label>
  </div>

  <h2>Expediente detallado de logros con tiempo y ruta de ejecución</h2>
  <div id="ach-list">${cards}</div>

  <h2 class="spacer-md">Matriz comparativa de auditoría y validación</h2>
  <p class="muted">Tabla técnica con línea base, método y fuente de verificación para auditorías directivas:</p>
  <div class="table-wrap">
    <table id="ach-table">
      <thead>
        <tr><th>Resultado</th><th>Empresa y proyecto</th><th>Período y Duración</th><th>Antes → después</th><th>Método</th><th>Fuente</th><th>Alcance</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</section>`;
  out('logros/index.html', layout({ title: 'Logros y métricas', desc: 'Resultados profesionales verificados, con empresa, proyecto, tiempo, ruta paso a paso de cómo se hicieron, método de cálculo y fuente de validación.', route: '/logros/', body }));
}

function certificaciones() {
  const issuers = [...new Set(certs.map((c) => c.issuer))].sort();
  const cats = certData.categories.filter((c) => certs.some((x) => x.category === c));
  const years = [...new Set(certs.map((c) => (c.date || '').slice(0, 4)).filter(Boolean))].sort().reverse();
  const opt = (a) => a.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  const typeL = {
    titulo: 'Título Universitario',
    especialidad: 'Especialidad',
    diplomado: 'Diplomado',
    certificacion: 'Certificación',
    merito: 'Carta al Mérito',
    curso: 'Curso',
    insignia: 'Insignia',
    formacion: 'Formación'
  };

  const getTypeGroup = (t) => {
    if (t === 'titulo' || t === 'grado') return 'titulo';
    if (t === 'especialidad') return 'especialidad';
    if (t === 'diplomado') return 'diplomado';
    if (t === 'certificacion') return 'certificacion';
    if (t === 'merito' || t === 'carta-merito') return 'merito';
    if (t === 'insignia') return 'insignia';
    return 'curso';
  };

  const typeCounts = {
    all: certs.length,
    titulo: certs.filter(c => getTypeGroup(c.type) === 'titulo').length,
    especialidad: certs.filter(c => getTypeGroup(c.type) === 'especialidad').length,
    diplomado: certs.filter(c => getTypeGroup(c.type) === 'diplomado').length,
    certificacion: certs.filter(c => getTypeGroup(c.type) === 'certificacion').length,
    merito: certs.filter(c => getTypeGroup(c.type) === 'merito').length,
    curso: certs.filter(c => getTypeGroup(c.type) === 'curso').length,
    insignia: certs.filter(c => getTypeGroup(c.type) === 'insignia').length
  };

  const cards = certs.map((c) => {
    const group = getTypeGroup(c.type);
    const docLabel = c.type === 'titulo'
      ? 'Consultar título universitario oficial (PDF)'
      : (c.type === 'merito'
          ? 'Consultar carta de mérito oficial (PDF)'
          : (c.type === 'especialidad'
              ? 'Consultar certificado de especialidad (PDF)'
              : (c.type === 'diplomado'
                  ? 'Consultar diploma oficial (PDF)'
                  : 'Consultar certificado oficial (PDF)')));
    const docLink = c.documentUrl
      ? `<p><a class="btn small" href="${L('/' + c.documentUrl)}" target="_blank" rel="noopener noreferrer">${docLabel}</a></p>`
      : '';
    const verifyLink = c.verifyUrl
      ? `<p><a class="btn small ghost" href="${c.verifyUrl}" target="_blank" rel="noopener noreferrer">Verificar credencial en emisor oficial ↗</a></p>`
      : '';

    return `<article class="card cert" data-issuer="${esc(c.issuer)}" data-cat="${esc(c.category)}" data-year="${esc((c.date || '').slice(0, 4))}" data-type="${esc(group)}">
      ${c.badgeImage ? `<img src="${L(`/certifications/${c.badgeImage}`)}" alt="Insignia ${esc(c.name)}" width="96" height="96" loading="lazy">` : ''}
      <span class="tag tag-${esc(group)}">${typeL[c.type] || esc(c.type)}</span>
      <h3>${esc(c.name)}</h3>
      <p>${esc(c.issuer)} · ${esc(c.category)}</p>
      <p class="muted">${esc(c.date || '')}${c.expires ? ` · vence ${esc(c.expires)}` : ''}${c.credentialId ? ` · ID ${esc(c.credentialId)}` : ''}</p>
      ${c.skills?.length ? `<p class="small">${esc(c.skills.join(', '))}</p>` : ''}
      ${c.notes ? `<p class="muted small">${esc(c.notes)}</p>` : ''}
      ${docLink}
      ${verifyLink}
    </article>`;
  }).join('');

  const typeTabs = `
    <div class="cert-type-tabs no-print">
      <button class="cert-tab" data-type-tab="" aria-pressed="true">Todas las credenciales (${typeCounts.all})</button>
      <button class="cert-tab" data-type-tab="titulo" aria-pressed="false">Título Universitario (${typeCounts.titulo})</button>
      <button class="cert-tab" data-type-tab="especialidad" aria-pressed="false">Especialidades (${typeCounts.especialidad})</button>
      <button class="cert-tab" data-type-tab="diplomado" aria-pressed="false">Diplomados (${typeCounts.diplomado})</button>
      <button class="cert-tab" data-type-tab="certificacion" aria-pressed="false">Certificaciones (${typeCounts.certificacion})</button>
      <button class="cert-tab" data-type-tab="merito" aria-pressed="false">Cartas al Mérito (${typeCounts.merito})</button>
      <button class="cert-tab" data-type-tab="curso" aria-pressed="false">Cursos y Talleres (${typeCounts.curso})</button>
      <button class="cert-tab" data-type-tab="insignia" aria-pressed="false">Insignias Digitales (${typeCounts.insignia})</button>
    </div>
  `;

  const sourcesBox = `<div class="card cert-sources"><h3>Perfiles oficiales para verificación directa</h3><p class="muted">Para corroborar la autenticidad de cada credencial, mérito e insignia, los comités evaluadores y reclutadores pueden consultar los registros públicos oficiales:</p><p class="ext">${ext('https://www.netacad.com', 'Cisco NetAcad')} · ${ext('https://www.skills.google/public_profiles/195595b2-3a40-4602-905a-78c34b68fe62', 'Google Skills')} · ${ext('https://www.credly.com/users/mario-mendez.630726a8/badges', 'Credly Badges')} · ${ext('https://learn.microsoft.com/es-es/users/MarioMendezAlcantaraalc', 'Microsoft Learn')} · ${ext('https://profile.sap.com/u/mario_mendez_a', 'Perfil Oficial SAP')}</p></div>`;

  const body = hero('Certificaciones, cursos e insignias', 'Expediente clasificado de credenciales profesionales con denominación oficial, fecha y enlace original de verificación con el emisor.', '/certificaciones/', '', false) + `<section class="wrap block">${sourcesBox}${typeTabs}${certs.length ? `<div class="filters no-print"><label>Tipo de credencial <select data-f="type"><option value="">Todos los tipos (${typeCounts.all})</option><option value="titulo">Título Universitario (${typeCounts.titulo})</option><option value="especialidad">Especialidades (${typeCounts.especialidad})</option><option value="diplomado">Diplomados (${typeCounts.diplomado})</option><option value="certificacion">Certificaciones (${typeCounts.certificacion})</option><option value="merito">Cartas al Mérito (${typeCounts.merito})</option><option value="curso">Cursos y Talleres (${typeCounts.curso})</option><option value="insignia">Insignias Digitales (${typeCounts.insignia})</option></select></label><label>Entidad <select data-f="issuer"><option value="">Todas</option>${opt(issuers)}</select></label><label>Categoría <select data-f="cat"><option value="">Todas</option>${opt(cats)}</select></label><label>Año <select data-f="year"><option value="">Todos</option>${opt(years)}</select></label><div class="views"><button data-cert-view="cards" aria-pressed="true">Tarjetas</button><button data-cert-view="list" aria-pressed="false">Lista compacta</button></div></div><div id="certs" class="grid3 cert-cards">${cards}</div><p id="none" class="note" hidden>Ninguna credencial coincide con el filtro.</p>` : `<p class="note">Las certificaciones y cursos se publicarán a medida que cada credencial sea verificada con su emisor.</p>`}</section>`;
  out('certificaciones/index.html', layout({ title: 'Certificaciones, cursos e insignias', desc: 'Credenciales profesionales verificables con enlace directo al emisor: Cisco, Google Cloud, Microsoft, IBM y Anthropic.', route: '/certificaciones/', body }));
}

function renderTangibleSystem(p, uid) {
  if (!p.systemDemo && !p.technicalDocs) return '';
  const sd = p.systemDemo || {};
  const td = p.technicalDocs || {};
  const group = `sys-${uid}-${p.slug}`;
  const termId = `term-${uid}-${p.slug}`;

  const kpisHtml = (sd.kpis && sd.kpis.length)
    ? `<div class="sys-kpis">${sd.kpis.map((k) => `<div class="sys-kpi"><span class="sys-kpi-label">${esc(k.label)}</span><span class="sys-kpi-val">${esc(k.value)}</span></div>`).join('')}</div>`
    : '';

  const termHtml = (sd.simSteps && sd.simSteps.length)
    ? `<div class="sys-terminal-bar">
         <strong>Bitácora de Ejecución en Tiempo Real:</strong>
         <button type="button" class="btn small primary no-print" data-sim-run="${esc(termId)}">▶ Ejecutar prueba del sistema en vivo</button>
       </div>
       <ul class="sys-terminal" id="${esc(termId)}">${sd.simSteps.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`
    : '';

  const tableHtml = (sd.tableHeaders && sd.tableRows)
    ? `<div class="table-wrap">
         <table>
           <thead><tr>${sd.tableHeaders.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
           <tbody>${sd.tableRows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
         </table>
       </div>`
    : '';

  const archHtml = (td.architectureLayers && td.architectureLayers.length)
    ? `<ul class="arch-layers">${td.architectureLayers.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`
    : `<p>${esc(p.architecture)}</p>`;

  const codeHtml = td.codeSnippet
    ? `<div class="code-artifact">
         <div class="code-artifact-head">${esc(td.codeFilename || 'implementacion.py')}</div>
         <pre><code>${esc(td.codeSnippet)}</code></pre>
       </div>`
    : '';

  return `<div class="tangible-system">
    <div class="sys-topbar">
      <div>
        <p class="sys-topbar-title">🖥️ ${esc(sd.systemTitle || p.name)}</p>
        <p class="sys-topbar-sub">${esc(sd.systemSubtitle || p.status)}</p>
      </div>
      <span class="tag demostrada">Sistema &amp; Documentación Tangible</span>
    </div>
    <div class="sys-tabs no-print">
      <button type="button" class="sys-tab" data-sys-group="${esc(group)}" data-sys-tab="live" aria-selected="true">1. Sistema en Vivo y Registros</button>
      <button type="button" class="sys-tab" data-sys-group="${esc(group)}" data-sys-tab="arch" aria-selected="false">2. Documentación de Arquitectura</button>
      <button type="button" class="sys-tab" data-sys-group="${esc(group)}" data-sys-tab="code" aria-selected="false">3. Código Fuente y Esquemas</button>
    </div>
    <div class="sys-pane" data-sys-pane-group="${esc(group)}" data-sys-pane="live">
      ${kpisHtml}
      ${termHtml}
      ${tableHtml}
    </div>
    <div class="sys-pane" data-sys-pane-group="${esc(group)}" data-sys-pane="arch" hidden>
      <h4>Arquitectura Técnica e Integración de Capas</h4>
      ${archHtml}
    </div>
    <div class="sys-pane" data-sys-pane-group="${esc(group)}" data-sys-pane="code" hidden>
      <h4>Artefacto de Código e Implementación Verificable</h4>
      ${codeHtml}
    </div>
  </div>`;
}

function proyectos() {
  const types = [...new Set(projects.map((p) => p.type))].sort();
  const cards = projects.map((p) => `<article class="card" data-type="${esc(p.type)}"><span class="tag">${esc(p.type)}</span><h3><a href="${L(`/proyectos/${p.slug}/`)}">${esc(p.name)}</a></h3><p>${esc(p.summary)}</p><p class="muted small">Empresa: ${esc(p.companyName || 'Transversal')} · Rol: ${esc(clean(p.role) || 'Líder técnico')} · Estado: ${esc(p.status)}</p><p class="spacer-sm"><a class="btn small primary" href="${L(`/proyectos/${p.slug}/`)}">Abrir sistema interactivo y documentación →</a></p></article>`).join('');
  const body = hero('Proyectos tecnológicos y sistemas demostrables', 'Cada ficha incluye su sistema interactivo, bitácoras de ejecución, arquitectura por capas, código fuente tangible y evidencias alineadas al CV.', '/proyectos/') + `<section class="wrap block"><div class="filters no-print"><label>Tipo de proyecto <select data-pf><option value="">Todos</option>${types.map((t) => `<option>${esc(t)}</option>`).join('')}</select></label></div><div class="grid2" id="projs">${cards}</div></section>`;
  out('proyectos/index.html', layout({ title: 'Proyectos tecnológicos', desc: 'Catálogo de proyectos tangibles: IA, agentes MCP/RAG, n8n, automatización, integración SAP ERP, Full Stack, ETL y Cloud.', route: '/proyectos/', body }));
  projects.forEach((p) => {
    const route = `/proyectos/${p.slug}/`;
    const co = exps.find((e) => e.slug === p.relatedCompany);
    const relPortfolios = portfolios.filter((pf) => pf.projectSlugs.includes(p.slug));
    const dl = [['Empresa / Entorno', p.companyName || (co ? co.company : '')], ['Puesto desempeñado', clean(p.role)], ['Período y Estado', `${p.period ? p.period + ' · ' : ''}${p.status}`], ['Requerimiento del puesto en el CV', p.cvRequirement], ['Problema que resuelve', p.problem], ['Arquitectura implementada', p.architecture]].filter(([, v]) => v).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('');
    const evHtml = (p.evidence && p.evidence.length)
      ? `<div class="evidence-box"><h4>Resultado demostrable y evidencias para el reclutador</h4>${ul(p.evidence)}</div>`
      : '';
    const tangibleHtml = renderTangibleSystem(p, 'projpage');
    const relPfHtml = relPortfolios.length
      ? `<h2 class="spacer-md">Portafolios especializados donde participa este proyecto</h2><ul class="role-switcher">${relPortfolios.map((pf) => `<li><a href="${L(`/portafolios/${pf.slug}/`)}">${esc(pf.title)}</a></li>`).join('')}</ul>`
      : '';
    const body = hero(p.name, p.summary, route) + `<section class="wrap block"><dl class="facts-dl">${dl}</dl>${tangibleHtml}${p.technologies.length ? `<h2 class="spacer-md">Tecnologías utilizadas</h2><ul class="chips">${p.technologies.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}${p.contributions.length ? `<h2>Contribución concreta y funcionalidad implementada</h2>${ul(p.contributions)}` : ''}${evHtml}${p.links?.length ? `<h2>Enlaces y verificación</h2><ul>${p.links.map((l) => `<li>${ext(l.url, l.title)}</li>`).join('')}</ul>` : ''}${relPfHtml}${co ? `<p class="spacer-md">Expediente empresarial relacionado: <a href="${L(`/experiencia/${co.slug}/`)}">${esc(co.company)}</a></p>` : ''}<p><a href="${L('/proyectos/')}">← Todos los proyectos</a> · <a href="${L('/portafolios/')}">Ver los 12 Portafolios por Rol</a></p></section>`;
    out(`proyectos/${p.slug}/index.html`, layout({ title: p.name, desc: p.summary, route, body }));
  });
}

function portafolios() {
  const domains = [...new Set(portfolios.map((p) => p.domain))];
  const typeL = {
    titulo: 'Título Universitario',
    especialidad: 'Especialidad',
    diplomado: 'Diplomado',
    certificacion: 'Certificación',
    merito: 'Carta al Mérito',
    curso: 'Curso',
    insignia: 'Insignia',
    formacion: 'Formación'
  };
  const getTypeGroup = (t) => {
    if (t === 'titulo' || t === 'grado') return 'titulo';
    if (t === 'especialidad') return 'especialidad';
    if (t === 'diplomado') return 'diplomado';
    if (t === 'certificacion') return 'certificacion';
    if (t === 'merito' || t === 'carta-merito') return 'merito';
    if (t === 'insignia') return 'insignia';
    return 'curso';
  };

  const domainTabs = `<div class="cert-type-tabs no-print">
    <button class="cert-tab" data-domain-tab="" aria-pressed="true">Todos los roles (${portfolios.length})</button>
    ${domains.map((d) => `<button class="cert-tab" data-domain-tab="${esc(d)}" aria-pressed="false">${esc(d)} (${portfolios.filter((x) => x.domain === d).length})</button>`).join('')}
  </div>`;

  const hubCards = portfolios.map((pf) => {
    const pfMetrics = pf.metricIds.map((id) => metrics.find((m) => m.id === id)).filter(Boolean);
    const topClaims = pfMetrics.slice(0, 3).map((m) => `${m.claimedValue} (${m.company})`).join(' · ');
    return `<article class="card portfolio-card" data-domain="${esc(pf.domain)}">
      <div>
        <span class="tag">${esc(pf.domain)}</span>
        <h3><a href="${L(`/portafolios/${pf.slug}/`)}">${esc(pf.title)}</a></h3>
        <p>${esc(pf.headline)}</p>
        <p class="muted small"><strong>Impacto medible:</strong> ${esc(topClaims)}</p>
      </div>
      <div>
        <ul class="portfolio-stats">
          <li>${pf.experiences.length} experiencias alineadas</li>
          <li>${pf.certIds.length} credenciales oficiales</li>
          <li>${pf.metricIds.length} métricas validadas</li>
          <li>${pf.projectSlugs.length} proyectos con evidencia</li>
        </ul>
        <p class="spacer-sm"><a class="btn primary" href="${L(`/portafolios/${pf.slug}/`)}">Abrir portafolio 360° →</a></p>
      </div>
    </article>`;
  }).join('');

  const hubBody = hero(
    'Portafolios especializados por rol',
    '12 expedientes diseñados con coherencia 360° para reclutadores y líderes técnicos: cada portafolio conecta en la misma línea la experiencia real en empresas, las certificaciones oficiales sobre ese tema, lo que se logró, las métricas auditadas y los proyectos con evidencias verificables.',
    '/portafolios/'
  ) + `<section class="wrap block">
    ${domainTabs}
    <div class="filters no-print">
      <label>Filtrar por dominio tecnológico:
        <select data-port-domain>
          <option value="">Todos los dominios (${portfolios.length} portafolios)</option>
          ${domains.map((d) => `<option value="${esc(d)}">${esc(d)}</option>`).join('')}
        </select>
      </label>
    </div>
    <div class="grid3" id="portfolios-grid">${hubCards}</div>
  </section>`;

  out('portafolios/index.html', layout({
    title: 'Portafolios especializados por rol',
    desc: '12 portafolios especializados de Mario Méndez (Data Engineer, Data Analyst, Data Scientist, DBA, AI Engineer, Automation, Full Stack, IT PM, Cloud/DevOps, Redes, Ciberseguridad y Cloud Security).',
    route: '/portafolios/',
    body: hubBody
  }));

  portfolios.forEach((pf) => {
    const route = `/portafolios/${pf.slug}/`;
    const pfMetrics = pf.metricIds.map((id) => metrics.find((m) => m.id === id)).filter(Boolean);
    const pfProjects = pf.projectSlugs.map((slug) => projects.find((p) => p.slug === slug)).filter(Boolean);
    const pfCerts = pf.certIds.map((id) => certs.find((c) => c.id === id)).filter(Boolean);

    const factsHtml = [
      [`${pf.experiences.length}`, 'experiencias empresariales en la línea del rol'],
      [`${pfCerts.length}`, 'títulos, especialidades, diplomados y certificaciones del tema'],
      [`${pfMetrics.length}`, 'logros y métricas auditadas con ruta de ejecución'],
      [`${pfProjects.length}`, 'proyectos con evidencias para el reclutador']
    ].map(([n, t]) => `<div class="fact"><b>${esc(n)}</b><span>${esc(t)}</span></div>`).join('');

    const traceRows = (pf.traceabilityMatrix || []).map((row) => {
      const m = metrics.find((x) => x.id === row.metricId);
      const p = projects.find((x) => x.slug === row.projectSlug);
      const rCerts = (row.certIds || []).map((cid) => certs.find((c) => c.id === cid)).filter(Boolean);
      const certsList = rCerts.map((c) => `<li><strong>${esc(c.name)}</strong> <span class="muted small">(${esc(c.issuer)})</span></li>`).join('');
      const hasExpAnchor = (pf.experiences || []).some((ex) => ex.companySlug === row.companySlug);
      const hasProjAnchor = p && pfProjects.some((px) => px.slug === p.slug);
      return `<tr>
        <td><strong>${hasExpAnchor ? `<a href="#exp-${esc(row.companySlug)}">${esc(row.company)}</a>` : esc(row.company)}</strong><br><span class="small">${esc(row.experienceFocus)}</span></td>
        <td><ul class="plain small">${certsList}</ul></td>
        <td>${m ? `<span class="tag demostrada">${esc(m.claimedValue)}</span> <strong>${esc(m.title)}</strong><br>` : ''}<span class="small">${esc(row.achievementSummary)}</span></td>
        <td>${p ? `<strong>${hasProjAnchor ? `<a href="#proj-${esc(p.slug)}">${esc(p.name)}</a>` : esc(p.name)}</strong><br>` : ''}<span class="small">${esc(row.evidenceSummary)}</span></td>
      </tr>`;
    }).join('');

    const seenExpIds = new Set();
    const expCards = (pf.experiences || []).map((ex) => {
      const idAttr = !seenExpIds.has(ex.companySlug) ? ` id="exp-${esc(ex.companySlug)}"` : '';
      seenExpIds.add(ex.companySlug);
      return `<article class="card"${idAttr}>
        <p class="period">${esc(ex.period)}</p>
        <h3>${esc(ex.company)} · ${esc(ex.roleTitle)}</h3>
        <p>${esc(ex.summary)}</p>
        <h4>Logros y responsabilidades específicas en ${esc(pf.shortTitle)}:</h4>
        ${ul(ex.achievements || [])}
        ${(ex.technologies && ex.technologies.length) ? `<ul class="chips spacer-sm">${ex.technologies.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      </article>`;
    }).join('');

    const metricCards = pfMetrics.map((m) => {
      const rm = (m.roadmap || []).map((step) => `
        <li class="roadmap-step">
          <span class="step-phase">${esc(step.phase)}</span>
          <span class="step-time">${esc(step.time)}</span>
          <p class="step-desc">${esc(step.desc)}</p>
        </li>
      `).join('');
      return `<article class="ach-card">
        <div class="ach-header">
          <div>
            <h3>${esc(m.title)}</h3>
            <div class="ach-meta">
              <span><strong>Empresa:</strong> ${esc(m.company)}</span>
              <span><strong>Proyecto:</strong> ${esc(m.project)}</span>
              <span><strong>Período:</strong> ${esc(m.period)}</span>
              ${m.duration ? `<span><strong>Duración:</strong> ${esc(m.duration)}</span>` : ''}
            </div>
          </div>
          <div class="ach-claimed">${esc(m.claimedValue)}</div>
        </div>
        <p>${esc(m.definition)}</p>
        <div class="before-after-grid">
          <div class="ba-box before"><span class="ba-label">Línea base previa</span><p>${esc(m.baseline)}</p></div>
          <div class="ba-box after"><span class="ba-label">Resultado verificado</span><p>${esc(m.result)}</p></div>
        </div>
        ${rm ? `<div class="roadmap-container"><div class="roadmap-title">Ruta y fases de implementación ("Cómo se logró"):</div><ul class="roadmap-steps">${rm}</ul></div>` : ''}
        <div class="ach-footer">
          <div><strong>Método de cálculo:</strong> ${esc(m.method)}</div>
          <div><strong>Fuente de validación:</strong> ${esc(m.validationSource)}</div>
        </div>
      </article>`;
    }).join('');

    const projCards = pfProjects.map((p, idx) => {
      const co = exps.find((e) => e.slug === p.relatedCompany);
      const cvReqHtml = p.cvRequirement
        ? `<div class="cv-Requirement-badge"><strong>Alineación con el puesto y CV (${esc(p.companyName || (co ? co.company : 'Empresa'))}):</strong> ${esc(p.cvRequirement)}</div>`
        : '';
      const tangibleHtml = renderTangibleSystem(p, `${pf.slug}-${idx}`);
      return `<article class="card spacer-md" id="proj-${esc(p.slug)}">
        <span class="tag">${esc(p.type)}</span>
        <h3>${esc(p.name)}</h3>
        <p class="muted small"><strong>Puesto desempeñado:</strong> ${esc(clean(p.role) || pf.shortTitle)} · <strong>Empresa:</strong> ${esc(p.companyName || (co ? co.company : 'Proyecto transversal'))} · <strong>Estado:</strong> ${esc(p.status)}</p>
        ${cvReqHtml}
        <p>${esc(p.summary)}</p>
        <p><strong>Problema que resuelve:</strong> ${esc(p.problem)}</p>
        <p><strong>Arquitectura y funcionalidad implementada:</strong> ${esc(p.architecture)}</p>
        ${p.contributions?.length ? `<h4>Contribución concreta y logros técnicos:</h4>${ul(p.contributions)}` : ''}
        ${tangibleHtml}
        ${p.evidence?.length ? `<div class="evidence-box"><h4>Resultado demostrable y evidencia para el reclutador</h4>${ul(p.evidence)}</div>` : ''}
        ${p.technologies?.length ? `<ul class="chips spacer-sm">${p.technologies.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      </article>`;
    }).join('');

    const certCards = pfCerts.map((c) => {
      const group = getTypeGroup(c.type);
      const docLabel = c.type === 'titulo'
        ? 'Consultar título universitario oficial (PDF)'
        : (c.type === 'merito'
            ? 'Consultar carta de mérito oficial (PDF)'
            : (c.type === 'especialidad'
                ? 'Consultar certificado de especialidad (PDF)'
                : (c.type === 'diplomado'
                    ? 'Consultar diploma oficial (PDF)'
                    : 'Consultar certificado oficial (PDF)')));
      const docLink = c.documentUrl
        ? `<p><a class="btn small" href="${L('/' + c.documentUrl)}" target="_blank" rel="noopener noreferrer">${docLabel}</a></p>`
        : '';
      const verifyLink = c.verifyUrl
        ? `<p><a class="btn small ghost" href="${c.verifyUrl}" target="_blank" rel="noopener noreferrer">Verificar credencial en emisor oficial ↗</a></p>`
        : '';
      return `<article class="card cert">
        ${c.badgeImage ? `<img src="${L(`/certifications/${c.badgeImage}`)}" alt="Insignia ${esc(c.name)}" width="96" height="96" loading="lazy">` : ''}
        <span class="tag tag-${esc(group)}">${typeL[c.type] || esc(c.type)}</span>
        <h3>${esc(c.name)}</h3>
        <p>${esc(c.issuer)} · ${esc(c.category)}</p>
        <p class="muted">${esc(c.date || '')}${c.credentialId ? ` · ID ${esc(c.credentialId)}` : ''}</p>
        ${c.skills?.length ? `<p class="small">${esc(c.skills.join(', '))}</p>` : ''}
        ${docLink}
        ${verifyLink}
      </article>`;
    }).join('');

    const compCatHtml = (pf.competencyCategories && pf.competencyCategories.length)
      ? `<h3 class="spacer-md">Competencias técnicas por dominio</h3>
         <div class="tech-summary-grid">
           ${pf.competencyCategories.map((cat) => `<article class="tech-item"><span class="tech-item-title">${esc(cat.title)}</span><p class="tech-item-desc">${esc(cat.desc)}</p></article>`).join('')}
         </div>`
      : `<h3>Competencias y stack tecnológico de este portafolio</h3>
         <ul class="chips">${(pf.skills || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`;

    const body = `<section class="page-head"><div class="wrap">
      <p class="eyebrow">${esc(pf.domain)} · ${esc(pf.yearsExperience)}</p>
      <h1>${esc(pf.title)}</h1>
      <p class="lead">${esc(pf.headline)}</p>
    </div></section>
    <div class="wrap exp">
      <section class="block" id="resumen-rol">
        <div class="value-box">
          <h2>Propuesta de valor y perfil especializado</h2>
          <p>${esc(pf.summary)}</p>
          <p><strong>Impacto directo para la organización:</strong> ${esc(pf.valueProposition)}</p>
        </div>
        ${compCatHtml}
      </section>

      <section class="block" id="trazabilidad">
        <h2>1. Matriz de coherencia y trazabilidad 360° para el reclutador</h2>
        <p class="muted">Esta tabla demuestra que cada competencia declarada en la experiencia está respaldada en la misma línea por certificaciones oficiales del tema, logros medibles con método de validación y proyectos reales con evidencias verificables:</p>
        <div class="table-wrap">
          <table class="trace-table">
            <thead>
              <tr>
                <th>Experiencia y qué se ejecutó</th>
                <th>Certificaciones del tema</th>
                <th>Qué se logró y métrica auditada</th>
                <th>Proyecto y evidencia para el reclutador</th>
              </tr>
            </thead>
            <tbody>${traceRows}</tbody>
          </table>
        </div>
      </section>

      <section class="block" id="experiencia-rol">
        <h2>2. Experiencia profesional alineada a ${esc(pf.shortTitle)}</h2>
        <p class="muted">Desempeño comprobado ejecutando funciones directas de ${esc(pf.title)} en entornos reales:</p>
        <div class="grid2">${expCards}</div>
      </section>

      <section class="block" id="metricas-rol">
        <h2>3. Logros y métricas validadas en ${esc(pf.shortTitle)}</h2>
        <p class="muted">Resultados cuantificables con línea base previa, resultado auditado, tiempo de ejecución y la ruta paso a paso de cómo se lograron:</p>
        <div>${metricCards}</div>
      </section>

      <section class="block" id="proyectos-rol">
        <h2>4. Sistemas tangibles, proyectos ejecutados y documentación técnica (${pfProjects.length})</h2>
        <p class="muted">Cada proyecto responde directamente al puesto y experiencia del CV en cada empresa e incluye su consola interactiva en vivo, arquitectura de 4 capas y código fuente verificable:</p>
        <div>${projCards}</div>
      </section>

      <section class="block" id="certificaciones-rol">
        <h2>5. Título, especialidades, diplomados y certificaciones del rol (${pfCerts.length})</h2>
        <p class="muted">Credenciales académicas y certificaciones internacionales que respaldan técnicamente las experiencias y proyectos de este portafolio:</p>
        <div class="grid3 cert-cards">${certCards}</div>
      </section>
    </div>`;

    const ld = {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      mainEntity: { '@type': 'Person', name: profile.name, jobTitle: pf.title },
      name: `${pf.title} | ${profile.name}`,
      url: abs(route)
    };
    out(`portafolios/${pf.slug}/index.html`, layout({
      title: pf.title,
      desc: `${pf.headline} Portafolio especializado de ${profile.name} con experiencias, certificaciones, logros, métricas y proyectos con evidencia.`.slice(0, 300),
      route,
      body,
      ld,
      standalone: true
    }));
  });
}

function documentos() {
  const cats = docData.categories.filter((c) => docs.some((d) => d.category === c));
  const list = docs.map((d) => `<li class="card" data-cat="${esc(d.category)}"><span class="tag">${esc(d.category)}</span><h3>${esc(d.title)}</h3><p>${esc(d.description)}</p><p class="muted small">${esc(d.date)}</p><p><a class="btn" href="${L(`/documents/${d.file}`)}" target="_blank" rel="noopener">Abrir</a> <a class="btn ghost" href="${L(`/documents/${d.file}`)}" download>Descargar</a></p></li>`).join('');
  const body = hero('Biblioteca de documentos', 'Documentos públicos o autorizados. Cada versión nueva reemplaza a la anterior para evitar datos inconsistentes.', '/documentos/') + `<section class="wrap block">${docs.length ? `<div class="filters no-print"><label>Categoría <select data-df><option value="">Todas</option>${cats.map((c) => `<option>${esc(c)}</option>`).join('')}</select></label></div><ul class="grid2 plain" id="docs">${list}</ul>` : `<p class="note">Los documentos (currículum y certificados, entre otros) se publicarán aquí en cuanto estén revisados y autorizados. Mientras tanto, el perfil de LinkedIn está disponible en la sección de inicio.</p>`}</section>`;
  out('documentos/index.html', layout({ title: 'Biblioteca de documentos', desc: 'Currículum, certificados y documentos públicos o autorizados.', route: '/documentos/', body }));
}

function contacto() {
  const c = profile.contact;
  const items = [
    c.email ? `<li><strong>Correo electrónico:</strong> <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>` : '',
    c.phone ? `<li><strong>Teléfono / WhatsApp:</strong> <a href="tel:${esc(c.phone.replace(/\s/g, ''))}">${esc(c.phone)}</a></li>` : '',
    `<li><strong>Ubicación:</strong> ${esc(profile.location)}</li>`,
    profile.relocatable ? `<li><strong>Relocalizable en:</strong> ${esc(profile.relocatable)}</li>` : '',
    profile.workStatus ? `<li><strong>Disponibilidad:</strong> ${esc(profile.workStatus)}</li>` : '',
    profile.drivingLicense ? `<li><strong>Movilidad:</strong> ${esc(profile.drivingLicense)}</li>` : '',
    profile.englishLevel ? `<li><strong>Inglés:</strong> ${esc(profile.englishLevel)}</li>` : '',
    ...links.map((l) => `<li><strong>${esc(l.label)}:</strong> ${ext(l.url, l.url)}</li>`)
  ].filter(Boolean).join('');

  const body = hero('Contacto profesional', 'Canales directos para reclutadores, comités de selección y directores ejecutivos.', '/contacto/') + `
<section class="wrap block">
  <div class="grid2">
    <article class="card">
      <h3>Datos de Contacto Directo</h3>
      <ul class="contact">${items}</ul>
    </article>
    <article class="card">
      <h3>Modalidades de Contratación</h3>
      <p class="muted">Abierto a propuestas formales que requieran liderazgo y resolución técnica:</p>
      <ul class="chips">${(profile.workContracts || []).map(k => `<li>${esc(k)}</li>`).join('')}</ul>
      <h4 class="spacer-md">Referencias Profesionales</h4>
      <p>${esc(profile.referencesNote || 'Referencias directivas y laborales disponibles a solicitud.')}</p>
    </article>
  </div>
</section>`;
  out('contacto/index.html', layout({ title: 'Contacto', desc: `Contacto profesional con ${profile.name}: perfiles y canales verificados.`, route: '/contacto/', body }));
}

function pagina404() {
  const body = `<section class="wrap block"><h1>Página no encontrada</h1><p class="lead">El enlace no existe o fue movido.</p><p><a class="btn primary" href="${L('/')}">Volver al inicio</a> <a class="btn" href="${L('/trayectoria/')}">Ver trayectoria</a></p></section>`;
  out('404.html', layout({ title: 'Página no encontrada', desc: 'La página solicitada no existe.', route: '/404.html', body, noindex: true }));
}

function seo() {
  if (!site.indexable) { out('robots.txt', 'User-agent: *\nDisallow: /\n'); return; } // modo privado: sin sitemap y sin indexación
  const pages = written.filter((f) => f.endsWith('index.html'));
  const urls = pages.map((f) => `/${f.replace(/index\.html$/, '')}`);
  out('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${abs(u)}</loc><lastmod>${site.lastReview}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  out('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${abs('/sitemap.xml')}\n`);
}

// PNG 1200x630 (degradado azul oscuro a cian) generado sin dependencias.
function ogImage() {
  const W = 1200, H = 630;
  const crc = (buf) => { let c, crc = ~0; for (const b of buf) { c = (crc ^ b) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return ~crc >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const raw = Buffer.alloc((W * 3 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 3 + 1)] = 0;
    for (let x = 0; x < W; x++) {
      const t = (x / W) * 0.6 + (y / H) * 0.4;
      const o = y * (W * 3 + 1) + 1 + x * 3;
      raw[o] = Math.round(11 + t * 0); raw[o + 1] = Math.round(37 + t * 130); raw[o + 2] = Math.round(69 + t * 150);
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
  fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'assets/og-default.png'), png);
}

// ---------- ejecución ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, 'public'), DIST, { recursive: true });
if (site.minimal) { homeMinimal(); pagina404(); seo(); ogImage(); }
else { home(); portafolios(); perfilEjecutivo(); perfilTecnico(); trayectoria(); experiencia(); logros(); certificaciones(); proyectos(); documentos(); pagina404(); seo(); ogImage(); }
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

// Informe de pendientes generado desde los datos (docs/PENDIENTES.md).
const pend = [`# Información pendiente de confirmar\n\n> Generado automáticamente por \`npm run build\` desde /content. No lo edite a mano: complete los datos en los JSON y vuelva a generar.\n`];
pend.push('## Contacto y enlaces\n');
if (!profile.contact.email) pend.push('- [ ] Correo electrónico profesional (`content/profile/profile.json` → `contact.email`).');
if (!profile.contact.phone) pend.push('- [ ] Teléfono profesional (`contact.phone`), si desea publicarlo.');
profile.links.forEach((l) => pend.push(`- [${l.verified ? 'x' : ' '}] ${l.label}: ${l.url}. ${l.note}`));
pend.push('- [ ] Validar las cifras de trayectoria: más de 21 años en tecnología y 12 en gerencia, contra el historial completo.');
pend.push('- [ ] Confirmar `siteUrl` y `basePath` en `content/site.json` según el hosting final.');
pend.push('\n## Experiencias\n');
allExp.sort((a, b) => a.order - b.order).forEach((e) => { pend.push(`### ${e.company} (${e.periodDisplay})`); (e.pending || []).forEach((p) => pend.push(`- [ ] ${p}`)); pend.push(''); });
pend.push('## Proyectos\n');
allProjects.forEach((p) => { pend.push(`### ${p.name}${p.public ? '' : ' (oculto)'}`); (p.pending || []).forEach((x) => pend.push(`- [ ] ${x}`)); pend.push(''); });
pend.push('## Métricas pendientes de validación (ocultas)\n');
achData.items.forEach((m) => pend.push(`- [${m.status === 'validada' ? 'x' : ' '}] ${m.title} (${m.claimedValue}): ${m.status === 'validada' ? 'validada' : 'asignar empresa y proyecto; definir línea base, período, método y fuente'}.`));
pend.push('\n## Certificaciones pendientes de verificación (ocultas)\n');
certData.items.forEach((c) => pend.push(`- [${c.public ? 'x' : ' '}] ${c.name} (${c.issuer}): confirmar denominación oficial, tipo, fecha, enlace de verificación e imagen autorizada.`));
pend.push('\n## Documentos\n\n- [ ] Cargar CV vigente (ejecutivo, técnico, gerencia de TI, infraestructura) en `public/documents/` y registrarlo en `content/documents/documents.json`.');
pend.push('- [ ] Certificados e insignias autorizados para publicación.');
pend.push('- [ ] Imagen de previsualización personalizada (`public/assets/og-default.png`, 1200×630). La actual es un degradado sin texto.');
fs.writeFileSync(path.join(ROOT, 'docs/PENDIENTES.md'), pend.join('\n') + '\n');
console.log(`Sitio generado en dist/ (${written.length} archivos, base="${BASE}")`);
