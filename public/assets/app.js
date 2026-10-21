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

  // Buscador global (consulta /search-index.json, generado solo con contenido público)
  var sf = $('#sf');
  if (sf) {
    var facets = ['company', 'area', 'tech', 'ptype', 'cert'];
    var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); };
    fetch(base + '/search-index.json').then(function (r) { return r.json(); }).then(function (idx) {
      facets.forEach(function (f) {
        var set = {}; idx.forEach(function (e) { (e[f] || []).forEach(function (v) { if (v) set[v] = 1; }); });
        var sel = $('#f-' + f);
        Object.keys(set).sort().forEach(function (v) { var o = document.createElement('option'); o.textContent = v; o.value = v; sel.appendChild(o); });
        sel.addEventListener('change', run);
      });
      var q = $('#sq');
      q.value = new URLSearchParams(location.search).get('q') || '';
      q.addEventListener('input', run);
      sf.addEventListener('submit', function (e) { e.preventDefault(); run(); });
      function run() {
        var terms = norm(q.value).split(/\s+/).filter(Boolean);
        var res = idx.filter(function (e) {
          for (var i = 0; i < facets.length; i++) { var v = $('#f-' + facets[i]).value; if (v && (e[facets[i]] || []).indexOf(v) < 0) return false; }
          var hay = norm([e.title, e.desc, e.text, e.kind, (e.tech || []).join(' '), (e.company || []).join(' ')].join(' '));
          return terms.every(function (t) { return hay.indexOf(t) > -1; });
        });
        $('#count').textContent = res.length + (res.length === 1 ? ' resultado' : ' resultados');
        var ul = $('#results'); ul.textContent = '';
        res.forEach(function (e) {
          var li = document.createElement('li'), a = document.createElement('a'), k = document.createElement('span'), p = document.createElement('p');
          a.href = e.url; a.textContent = e.title; k.className = 'tag'; k.textContent = e.kind; k.style.marginLeft = '8px';
          p.className = 'muted'; p.textContent = e.desc || '';
          li.appendChild(a); li.appendChild(k); li.appendChild(p); ul.appendChild(li);
        });
      }
      run();
    }).catch(function () { $('#count').textContent = 'No se pudo cargar el índice de búsqueda.'; });
  }
})();
