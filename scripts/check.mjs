// Pruebas de calidad automatizadas sobre dist/ (ejecutar tras `node scripts/build.mjs --local`).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { start, DIST } from './serve.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const errors = [];
const ok = [];
const fail = (m) => errors.push(m);
const pass = (m) => ok.push(m);

const server = await start(4174);
const origin = 'http://localhost:4174';
const get = async (p) => { const r = await fetch(origin + p); return { status: r.status, text: await r.text() }; };

// Rutas esperadas
const exps = fs.readdirSync(path.join(ROOT, 'content/experiencia')).filter((d) => fs.statSync(path.join(ROOT, 'content/experiencia', d)).isDirectory());
const MIN = rd('content/site.json').minimal;
const routes = MIN ? ['/'] : ['/', '/perfil-ejecutivo/', '/perfil-tecnico/', '/trayectoria/', '/logros/', '/certificaciones/', '/proyectos/', '/documentos/', ...exps.map((e) => `/experiencia/${e}/`)];
const pages = [...routes];
(function walk(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (f.name === 'index.html') { const r = '/' + path.relative(DIST, d).split(path.sep).join('/') + '/'; const u = r === '//' ? '/' : r; if (!pages.includes(u)) pages.push(u); } } })(DIST);

const idsCache = {};
const checked = new Set();
for (const p of pages) {
  const r = await get(p);
  if (r.status !== 200) { fail(`${p}: HTTP ${r.status}`); continue; }
  const h = r.text;
  idsCache[p] = new Set([...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  if (!/<title>[^<]{10,}<\/title>/.test(h)) fail(`${p}: falta <title>`);
  if (!/<meta name="description" content="[^"]{30,}"/.test(h)) fail(`${p}: falta meta description`);
  if (!/property="og:image" content="https?:\/\//.test(h)) fail(`${p}: falta og:image absoluto`);
  if (!/<html lang="es"/.test(h)) fail(`${p}: falta lang`);
  if ((h.match(/<h1[ >]/g) || []).length !== 1) fail(`${p}: debe haber un único h1`);
  for (const m of h.matchAll(/<img\b[^>]*>/g)) if (!/\salt="/.test(m[0])) fail(`${p}: imagen sin alt`);
  if (/<script(?![^>]*(src=|ld\+json))[^>]*>/.test(h)) fail(`${p}: script en línea (viola CSP)`);
  if (/\sstyle="/.test(h)) fail(`${p}: estilo en línea (viola CSP)`);
  for (const m of h.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) if (!/noopener/.test(m[0])) fail(`${p}: enlace externo sin noopener`);
}
if (!errors.length) pass(`${pages.length} páginas responden 200 con título, descripción, Open Graph, h1 único, lang e imágenes con alt`);

// Enlaces internos y anclas
let linkCount = 0;
for (const p of pages) {
  const h = (await get(p)).text;
  for (const m of h.matchAll(/(?:href|src)="([^"]+)"/g)) {
    let u = m[1];
    if (/^(https?:|mailto:|tel:|data:)/.test(u) || u.startsWith('#') && !u.slice(1)) continue;
    let target = u, hash = '';
    if (u.includes('#')) [target, hash] = u.split('#');
    if (u.startsWith('#')) target = p;
    target = target.split('?')[0];
    const key = target + '#' + hash;
    if (checked.has(key + '|' + p)) continue;
    checked.add(key + '|' + p);
    linkCount++;
    const r = await fetch(origin + target);
    if (r.status !== 200) { fail(`${p}: enlace roto ${u}`); continue; }
    if (hash) {
      let ids = idsCache[target] || idsCache[target + 'index.html'];
      if (!ids) { const t = await r.text(); ids = new Set([...t.matchAll(/\sid="([^"]+)"/g)].map((x) => x[1])); }
      if (!ids.has(hash)) fail(`${p}: ancla inexistente ${u}`);
    }
  }
}
pass(`${linkCount} enlaces/recursos internos verificados (incluye anclas)`);

// 404 y archivos SEO
const nf = await get('/ruta-que-no-existe/');
if (nf.status === 404 && /Página no encontrada/.test(nf.text)) pass('404 personalizada servida para rutas inexistentes'); else fail('404 personalizada no funciona');
const robots = (await get('/robots.txt')).text;
if (/Disallow: \/\s*$/m.test(robots) && !/Sitemap:/.test(robots) && (await get('/sitemap.xml')).status === 404) pass('Modo privado: robots.txt bloquea todo y no existe sitemap.xml'); else fail('Modo privado mal configurado (robots/sitemap)');
const png = fs.readFileSync(path.join(DIST, 'assets/og-default.png'));
if (png.slice(1, 4).toString() === 'PNG') pass('Imagen Open Graph PNG válida'); else fail('og-default.png inválido');

// Fugas: nada pendiente debe llegar a dist/
const all = [];
(function walk(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); f.isDirectory() ? walk(p) : /\.(html|json|xml|txt|js|css)$/.test(f.name) && all.push(p); } })(DIST);
const blob = all.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const hidden = [];
for (const m of rd('content/achievements/achievements.json').items.filter((x) => !(x.public && x.status === 'validada'))) hidden.push(m.title, m.id);
for (const c of rd('content/certifications/certifications.json').items.filter((x) => !(x.public && x.status === 'verificada'))) hidden.push(c.name, c.id);
for (const f of fs.readdirSync(path.join(ROOT, 'content/projects'))) { const p = rd(`content/projects/${f}`); if (!p.public) hidden.push(p.name, p.slug); }
const leaks = hidden.filter((h) => blob.includes(h));
leaks.length ? fail(`Contenido no público presente en dist: ${leaks.join('; ')}`) : pass('Métricas, certificaciones y proyectos no validados están ausentes del sitio y del índice de búsqueda');
for (const l of rd('content/profile/profile.json').links.filter((x) => !x.verified)) blob.includes(l.url) ? fail(`Enlace no verificado publicado: ${l.url}`) : pass(`Enlace sin verificar oculto: ${l.url}`);
const patterns = [[/\b(?:\d{1,3}\.){3}\d{1,3}\b/, 'dirección IP'], [/api[_-]?key|secret|password|passwd|token\s*[:=]/i, 'credencial'], [/lorem ipsum|\bTODO\b|FIXME/, 'texto de relleno']];
for (const [re, n] of patterns) re.test(blob) ? fail(`Posible ${n} en dist`) : pass(`Sin ${n} en dist`);
if (/https?:\/\/[^"' ]*(google-analytics|googletagmanager|facebook\.net|hotjar)/.test(blob)) fail('Rastreador externo'); else pass('Sin rastreadores ni recursos externos cargados');



server.close();
console.log('\nPRUEBAS APROBADAS:'); ok.forEach((m) => console.log('  ✔', m));
if (errors.length) { console.log('\nERRORES:'); errors.forEach((m) => console.log('  ✖', m)); process.exit(1); }
console.log('\nSin errores.');
