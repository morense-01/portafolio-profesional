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
const ul = (items, cls = '') => (items.length ? `<ul class="${cls}">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : '');
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
  ['/', 'Inicio'], ['/perfil-ejecutivo/', 'Perfil ejecutivo'], ['/perfil-tecnico/', 'Perfil técnico'],
  ['/trayectoria/', 'Trayectoria'], ['/logros/', 'Logros'], ['/certificaciones/', 'Certificaciones'],
  ['/proyectos/', 'Proyectos'], ['/documentos/', 'Documentos'], ['/contacto/', 'Contacto'],
];
function layout({ title, desc, route, body, noindex = false, ld = null, type = 'website' }) {
  const full = title === site.shortName ? site.title : `${title} | ${site.shortName}`;
  const url = abs(route);
  const nav = NAV.map(([r, t]) => `<li><a href="${L(r)}"${r === route || (r !== '/' && route.startsWith(r)) ? ' aria-current="page"' : ''}>${t}</a></li>`).join('');
  return `<!doctype html>
<html lang="${site.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(desc)}">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'">
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
<link rel="stylesheet" href="${L('/assets/styles.css')}">
${ld ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>` : ''}
</head>
<body data-view="all" data-base="${esc(BASE)}">
<a class="skip" href="#contenido">Saltar al contenido</a>
<header class="site-header">
  <div class="wrap bar">
    <a class="brand" href="${L('/')}"><span class="mark" aria-hidden="true">MM</span><span>${esc(site.shortName)}</span></a>
    <button class="menu-btn" aria-expanded="false" aria-controls="menu">Menú</button>
    <nav id="menu" aria-label="Principal"><ul>${nav}</ul></nav>
  </div>
  <div class="wrap tools">
    <form class="gsearch" role="search" action="${L('/buscar/')}" method="get"><label class="sr" for="q">Buscar en el sitio</label><input id="q" name="q" type="search" placeholder="Buscar empresa, tecnología, proyecto…" autocomplete="off"><button type="submit">Buscar</button></form>
    <div class="views" role="group" aria-label="Vista de lectura">
      <span class="views-l">Vista:</span>
      <button data-set-view="all" aria-pressed="true">Completa</button>
      <button data-set-view="exec" aria-pressed="false">Ejecutiva</button>
      <button data-set-view="tech" aria-pressed="false">Técnica</button>
    </div>
  </div>
</header>
<main id="contenido">
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <p><strong>${esc(site.shortName)}</strong> · ${esc(profile.location)}</p>
    <p class="muted">Documento de acceso por enlace privado. Solo se incluye información verificada o autorizada. Última revisión: ${esc(site.lastReview)}. Este sitio no usa cookies de seguimiento ni analítica.</p>
    <p><a href="${L('/')}">Volver al inicio</a> · <a href="${L('/buscar/')}">Buscador</a></p>
  </div>
</footer>
<script src="${L('/assets/app.js')}" defer></script>
</body>
</html>
`;
}
const shareBar = (route, title) => `<div class="actions no-print"><button class="btn ghost" data-share data-url="${abs(route)}" data-title="${esc(title)}">Compartir enlace</button><button class="btn ghost" data-copy="${abs(route)}">Copiar enlace</button><button class="btn ghost" data-print>Imprimir o guardar PDF</button></div><p class="perma muted no-print">Enlace permanente: <a href="${L(route)}">${abs(route)}</a></p>`;
const hero = (h, lead, route, extra = '') => `<section class="page-head"><div class="wrap"><nav class="crumbs" aria-label="Ruta"><a href="${L('/')}">Inicio</a> › <span>${esc(h)}</span></nav><h1>${esc(h)}</h1><p class="lead">${esc(lead)}</p>${extra}${shareBar(route, h)}</div></section>`;

// ---------- páginas ----------
const cvDoc = docs.find((d) => /^CV/i.test(d.category));
const cvHref = cvDoc ? L(`/documents/${cvDoc.file}`) : L('/documentos/');
const cvLabel = cvDoc ? 'Descargar currículum' : 'Consultar currículum';
const company = (e) => `${esc(e.company)}`;
const roleLine = (e) => [e.roleConfirmed && e.role ? e.role : '', clean(e.relationship)].filter(Boolean).join(' · ');

function home() {
  const jobs = exps.filter((e) => e.slug !== '5m-technology').length;
  const facts = [
    [`+${profile.yearsTech}`, 'años de experiencia en tecnología'],
    [`${profile.yearsManagement}`, 'años en posiciones gerenciales de TI'],
    [`${exps.length}`, 'expedientes profesionales documentados'],
    [`${profile.sectors.length}`, 'sectores de experiencia'],
  ].map(([n, t]) => `<div class="fact"><b>${esc(n)}</b><span>${esc(t)}</span></div>`).join('');
  const results = metrics.length
    ? `<div class="grid3">${metrics.slice(0, 5).map((m) => `<article class="card"><h3>${esc(m.claimedValue)}</h3><p>${esc(m.title)}</p><p class="muted">${esc(m.company)} · ${esc(m.period)}</p></article>`).join('')}</div><p><a href="${L('/logros/')}">Ver método y fuente de cada resultado</a></p>`
    : `<p class="note">Los resultados medibles se publican únicamente después de validar su línea base, período, método de cálculo y fuente. Consulte la sección de <a href="${L('/logros/')}">logros</a>.</p>`;
  const quick = [['/trayectoria/', 'Trayectoria', 'Siete expedientes por empresa, con enlace propio.'], ['/logros/', 'Logros', 'Resultados con método y fuente de validación.'], ['/certificaciones/', 'Certificaciones', 'Credenciales con enlace de verificación.'], ['/proyectos/', 'Proyectos', 'Proyectos tecnológicos y su estado real.'], ['/contacto/', 'Contacto', 'Canales profesionales verificados.']]
    .map(([r, t, d]) => `<a class="card link-card" href="${L(r)}"><h3>${t}</h3><p>${d}</p></a>`).join('');
  const body = `<section class="hero"><div class="wrap">
  <p class="eyebrow">${esc(profile.location)}</p>
  <h1>${esc(profile.name)}</h1>
  <p class="headline">${esc(profile.headline)}</p>
  <p class="lead">${esc(profile.tagline)}</p>
  <div class="actions"><a class="btn primary" href="${L('/trayectoria/')}">Ver trayectoria</a><a class="btn" href="${cvHref}">${cvLabel}</a><button class="btn ghost" data-share data-url="${abs('/')}" data-title="${esc(site.title)}">Compartir portafolio</button><button class="btn ghost" data-copy="${abs('/')}">Copiar enlace</button></div>
  <p class="ext">${links.map((l) => ext(l.url, l.label)).join(' · ')}</p>
</div></section>
<section class="wrap block"><h2>Resumen ejecutivo</h2>${ul(profile.summary, 'summary')}<div class="facts">${facts}</div><p class="muted small">${esc(profile.yearsNote)}</p></section>
<section class="band"><div class="wrap block"><h2>Áreas de especialización</h2><ul class="chips">${profile.specialties.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
<h3>Sectores</h3><ul class="chips alt">${profile.sectors.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div></section>
<section class="wrap block"><h2>Resultados profesionales</h2>${results}</section>
<section class="wrap block"><h2>Explore el expediente</h2><div class="grid3">${quick}</div>
<p>Dos formas de lectura: <a href="${L('/perfil-ejecutivo/')}">perfil ejecutivo</a> para dirección y selección, y <a href="${L('/perfil-tecnico/')}">perfil operativo y técnico</a> para entrevistadores especializados.</p></section>`;
  const ld = { '@context': 'https://schema.org', '@type': 'Person', name: profile.name, jobTitle: 'Gerente de Tecnología e Infraestructura', description: site.description, address: { '@type': 'PostalAddress', addressLocality: 'Santo Domingo', addressCountry: 'DO' }, url: abs('/'), sameAs: links.map((l) => l.url) };
  out('index.html', layout({ title: site.shortName, desc: site.description, route: '/', body, ld }));
}

function perfilEjecutivo() {
  const lab = { demostrada: 'Experiencia demostrada', requiere: 'Requiere evidencia adicional' };
  const rows = (ev) => profile.executiveAreas.filter((a) => a.evidence === ev).map((a) => `<article class="card"><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p></article>`).join('');
  const body = hero('Perfil ejecutivo', 'Para directores generales, reclutadores ejecutivos, propietarios de empresas y responsables de selección.', '/perfil-ejecutivo/') + `
<section class="wrap block"><h2>Resumen de trayectoria</h2>${ul(profile.summary)}<p><a href="${L('/trayectoria/')}">Consultar la trayectoria cronológica</a></p></section>
<section class="wrap block"><h2>${lab.demostrada}</h2><p class="muted">Competencias respaldadas por un cargo o actividad confirmados.</p><div class="grid2">${rows('demostrada')}</div></section>
<section class="band"><div class="wrap block"><h2>${lab.requiere}</h2><p class="muted">Competencias propias del rol gerencial que aún no se acompañan de casos documentados. No se presentan como logros.</p><div class="grid2">${rows('requiere')}</div></div></section>`;
  out('perfil-ejecutivo/index.html', layout({ title: 'Perfil ejecutivo', desc: 'Dirección de tecnología, continuidad del negocio, gestión de proveedores y equipos. Experiencia demostrada y competencias por evidenciar.', route: '/perfil-ejecutivo/', body }));
}

function perfilTecnico() {
  const lab = { demostrada: 'Experiencia demostrada', 'por-confirmar': 'Por confirmar con evidencia' };
  const cards = profile.technicalAreas.map((a, i) => `<article class="card" id="area-${i + 1}"><span class="tag ${a.level}">${lab[a.level]}</span><h3>${i + 1}. ${esc(a.title)}</h3><p>${esc(a.use)}</p></article>`).join('');
  const body = hero('Perfil operativo y técnico', 'Para gerentes de TI, líderes técnicos, responsables de infraestructura y entrevistadores especializados. Cada competencia indica su uso práctico y no incluye porcentajes de dominio.', '/perfil-tecnico/') + `<section class="wrap block"><div class="grid2">${cards}</div></section>`;
  out('perfil-tecnico/index.html', layout({ title: 'Perfil operativo y técnico', desc: 'Infraestructura, redes, seguridad, nube híbrida, continuidad, WMS y automatización: competencias técnicas con su contexto de uso.', route: '/perfil-tecnico/', body }));
}

function trayectoria() {
  const item = (e) => `<li class="tl"><article class="card"><p class="period">${esc(e.periodDisplay)}</p><h3><a href="${L(`/experiencia/${e.slug}/`)}">${company(e)}</a></h3><p>${esc([e.roleConfirmed ? e.role : '', e.sector].filter(Boolean).join(' · ') || clean(e.relationship) || '')}</p><p>${esc(e.summary)}</p>${e.periodNote ? `<p class="muted small">${esc(e.periodNote)}</p>` : ''}<p><a href="${L(`/experiencia/${e.slug}/`)}">Abrir expediente de ${esc(e.company)}</a></p></article></li>`;
  const jobs = exps.filter((e) => e.slug !== '5m-technology');
  const biz = exps.filter((e) => e.slug === '5m-technology');
  const body = hero('Trayectoria profesional', 'Cronología de empresas y etapas confirmadas, de la más reciente a la más antigua. Cada expediente tiene su propio enlace permanente.', '/trayectoria/') + `
<section class="wrap block"><h2>Empleos y contratos</h2><ol class="timeline">${jobs.map(item).join('')}</ol></section>
<section class="band"><div class="wrap block"><h2>Actividad empresarial propia</h2><p class="muted">Se muestra aparte para no confundirla con empleos o contratos. Puede coincidir en el tiempo con otras etapas; las fechas por mes se confirmarán.</p><ol class="timeline">${biz.map(item).join('')}</ol></div></section>`;
  out('trayectoria/index.html', layout({ title: 'Trayectoria profesional', desc: 'Trayectoria cronológica de Mario Méndez Alcántara: ODS/ODW Logistics, MADECO, UNIPAGO, Dominicana de Cales, VICRISA, Consorcio de Bancas y 5M Technology.', route: '/trayectoria/', body }));
}

function experiencia() {
  exps.forEach((e, i) => {
    const route = `/experiencia/${e.slug}/`;
    const prev = exps[i - 1], next = exps[i + 1];
    const myProj = projects.filter((p) => p.relatedCompany === e.slug);
    const myMetrics = metrics.filter((m) => m.company === e.company || m.company === e.slug);
    const cases = (e.cases || []).map((c) => `<article class="card case" id="${esc(c.id || slugify(c.title))}"><h3>${esc(c.title)}</h3><dl>${[['Situación inicial', c.situation], ['Problema o necesidad', c.problem], ['Objetivo', c.goal], ['Responsabilidad específica', c.responsibility], ['Solución aplicada', c.solution], ['Tecnologías', (c.technologies || []).join(', ')], ['Resultado obtenido', c.result], ['Métrica antes y después', c.metric], ['Alcance del resultado', c.scope], ['Evidencia verificable', c.evidence], ['Lecciones aprendidas', c.lessons]].filter(([, v]) => v).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl></article>`).join('');
    const ev = (e.evidence || []).map((x) => `<li>${ext(x.url, x.title)}${x.type ? ` <span class="muted">(${esc(x.type)})</span>` : ''}</li>`).join('');
    const techs = (e.technologies || []).map((t) => `<li><strong>${esc(t.name)}</strong>${clean(t.context) ? `: ${esc(t.context)}` : ''}</li>`).join('');
    const sec = (n, id, t, inner, aud = '') => `<section class="block ${aud}" id="${id}"><h2>${n}. ${t}</h2>${inner || empty}</section>`;
    const body = `<section class="page-head"><div class="wrap"><nav class="crumbs" aria-label="Ruta"><a href="${L('/')}">Inicio</a> › <a href="${L('/trayectoria/')}">Trayectoria</a> › <span>${company(e)}</span></nav>
<p class="eyebrow">${esc(e.periodDisplay)}</p><h1>${company(e)}</h1>
<p class="lead">${esc([roleLine(e), clean(e.sector), clean(e.location)].filter(Boolean).join(' · '))}</p>
${e.periodNote ? `<p class="note">${esc(e.periodNote)}</p>` : ''}${shareBar(route, `${e.company} | ${site.shortName}`)}
<nav class="toc no-print" aria-label="Secciones del expediente"><a href="#resumen">Resumen</a><a href="#contexto">Contexto</a><a href="#ejecutivas" class="aud-exec">Ejecutivas</a><a href="#operativas" class="aud-tech">Operativas</a><a href="#casos">Casos</a><a href="#impacto" class="aud-exec">Impacto</a><a href="#tecnologias" class="aud-tech">Tecnologías</a><a href="#evidencias">Evidencias</a><a href="#reclutadores">Reclutadores</a></nav></div></section>
<div class="wrap exp">
${sec(1, 'resumen', 'Resumen ejecutivo de la experiencia', `<p>${esc(e.summary)}</p>`)}
${sec(2, 'contexto', 'Contexto operativo', ul(e.context || []))}
${sec(3, 'ejecutivas', 'Responsabilidades ejecutivas', ul(e.executive || []), 'aud-exec')}
${sec(4, 'operativas', 'Responsabilidades operativas', ul(e.operational || []), 'aud-tech')}
${sec(5, 'casos', 'Casos de éxito', cases ? `<p class="muted">Se distingue entre resultados individuales, de equipo y de la empresa.</p>${cases}` : `${empty}<p class="muted small">Los casos se publican con su evidencia y alcance verificados.</p>`)}
${sec(6, 'impacto', 'Impacto empresarial', ul(e.impact || []) , 'aud-exec')}
${sec(7, 'tecnologias', 'Tecnologías y competencias demostradas', techs ? `<ul>${techs}</ul>` : '', 'aud-tech')}
${sec(8, 'evidencias', 'Evidencias y documentos', (ev ? `<ul>${ev}</ul>` : '') + (myMetrics.length ? `<h3>Métricas validadas</h3><ul>${myMetrics.map((m) => `<li>${esc(m.title)}: ${esc(m.claimedValue)}</li>`).join('')}</ul>` : '') + (myProj.length ? `<h3>Proyectos asociados</h3><ul>${myProj.map((p) => `<li><a href="${L(`/proyectos/${p.slug}/`)}">${esc(p.name)}</a></li>`).join('')}</ul>` : ''))}
${sec(9, 'reclutadores', 'Resumen para reclutadores', e.recruiterSummary?.length ? `<ol class="rec">${e.recruiterSummary.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>` : '')}
<nav class="pager no-print" aria-label="Otras experiencias"><div>${prev ? `← <a href="${L(`/experiencia/${prev.slug}/`)}">${esc(prev.company)}</a>` : ''}</div><div><a href="${L('/trayectoria/')}">Todas las experiencias</a> · <a href="${L('/perfil-ejecutivo/')}">Volver al perfil</a></div><div>${next ? `<a href="${L(`/experiencia/${next.slug}/`)}">${esc(next.company)}</a> →` : ''}</div></nav>
</div>`;
    const ld = { '@context': 'https://schema.org', '@type': 'ProfilePage', mainEntity: { '@type': 'Person', name: profile.name }, name: `${e.company}: experiencia profesional`, url: abs(route) };
    out(`experiencia/${e.slug}/index.html`, layout({ title: `${e.company}: experiencia profesional`, desc: `${e.summary} Expediente profesional de ${profile.name}.`.slice(0, 300), route, body, ld, type: 'article' }));
  });
}

function logros() {
  const rows = metrics.map((m) => `<tr data-company="${esc(m.company)}"><th scope="row">${esc(m.title)}<br><span class="muted small">${esc(m.definition)}</span></th><td>${esc(m.company)}<br><span class="muted small">${esc(m.project)}</span></td><td>${esc(m.period)}</td><td>${esc(m.baseline)} → ${esc(m.result)}</td><td>${esc(m.method)}</td><td>${esc(m.validationSource)}</td><td>${esc(m.scope)}</td></tr>`).join('');
  const body = hero('Logros y métricas', 'Cada resultado se asocia a la empresa y al proyecto que lo originó, con su método de cálculo y fuente de validación. No se suman resultados de proyectos distintos.', '/logros/') + `<section class="wrap block">${metrics.length ? `<div class="table-wrap"><table><thead><tr><th>Resultado</th><th>Empresa y proyecto</th><th>Período</th><th>Antes → después</th><th>Método</th><th>Fuente</th><th>Alcance</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="note">Aún no hay métricas validadas para publicar. Cada indicador se incorporará cuando se confirme su línea base, período, alcance, método de cálculo y fuente de validación.</p>`}</section>`;
  out('logros/index.html', layout({ title: 'Logros y métricas', desc: 'Resultados profesionales verificados, con empresa, proyecto, período, método de cálculo y fuente de validación.', route: '/logros/', body }));
}

function certificaciones() {
  const issuers = [...new Set(certs.map((c) => c.issuer))].sort();
  const cats = certData.categories.filter((c) => certs.some((x) => x.category === c));
  const years = [...new Set(certs.map((c) => (c.date || '').slice(0, 4)).filter(Boolean))].sort().reverse();
  const opt = (a) => a.map((v) => `<option>${esc(v)}</option>`).join('');
  const typeL = { certificacion: 'Certificación', curso: 'Curso', insignia: 'Insignia', formacion: 'Formación' };
  const cards = certs.map((c) => `<article class="card cert" data-issuer="${esc(c.issuer)}" data-cat="${esc(c.category)}" data-year="${esc((c.date || '').slice(0, 4))}">${c.badgeImage ? `<img src="${L(`/certifications/${c.badgeImage}`)}" alt="Insignia ${esc(c.name)}" width="96" height="96" loading="lazy">` : ''}<span class="tag">${typeL[c.type] || ''}</span><h3>${esc(c.name)}</h3><p>${esc(c.issuer)} · ${esc(c.category)}</p><p class="muted">${esc(c.date || '')}${c.expires ? ` · vence ${esc(c.expires)}` : ''}${c.credentialId ? ` · ID ${esc(c.credentialId)}` : ''}</p>${c.skills?.length ? `<p class="small">${esc(c.skills.join(', '))}</p>` : ''}${c.verifyUrl ? `<p>${ext(c.verifyUrl, 'Verificar credencial')}</p>` : ''}</article>`).join('');
  const body = hero('Certificaciones, cursos e insignias', 'Solo se muestran credenciales con denominación oficial y enlace o documento de verificación. Se conserva el nombre exacto de cada documento.', '/certificaciones/') + `<section class="wrap block">${certs.length ? `<div class="filters no-print"><label>Entidad <select data-f="issuer"><option value="">Todas</option>${opt(issuers)}</select></label><label>Categoría <select data-f="cat"><option value="">Todas</option>${opt(cats)}</select></label><label>Año <select data-f="year"><option value="">Todos</option>${opt(years)}</select></label><div class="views"><button data-cert-view="cards" aria-pressed="true">Tarjetas</button><button data-cert-view="list" aria-pressed="false">Lista compacta</button></div></div><div id="certs" class="grid3 cert-cards">${cards}</div><p id="none" class="note" hidden>Ninguna credencial coincide con el filtro.</p>` : `<p class="note">Las certificaciones y cursos se publicarán a medida que cada credencial sea verificada con su emisor. Las categorías previstas: ${certData.categories.join(', ')}.</p>`}</section>`;
  out('certificaciones/index.html', layout({ title: 'Certificaciones, cursos e insignias', desc: 'Credenciales profesionales con entidad emisora, fecha y enlace de verificación.', route: '/certificaciones/', body }));
}

function proyectos() {
  const types = [...new Set(projects.map((p) => p.type))].sort();
  const cards = projects.map((p) => `<article class="card" data-type="${esc(p.type)}"><span class="tag">${esc(p.type)}</span><h3><a href="${L(`/proyectos/${p.slug}/`)}">${esc(p.name)}</a></h3><p>${esc(p.summary)}</p><p class="muted small">Estado: ${esc(p.status)}</p></article>`).join('');
  const body = hero('Proyectos tecnológicos', 'Cada ficha indica su estado real y el rol desempeñado. Un prototipo no se presenta como producto terminado.', '/proyectos/') + `<section class="wrap block"><div class="filters no-print"><label>Tipo de proyecto <select data-pf><option value="">Todos</option>${types.map((t) => `<option>${esc(t)}</option>`).join('')}</select></label></div><div class="grid2" id="projs">${cards}</div></section>`;
  out('proyectos/index.html', layout({ title: 'Proyectos tecnológicos', desc: 'Catálogo de proyectos: 5M Technology, aplicaciones web, automatización e inteligencia artificial, con su estado real.', route: '/proyectos/', body }));
  projects.forEach((p) => {
    const route = `/proyectos/${p.slug}/`;
    const co = exps.find((e) => e.slug === p.relatedCompany);
    const dl = [['Rol', clean(p.role)], ['Estado', p.status], ['Problema', p.problem], ['Arquitectura', p.architecture]].filter(([, v]) => v).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('');
    const body = hero(p.name, p.summary, route) + `<section class="wrap block"><dl class="facts-dl">${dl}</dl>${p.technologies.length ? `<h2>Tecnologías</h2><ul class="chips">${p.technologies.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}${p.contributions.length ? `<h2>Contribuciones personales</h2>${ul(p.contributions)}` : ''}${p.links.length ? `<h2>Enlaces</h2><ul>${p.links.map((l) => `<li>${ext(l.url, l.title)}</li>`).join('')}</ul>` : ''}${co ? `<p>Expediente relacionado: <a href="${L(`/experiencia/${co.slug}/`)}">${esc(co.company)}</a></p>` : ''}<p><a href="${L('/proyectos/')}">← Todos los proyectos</a></p></section>`;
    out(`proyectos/${p.slug}/index.html`, layout({ title: p.name, desc: p.summary, route, body }));
  });
}

function documentos() {
  const cats = docData.categories.filter((c) => docs.some((d) => d.category === c));
  const list = docs.map((d) => `<li class="card" data-cat="${esc(d.category)}"><span class="tag">${esc(d.category)}</span><h3>${esc(d.title)}</h3><p>${esc(d.description)}</p><p class="muted small">${esc(d.date)}</p><p><a class="btn" href="${L(`/documents/${d.file}`)}" target="_blank" rel="noopener">Abrir</a> <a class="btn ghost" href="${L(`/documents/${d.file}`)}" download>Descargar</a></p></li>`).join('');
  const body = hero('Biblioteca de documentos', 'Documentos públicos o autorizados. Cada versión nueva reemplaza a la anterior para evitar datos inconsistentes.', '/documentos/') + `<section class="wrap block">${docs.length ? `<div class="filters no-print"><label>Categoría <select data-df><option value="">Todas</option>${cats.map((c) => `<option>${esc(c)}</option>`).join('')}</select></label></div><ul class="grid2 plain" id="docs">${list}</ul>` : `<p class="note">Los documentos (currículum y certificados, entre otros) se publicarán aquí en cuanto estén revisados y autorizados. Mientras tanto, el perfil de LinkedIn y el contacto están disponibles en la sección de <a href="${L('/contacto/')}">contacto</a>.</p>`}</section>`;
  out('documentos/index.html', layout({ title: 'Biblioteca de documentos', desc: 'Currículum, certificados y documentos públicos o autorizados.', route: '/documentos/', body }));
}

function contacto() {
  const c = profile.contact;
  const items = [c.email ? `<li><strong>Correo:</strong> <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>` : '', c.phone ? `<li><strong>Teléfono:</strong> <a href="tel:${esc(c.phone.replace(/\s/g, ''))}">${esc(c.phone)}</a></li>` : '', ...links.map((l) => `<li><strong>${esc(l.label)}:</strong> ${ext(l.url, l.url)}</li>`)].filter(Boolean).join('');
  const body = hero('Contacto', 'Canales profesionales verificados. Sin formularios que no envíen mensajes ni registros obligatorios.', '/contacto/') + `<section class="wrap block"><p><strong>Ubicación profesional:</strong> ${esc(profile.location)}</p><ul class="contact">${items}</ul></section>`;
  out('contacto/index.html', layout({ title: 'Contacto', desc: `Contacto profesional con ${profile.name}: perfiles y canales verificados.`, route: '/contacto/', body }));
}

function buscar() {
  const body = hero('Buscador', 'Consulta el contenido público de este sitio. Los elementos pendientes de validación no se indexan.', '/buscar/') + `<section class="wrap block"><form id="sf" class="filters" role="search" action="${L('/buscar/')}" method="get"><label>Texto <input id="sq" name="q" type="search"></label>
<label>Empresa <select id="f-company"><option value="">Todas</option></select></label><label>Área <select id="f-area"><option value="">Todas</option></select></label><label>Tecnología <select id="f-tech"><option value="">Todas</option></select></label><label>Tipo de proyecto <select id="f-ptype"><option value="">Todos</option></select></label><label>Certificación <select id="f-cert"><option value="">Todas</option></select></label></form>
<p id="count" aria-live="polite" class="muted"></p><ul id="results" class="plain results"></ul><noscript><p class="note">El buscador requiere JavaScript. Use el menú de navegación.</p></noscript></section>`;
  out('buscar/index.html', layout({ title: 'Buscador', desc: 'Buscador del contenido público del portafolio.', route: '/buscar/', body, noindex: true }));
}

function pagina404() {
  const body = `<section class="wrap block"><h1>Página no encontrada</h1><p class="lead">El enlace no existe o fue movido.</p><p><a class="btn primary" href="${L('/')}">Volver al inicio</a> <a class="btn" href="${L('/trayectoria/')}">Ver trayectoria</a> <a class="btn" href="${L('/buscar/')}">Buscar</a></p></section>`;
  out('404.html', layout({ title: 'Página no encontrada', desc: 'La página solicitada no existe.', route: '/404.html', body, noindex: true }));
}

function searchIndex() {
  const idx = [];
  const add = (e) => idx.push({ company: [], area: [], tech: [], ptype: [], cert: [], text: '', ...e });
  exps.forEach((e) => add({ title: e.company, url: L(`/experiencia/${e.slug}/`), kind: 'Experiencia', desc: e.summary, company: [e.company], tech: (e.technologies || []).map((t) => t.name), text: [e.sector, e.role, ...(e.context || []), ...(e.executive || []), ...(e.operational || []), ...(e.recruiterSummary || [])].join(' ') }));
  exps.forEach((e) => (e.cases || []).forEach((c) => add({ title: c.title, url: L(`/experiencia/${e.slug}/#${c.id || slugify(c.title)}`), kind: 'Caso de éxito', desc: c.result || c.situation || '', company: [e.company], tech: c.technologies || [], text: Object.values(c).flat().join(' ') })));
  projects.forEach((p) => add({ title: p.name, url: L(`/proyectos/${p.slug}/`), kind: 'Proyecto', desc: p.summary, company: p.relatedCompany ? [exps.find((e) => e.slug === p.relatedCompany)?.company].filter(Boolean) : [], ptype: [p.type], tech: p.technologies, text: p.type }));
  certs.forEach((c) => add({ title: c.name, url: L('/certificaciones/'), kind: 'Certificación', desc: `${c.issuer} · ${c.category}`, area: [c.category], cert: [c.name], tech: c.skills || [], text: c.issuer }));
  metrics.forEach((m) => add({ title: `${m.claimedValue}: ${m.title}`, url: L('/logros/'), kind: 'Logro', desc: m.definition, company: [m.company], text: m.project }));
  docs.forEach((d) => add({ title: d.title, url: L('/documentos/'), kind: 'Documento', desc: d.description, text: d.category }));
  profile.executiveAreas.forEach((a) => add({ title: a.title, url: L('/perfil-ejecutivo/'), kind: 'Competencia ejecutiva', desc: a.text, area: [a.title] }));
  profile.technicalAreas.forEach((a, i) => add({ title: a.title, url: L(`/perfil-tecnico/#area-${i + 1}`), kind: 'Competencia técnica', desc: a.use, area: [a.title] }));
  out('search-index.json', JSON.stringify(idx));
}

function seo() {
  if (!site.indexable) { out('robots.txt', 'User-agent: *\nDisallow: /\n'); return; } // modo privado: sin sitemap y sin indexación
  const pages = written.filter((f) => f.endsWith('index.html'));
  const skip = new Set(['buscar/index.html']);
  const urls = pages.filter((f) => !skip.has(f)).map((f) => `/${f.replace(/index\.html$/, '')}`);
  out('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${abs(u)}</loc><lastmod>${site.lastReview}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  out('robots.txt', `User-agent: *\nAllow: /\nDisallow: /buscar/\n\nSitemap: ${abs('/sitemap.xml')}\n`);
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
home(); perfilEjecutivo(); perfilTecnico(); trayectoria(); experiencia(); logros(); certificaciones(); proyectos(); documentos(); contacto(); buscar(); pagina404(); searchIndex(); seo(); ogImage();
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
