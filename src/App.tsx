import { useEffect, useMemo, useRef, useState } from 'react';
import { parseYouTubeId } from './core/youtube';
import { compareText } from './core/diff';
import { review, dueCards, dayKey, type Card } from './core/srs';
import { evaluate } from './core/assessment';
import { award, streak, type Activity } from './core/xp';
import { advance, canShowTranscript, newLesson, repeatListening, type Lesson, type Stage } from './core/lesson';
import { localRepo, type DB, type Song } from './data/repo';
import { SEED_WORDS, DICTATIONS, MINIMAL_PAIRS } from './data/content';

type Tab = 'home' | 'library' | 'review' | 'progress' | 'settings' | 'lesson';
const uid = () => crypto.randomUUID();
const today = () => dayKey(Date.now());
const STAGE_LABEL: Record<Stage, string> = { listening: 'Listening', confirm: 'Confirmar', reading: 'Reading', writing: 'Writing', speaking: 'Speaking', test: 'Test final', done: 'Resultado' };

function speak(text: string, accent: 'US' | 'UK', rate = 1) {
  if (!('speechSynthesis' in window)) return false;
  const u = new SpeechSynthesisUtterance(text); u.lang = accent === 'US' ? 'en-US' : 'en-GB'; u.rate = rate;
  speechSynthesis.cancel(); speechSynthesis.speak(u); return true;
}

export function App() {
  const [db, setDb] = useState<DB>(() => localRepo.load());
  const [tab, setTab] = useState<Tab>('home');
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => { localRepo.save(db); }, [db]);
  useEffect(() => { document.documentElement.dataset.theme = db.settings.theme; }, [db.settings.theme]);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    addEventListener('online', on); addEventListener('offline', off);
    return () => { removeEventListener('online', on); removeEventListener('offline', off); };
  }, []);
  const update = (f: (d: DB) => DB) => setDb((d) => f(d));
  const giveXp = (a: Activity) => update((d) => {
    const r = award(d.xp, a, today());
    return { ...d, xp: r.state, activeDays: d.activeDays.includes(today()) ? d.activeDays : [...d.activeDays, today()] };
  });
  const lesson = db.lessons.find((l) => l.id === lessonId) ?? null;
  const song = db.songs.find((s) => s.id === lesson?.songId);
  const setLesson = (l: Lesson) => update((d) => ({ ...d, lessons: d.lessons.map((x) => (x.id === l.id ? l : x)) }));
  const open = (id: string) => { setLessonId(id); setTab('lesson'); };

  return (
    <>
      {!online && <div className="banner" role="status">Sin conexión: el reproductor de YouTube no funciona, pero repaso, cuaderno y dictados guardados sí.</div>}
      <main>
        <h1>Lingua Songs AI</h1>
        {tab === 'home' && <Home db={db} go={setTab} open={open} />}
        {tab === 'library' && <Library db={db} update={update} open={open} />}
        {tab === 'review' && <Review db={db} update={update} giveXp={giveXp} />}
        {tab === 'progress' && <Progress db={db} />}
        {tab === 'settings' && <Settings db={db} update={update} />}
        {tab === 'lesson' && lesson && song && <LessonView key={lesson.id} db={db} lesson={lesson} song={song} setLesson={setLesson} update={update} giveXp={giveXp} online={online} />}
        {tab === 'lesson' && !lesson && <p>No hay lección activa. Ve a la biblioteca.</p>}
      </main>
      <nav aria-label="Navegación principal">
        {([['home', 'Inicio'], ['library', 'Canciones'], ['review', 'Repasar'], ['progress', 'Progreso'], ['settings', 'Ajustes']] as [Tab, string][]).map(([t, l]) => (
          <button key={t} aria-current={tab === t ? 'page' : undefined} onClick={() => setTab(t)}>{l}</button>
        ))}
      </nav>
    </>
  );
}

function Home({ db, go, open }: { db: DB; go: (t: Tab) => void; open: (id: string) => void }) {
  const due = dueCards(db.cards).length;
  const s = streak(db.activeDays, today());
  const active = db.lessons.filter((l) => l.stage !== 'done');
  return (
    <>
      <div className="card"><h2>Hola 👋</h2>
        <p>Aprende inglés con canciones de YouTube. Nivel orientativo: <b>{db.settings.level}</b> (no es una certificación oficial).</p>
        <p>XP: <b>{db.xp.total}</b> · Racha: <b>{s}</b> día(s) · Repasos pendientes: <b>{due}</b></p>
        <button className="p" onClick={() => go('library')}>Añadir canción</button>
        <button className="s" onClick={() => go('review')}>Repasar hoy</button>
      </div>
      {active.length > 0 && <div className="card"><h2>Continuar</h2>{active.map((l) => {
        const sg = db.songs.find((x) => x.id === l.songId)!;
        return <p key={l.id}>{sg.title} — etapa: {STAGE_LABEL[l.stage]} <button className="s" onClick={() => open(l.id)}>Retomar</button></p>;
      })}</div>}
      {db.songs.length === 0 && <p className="mut">Aún no hay canciones. Añade una URL de YouTube para empezar.</p>}
    </>
  );
}

function Library({ db, update, open }: { db: DB; update: (f: (d: DB) => DB) => void; open: (id: string) => void }) {
  const [url, setUrl] = useState(''), [title, setTitle] = useState(''), [artist, setArtist] = useState(''), [tr, setTr] = useState('');
  const [err, setErr] = useState('');
  const [rights, setRights] = useState(false);
  function add(e: React.FormEvent) {
    e.preventDefault();
    const id = parseYouTubeId(url);
    if (!id) return setErr('URL no compatible. Usa un enlace de youtube.com o youtu.be con un video válido.');
    if (!title.trim() || title.length > 120 || artist.length > 120) return setErr('Escribe un título (máx. 120 caracteres).');
    if (tr.trim() && !rights) return setErr('Confirma que tienes derecho a usar el texto que pegaste.');
    if (tr.length > 20000) return setErr('La transcripción es demasiado larga (máx. 20 000 caracteres).');
    const song: Song = { id: uid(), title: title.trim(), artist: artist.trim(), videoId: id, url: `https://www.youtube.com/watch?v=${id}`, level: db.settings.level, accent: db.settings.accent, transcript: tr.trim(), transcriptSource: tr.trim() ? 'user-provided' : 'none', createdAt: Date.now() };
    const l = newLesson(uid(), song.id);
    update((d) => ({ ...d, songs: [...d.songs, song], lessons: [...d.lessons, l] }));
    setErr(''); setUrl(''); setTitle(''); setArtist(''); setTr(''); open(l.id);
  }
  return (
    <>
      <form className="card" onSubmit={add} noValidate>
        <h2>Añadir canción</h2>
        <label htmlFor="url">URL de YouTube</label><input id="url" value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" />
        <label htmlFor="t">Título</label><input id="t" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label htmlFor="a">Artista</label><input id="a" value={artist} onChange={(e) => setArtist(e.target.value)} />
        <label htmlFor="tr">Transcripción (opcional)</label>
        <p className="mut">La app no extrae letras ni subtítulos de YouTube. Pega solo texto que tengas derecho a usar (tuyo, con licencia o dominio público).</p>
        <textarea id="tr" rows={5} value={tr} onChange={(e) => setTr(e.target.value)} />
        <label><input type="checkbox" style={{ width: 'auto' }} checked={rights} onChange={(e) => setRights(e.target.checked)} /> Tengo derecho a usar este texto</label>
        {err && <p role="alert" className="bad">{err}</p>}
        <div><button className="p" type="submit">Crear lección</button></div>
      </form>
      <h2>Mis canciones</h2>
      {db.songs.length === 0 && <p className="mut">Aún no hay canciones.</p>}
      {db.songs.map((s) => { const l = db.lessons.find((x) => x.songId === s.id)!; return (
        <div className="card" key={s.id}><b>{s.title}</b> — {s.artist || 'Artista desconocido'}<br />
          <span className="mut">Etapa: {STAGE_LABEL[l.stage]} · Transcripción: {s.transcriptSource === 'none' ? 'no disponible' : 'aportada por ti'}</span><br />
          <button className="p" onClick={() => open(l.id)}>{l.stage === 'done' ? 'Ver' : 'Continuar'}</button></div>); })}
    </>
  );
}

function LessonView(p: { db: DB; lesson: Lesson; song: Song; setLesson: (l: Lesson) => void; update: (f: (d: DB) => DB) => void; giveXp: (a: Activity) => void; online: boolean }) {
  const { lesson: l, song } = p;
  const steps: Stage[] = ['listening', 'confirm', 'reading', 'writing', 'speaking', 'test', 'done'];
  const go = (extra?: Partial<Lesson['completed']>) => { p.setLesson(advance(l)); void extra; };
  return (
    <>
      <h2>{song.title}</h2>
      <div className="steps" aria-label="Etapas">{steps.map((s) => <span key={s} className={s === l.stage ? 'on' : ''} aria-current={s === l.stage ? 'step' : undefined}>{STAGE_LABEL[s]}</span>)}</div>
      {l.stage === 'listening' && <Listening {...p} done={(secs) => { p.giveXp('listening'); p.setLesson(advance({ ...l, listening: { ...l.listening, seconds: l.listening.seconds + secs } })); }} />}
      {l.stage === 'confirm' && (
        <div className="card" role="dialog" aria-labelledby="cf"><h3 id="cf">¿Estás listo para comenzar la lectura y comparar lo que escuchaste con el texto?</h3>
          <button className="p" onClick={() => go()}>Sí, empezar Reading</button>
          <button className="s" onClick={() => p.setLesson(repeatListening(l))}>Necesito escuchar otra vez</button></div>)}
      {l.stage === 'reading' && canShowTranscript(l) && <Reading {...p} done={() => { p.giveXp('reading'); go(); }} />}
      {l.stage === 'writing' && <Writing {...p} done={() => { p.giveXp('writing'); go(); }} />}
      {l.stage === 'speaking' && <Speaking {...p} done={() => { p.giveXp('speaking'); go(); }} />}
      {(l.stage === 'test' || l.stage === 'done') && <FinalTest {...p} done={() => go()} />}
    </>
  );
}

function Listening({ lesson: l, song, setLesson, done, online }: { lesson: Lesson; song: Song; setLesson: (l: Lesson) => void; done: (secs: number) => void; online: boolean }) {
  const [secs, setSecs] = useState(0);
  const [cmp, setCmp] = useState(3), [diff, setDiff] = useState(3), [sum, setSum] = useState('');
  const [reload, setReload] = useState(0);
  const [ended, setEnded] = useState(false);
  useEffect(() => { const t = setInterval(() => setSecs((s) => s + 1), 1000); return () => clearInterval(t); }, []);
  // Ayuda opcional: el reproductor oficial informa del fin (state 0) vía postMessage con enablejsapi.
  useEffect(() => {
    const h = (e: MessageEvent) => { if (typeof e.data !== 'string' || !e.origin.includes('youtube.com')) return; try { const d = JSON.parse(e.data); if (d.event === 'onStateChange' && d.info === 0) setEnded(true); } catch { /* ignorar */ } };
    addEventListener('message', h); return () => removeEventListener('message', h);
  }, []);
  return (
    <div className="card">
      <h3>Escucha sin leer</h3>
      <p className="mut">La letra y las traducciones están ocultas. Tiempo: {Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')} · Repeticiones: {l.listening.replays}</p>
      {online
        ? <iframe key={reload} className="video" title={`Video de YouTube: ${song.title}`} src={`https://www.youtube-nocookie.com/embed/${song.videoId}?enablejsapi=1&rel=0&origin=${encodeURIComponent(location.origin)}`} allow="encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        : <p role="alert" className="bad">Sin conexión: YouTube necesita internet.</p>}
      {ended && <p role="status" className="ok">El reproductor indicó que el video terminó. Aun así, confirma tú cuando estés listo.</p>}
      <button className="s" onClick={() => { setReload((r) => r + 1); setLesson({ ...l, listening: { ...l.listening, replays: l.listening.replays + 1 } }); }}>Volver a escuchar</button>
      <h4>Autoevaluación (opcional)</h4>
      <label htmlFor="c">Comprensión (1–5): {cmp}</label><input id="c" type="range" min={1} max={5} value={cmp} onChange={(e) => setCmp(+e.target.value)} />
      <label htmlFor="d">Dificultad percibida (1–5): {diff}</label><input id="d" type="range" min={1} max={5} value={diff} onChange={(e) => setDiff(+e.target.value)} />
      <label htmlFor="s">¿Qué entendiste de la canción? (español o inglés)</label><textarea id="s" rows={3} value={sum} onChange={(e) => setSum(e.target.value)} />
      <button className="p" onClick={() => done(secs)}>Terminé de escuchar</button>
    </div>
  );
}

function Reading({ song, db, update, done }: { song: Song; db: DB; update: (f: (d: DB) => DB) => void; lesson: Lesson; done: () => void }) {
  const [manual, setManual] = useState({ term: '', meaning: '', example: '', translation: '' });
  const mine = db.cards.filter((c) => c.id.startsWith(song.id));
  const addCard = (c: Omit<Card, 'id' | 'status' | 'intervalDays' | 'nextReviewAt' | 'correctSessions' | 'usedActively'>) => update((d) => ({ ...d, cards: [...d.cards, { ...c, id: `${song.id}:${uid()}`, status: 'new', intervalDays: 0, nextReviewAt: 0, correctSessions: [], usedActively: false }] }));
  return (
    <>
      <div className="card"><h3>Texto</h3>
        {song.transcript ? <p style={{ whiteSpace: 'pre-wrap' }}>{song.transcript}</p> : <p className="mut">No hay transcripción disponible. No se obtuvo automáticamente por restricciones de derechos. Puedes continuar con el vocabulario original de abajo.</p>}
      </div>
      <div className="card"><h3>Vocabulario sugerido (contenido original)</h3>
        {SEED_WORDS.map((w) => { const saved = mine.some((c) => c.term === w.term); return (
          <div key={w.term}><b>{w.term}</b> {w.pronunciation} — {w.meaning} <span className="mut">({w.partOfSpeech}, {w.level})</span><br />
            <i>{w.example}</i> — {w.translation}<br />
            <button className="s" onClick={() => speak(w.term, song.accent)}>🔊 Escuchar</button>
            <button className="s" disabled={saved} onClick={() => addCard({ ...w, origin: 'inferred' })}>{saved ? 'Guardada' : 'Guardar tarjeta'}</button></div>); })}
        <p className="mut">Estado «inferido»: sugerido por la app, aún por verificar por ti. Las palabras que añadas manualmente quedan «confirmadas».</p>
      </div>
      <form className="card" onSubmit={(e) => { e.preventDefault(); if (!manual.term.trim() || !manual.meaning.trim()) return; addCard({ ...manual, term: manual.term.trim(), pronunciation: '', partOfSpeech: '', level: song.level, origin: 'confirmed' }); setManual({ term: '', meaning: '', example: '', translation: '' }); }}>
        <h3>Añadir mi palabra</h3>
        {(['term', 'meaning', 'example', 'translation'] as const).map((k) => <div key={k}><label htmlFor={'m' + k}>{({ term: 'Palabra en inglés', meaning: 'Significado', example: 'Ejemplo', translation: 'Traducción del ejemplo' })[k]}</label><input id={'m' + k} value={manual[k]} onChange={(e) => setManual({ ...manual, [k]: e.target.value })} /></div>)}
        <button className="s" type="submit">Guardar tarjeta</button>
      </form>
      <button className="p" onClick={done}>Continuar a Writing</button>
    </>
  );
}

function Writing({ song, db, update, done }: { song: Song; db: DB; update: (f: (d: DB) => DB) => void; lesson: Lesson; done: () => void }) {
  const dict = useMemo(() => DICTATIONS[Math.floor(Math.random() * DICTATIONS.length)], []);
  const [ans, setAns] = useState(''); const [res, setRes] = useState<ReturnType<typeof compareText> | null>(null);
  const cards = db.cards.filter((c) => c.id.startsWith(song.id));
  function check() {
    const r = compareText(dict, ans); setRes(r);
    update((d) => ({ ...d, writingAttempts: [...d.writingAttempts, { at: Date.now(), type: 'dictation', prompt: dict, response: ans, accuracy: r.accuracy }] }));
  }
  return (
    <>
      <div className="card"><h3>Mi cuaderno de inglés</h3>
        {cards.length === 0 ? <p className="mut">Guarda palabras en Reading para verlas aquí.</p> :
          <table><thead><tr><th>Palabra</th><th>Significado</th><th>Ejemplo</th><th>Notas</th></tr></thead><tbody>
            {cards.map((c) => <tr key={c.id}><td>{c.term}<br />{c.pronunciation}</td><td>{c.meaning}</td><td>{c.example}<br />{c.translation}</td><td style={{ minWidth: 100 }}></td></tr>)}</tbody></table>}
        <button className="s noprint" onClick={() => print()}>Imprimir / guardar PDF</button>
        <button className="s noprint" onClick={() => download('vocabulario.json', JSON.stringify(cards, null, 2), 'application/json')}>Exportar JSON</button>
        <button className="s noprint" onClick={() => download('vocabulario.csv', toCsv(cards), 'text/csv')}>Exportar CSV</button>
      </div>
      <div className="card"><h3>Dictado</h3>
        <button className="s" onClick={() => { if (!speak(dict, song.accent)) alert('Tu navegador no tiene síntesis de voz.'); }}>🔊 Reproducir</button>
        <button className="s" onClick={() => speak(dict, song.accent, 0.6)}>🐢 Lento</button>
        <label htmlFor="dict">Escribe lo que oyes</label><textarea id="dict" rows={2} value={ans} onChange={(e) => setAns(e.target.value)} />
        <button className="p" onClick={check} disabled={!ans.trim()}>Comparar</button>
        {res && <div role="status"><p>Precisión: <b>{Math.round(res.accuracy * 100)}%</b></p>
          <p>{res.items.map((it, i) => <mark key={i} className={it.kind === 'correct' ? 'g' : 'e'}>{it.actual ?? `[${it.expected}]`} </mark>)}</p>
          <p className="mut">Referencia: {dict}</p>
          <ul>{res.items.filter((i) => i.tip).map((i, k) => <li key={k}>{i.tip}</li>)}{res.punctuationNotes.map((n) => <li key={n}>{n}</li>)}</ul></div>}
      </div>
      <button className="p" onClick={done}>Continuar a Speaking</button>
    </>
  );
}
const csvCell = (s: string) => `"${String(s).replace(/"/g, '""').replace(/^([=+\-@])/, "'$1")}"`;
const toCsv = (c: Card[]) => ['term,meaning,pronunciation,example,translation', ...c.map((x) => [x.term, x.meaning, x.pronunciation, x.example, x.translation].map(csvCell).join(','))].join('\n');
function download(name: string, text: string, type: string) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); }

function Speaking({ song, update, done }: { song: Song; update: (f: (d: DB) => DB) => void; lesson: Lesson; done: () => void; db: DB }) {
  const target = 'I would like a cup of tea, please.';
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const [rec, setRec] = useState<string | null>(null), [msg, setMsg] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null); const [consent, setConsent] = useState(false);
  const mr = useRef<MediaRecorder | null>(null);
  async function record() {
    if (!consent) return setMsg('Marca el consentimiento: la grabación se queda solo en tu dispositivo.');
    if (!navigator.mediaDevices?.getUserMedia || !('MediaRecorder' in window)) return setMsg('Tu navegador no permite grabar audio.');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = []; const m = new MediaRecorder(stream); mr.current = m;
      m.ondataavailable = (e) => chunks.push(e.data);
      m.onstop = () => { stream.getTracks().forEach((t) => t.stop()); setAudioUrl(URL.createObjectURL(new Blob(chunks))); };
      m.start(); setMsg('Grabando… pulsa Detener.');
      setTimeout(() => m.state === 'recording' && m.stop(), 15000);
    } catch { setMsg('Permiso de micrófono denegado. Actívalo en la configuración del navegador o continúa sin grabar.'); }
  }
  function recognize() {
    if (!SR) return setMsg('Este navegador no tiene reconocimiento de voz. No se genera puntuación; usa grabar y comparar al oído.');
    const r = new SR(); r.lang = song.accent === 'US' ? 'en-US' : 'en-GB';
    r.onresult = (e: any) => { const t = e.results[0][0].transcript as string; setRec(t); update((d) => ({ ...d, speakingAttempts: [...d.speakingAttempts, { at: Date.now(), reference: target, recognized: t, status: 'recognized' }] })); };
    r.onerror = () => setMsg('No se pudo reconocer la voz (permiso o conexión).'); r.start();
  }
  const cmp = rec ? compareText(target, rec) : null;
  return (
    <>
      <div className="card"><h3>Escuchar, repetir y comparar</h3>
        <p><b>{target}</b></p>
        <button className="s" onClick={() => speak(target, song.accent)}>🔊 Normal</button><button className="s" onClick={() => speak(target, song.accent, 0.6)}>🐢 Lento</button>
        <label><input type="checkbox" style={{ width: 'auto' }} checked={consent} onChange={(e) => setConsent(e.target.checked)} /> Acepto grabar mi voz (solo local; no se envía a ningún servidor por la app)</label>
        <div><button className="s" onClick={record}>🎙️ Grabar</button><button className="s" onClick={() => mr.current?.state === 'recording' && mr.current.stop()}>Detener</button>
          <button className="s" onClick={recognize}>Reconocer voz</button></div>
        {audioUrl && <div><audio controls src={audioUrl} /><button className="s" onClick={() => { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }}>Eliminar grabación</button></div>}
        {msg && <p role="status">{msg}</p>}
        {cmp && <p role="status">Reconocido: «{rec}» — coincidencia de texto: <b>{Math.round(cmp.accuracy * 100)}%</b>. <span className="mut">Esto mide coincidencia de transcripción, no pronunciación fonética.</span></p>}
        <p className="mut">Limitación: no hay evaluación de fonemas gratuita; la app solo compara texto reconocido y te deja escuchar tu grabación.</p>
      </div>
      <div className="card"><h3>Pares mínimos</h3>{MINIMAL_PAIRS.map(([a, b]) => <p key={a}>{a} / {b} <button className="s" onClick={() => speak(a, song.accent)}>🔊 {a}</button><button className="s" onClick={() => speak(b, song.accent)}>🔊 {b}</button></p>)}</div>
      <button className="p" onClick={done}>Ir al test final</button>
    </>
  );
}

function FinalTest({ db, lesson: l, song, update, giveXp, done }: { db: DB; lesson: Lesson; song: Song; update: (f: (d: DB) => DB) => void; giveXp: (a: Activity) => void; done: () => void }) {
  const cards = db.cards.filter((c) => c.id.startsWith(song.id));
  const pool = cards.length >= 2 ? cards : SEED_WORDS.map((w) => ({ ...w, id: w.term }) as unknown as Card);
  const qs = useMemo(() => pool.slice(0, 5).map((c) => ({ c, opts: [...pool].sort(() => Math.random() - 0.5).slice(0, 3).map((x) => x.meaning).concat(c.meaning).filter((v, i, a) => a.indexOf(v) === i).sort(() => Math.random() - 0.5) })), []);
  const [ans, setAns] = useState<Record<number, string>>({}); const [fill, setFill] = useState('');
  const [res, setRes] = useState<ReturnType<typeof evaluate> | null>(null);
  const hist = db.assessments.filter((a) => a.lessonId === l.id);
  function submit() {
    const right = qs.filter((q, i) => ans[i] === q.c.meaning).length;
    const reading = Math.round((right / qs.length) * 25);
    const wr = db.writingAttempts.slice(-3); const fillAcc = compareText(qs[0].c.term, fill).accuracy;
    const writing = Math.round(((wr.length ? wr.reduce((s, a) => s + a.accuracy, 0) / wr.length : 0) * 0.5 + fillAcc * 0.5) * 25);
    const sp = db.speakingAttempts.filter((a) => a.status === 'recognized').slice(-3);
    const speaking = sp.length ? Math.round((sp.reduce((s, a) => s + compareText(a.reference, a.recognized!).accuracy, 0) / sp.length) * 25) : null;
    // Listening: el test no puede medir la escucha real sin audio autorizado; se usa autoevaluación y se marca como estimación.
    const listening = Math.round((right / qs.length) * 25);
    const r = evaluate({ listening, reading, writing, speaking }, { threshold: db.settings.threshold, minPerSkill: db.settings.minPerSkill });
    setRes(r); giveXp('test');
    update((d) => ({ ...d, assessments: [...d.assessments, { lessonId: l.id, at: Date.now(), scores: { ...r.perSkill }, total: r.total, passed: r.passed }] }));
  }
  return (
    <div className="card"><h3>Test final</h3>
      {qs.map((q, i) => <fieldset key={i}><legend>¿Qué significa «{q.c.term}»? <button className="s" onClick={() => speak(q.c.term, song.accent)}>🔊</button></legend>
        {q.opts.map((o) => <label key={o} style={{ display: 'block', fontWeight: 400 }}><input type="radio" style={{ width: 'auto' }} name={'q' + i} checked={ans[i] === o} onChange={() => setAns({ ...ans, [i]: o })} /> {o}</label>)}</fieldset>)}
      <label htmlFor="fill">Escribe en inglés: «{qs[0].c.meaning}»</label><input id="fill" value={fill} onChange={(e) => setFill(e.target.value)} />
      <button className="p" onClick={submit}>Calificar</button>
      {res && <div role="status"><h4>Total: {res.total}/{res.maxPossible} {res.passed ? '✅ Aprobado' : '— Pendiente de dominio'}</h4>
        <ul><li>Listening: {res.perSkill.listening}/25 (estimado con las preguntas de palabras; no hay audio autorizado para medir escucha real)</li><li>Reading: {res.perSkill.reading}/25</li><li>Writing: {res.perSkill.writing}/25</li>
          <li>Speaking: {res.perSkill.speaking === null ? 'pendiente (sin reconocimiento de voz, no se inventa puntuación)' : res.perSkill.speaking + '/25'}</li></ul>
        <p>Prioridades de mejora: {res.priorities.join(', ')}</p>
        <p className="mut">Respuestas correctas: {qs.map((q) => `${q.c.term} = ${q.c.meaning}`).join(' · ')}</p>
        {!res.passed && <p>Puedes repetir el test, revisar errores o avanzar igualmente (la lección queda pendiente de dominio).</p>}
        <button className="s" onClick={() => { setRes(null); setAns({}); setFill(''); }}>Repetir prueba</button>
        {l.stage === 'test' && <button className="p" onClick={done}>Finalizar lección</button>}</div>}
      {hist.length > 0 && <p className="mut">Intentos previos: {hist.map((h) => h.total).join(', ')}</p>}
    </div>
  );
}

function Review({ db, update, giveXp }: { db: DB; update: (f: (d: DB) => DB) => void; giveXp: (a: Activity) => void }) {
  const due = dueCards(db.cards); const [shown, setShown] = useState(false); const [typed, setTyped] = useState('');
  const c = due[0];
  if (!c) return <p className="card">🎉 No tienes repasos pendientes hoy. {db.cards.length === 0 && 'Guarda tarjetas desde Reading.'}</p>;
  const answer = (ok: boolean, active = false) => { update((d) => ({ ...d, cards: d.cards.map((x) => (x.id === c.id ? review(x, ok, Date.now(), active) : x)) })); giveXp('review'); setShown(false); setTyped(''); };
  const okTyped = compareText(c.term, typed).accuracy >= 0.99;
  return (
    <div className="card"><h2>Repasar hoy ({due.length})</h2>
      <p>Significado: <b>{c.meaning}</b></p>
      <label htmlFor="rv">Escríbelo en inglés</label><input id="rv" value={typed} onChange={(e) => setTyped(e.target.value)} />
      {!shown ? <button className="p" onClick={() => setShown(true)}>Comprobar</button> : <div role="status">
        <p>Respuesta: <b>{c.term}</b> {okTyped ? <span className="ok">✔ Correcto</span> : <span className="bad">✘ Revisa</span>}</p>
        <button className="p" onClick={() => answer(okTyped, true)}>Continuar</button></div>}
      <p className="mut">Estado: {c.status}</p>
    </div>
  );
}

function Progress({ db }: { db: DB }) {
  const last = db.assessments.slice(-3).reverse();
  const counts = db.cards.reduce<Record<string, number>>((m, c) => ({ ...m, [c.status]: (m[c.status] ?? 0) + 1 }), {});
  const badges = [
    ['Primera canción completada', db.lessons.some((l) => l.stage === 'done')],
    ['Siete días de práctica', streak(db.activeDays, today()) >= 7],
    ['Diez dictados completados', db.writingAttempts.filter((a) => a.type === 'dictation').length >= 10],
    ['Cinco lecciones aprobadas', db.assessments.filter((a) => a.passed).length >= 5],
    ['Cien palabras aprendidas', db.cards.filter((c) => c.status === 'mastered').length >= 100],
  ] as [string, boolean][];
  return (
    <>
      <div className="card"><h2>Mapa A1 → B2 (orientativo)</h2>
        {['A1', 'A2', 'B1', 'B2'].map((lv, i) => { const passed = db.assessments.filter((a) => a.passed).length; const pct = Math.min(100, Math.max(0, (passed - i * 3) * 33)); return <div key={lv}><b>{lv}</b> {pct}% <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={'Progreso ' + lv}><i style={{ width: pct + '%' }} /></div></div>; })}
        <p className="mut">Cada nivel requiere 3 lecciones aprobadas (≥ {db.settings.threshold}). No es una certificación oficial.</p></div>
      <div className="card"><h2>XP y racha</h2><p>{db.xp.total} XP · racha {streak(db.activeDays, today())} día(s). El XP tiene tope diario por actividad.</p></div>
      <div className="card"><h2>Logros</h2><ul>{badges.map(([n, ok]) => <li key={n}>{ok ? '🏅' : '🔒'} {n}</li>)}</ul></div>
      <div className="card"><h2>Diagnóstico</h2>
        {last.length === 0 ? <p className="mut">Completa un test para ver resultados.</p> : last.map((a) => <p key={a.at}>{new Date(a.at).toLocaleDateString()} — total {a.total}; {Object.entries(a.scores).map(([k, v]) => `${k}: ${v ?? 'pendiente'}`).join(', ')}</p>)}
        <p>Tarjetas: {Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' · ') || 'ninguna'}</p>
        <p className="mut">Solo se muestran mediciones registradas; no se estiman porcentajes de mejora sin datos comparables.</p></div>
    </>
  );
}

function Settings({ db, update }: { db: DB; update: (f: (d: DB) => DB) => void }) {
  const s = db.settings; const set = (p: Partial<typeof s>) => update((d) => ({ ...d, settings: { ...d.settings, ...p } }));
  const [note, setNote] = useState('');
  async function enableNotif(on: boolean) {
    if (!on) return set({ reminders: { ...s.reminders, daily: false } });
    if (!('Notification' in window)) return setNote('Este navegador no admite notificaciones.');
    const p = await Notification.requestPermission();
    if (p !== 'granted') return setNote('Permiso denegado: no se enviarán recordatorios.');
    set({ reminders: { ...s.reminders, daily: true } });
    setNote('Activado. Los navegadores solo muestran avisos locales mientras la app esté abierta o instalada; no hay entrega garantizada en segundo plano.');
  }
  return (
    <>
      <div className="card"><h2>Idioma, nivel y acento</h2>
        <label htmlFor="lv">Nivel (manual)</label><select id="lv" value={s.level} onChange={(e) => set({ level: e.target.value })}>{['A1', 'A2', 'B1', 'B2'].map((x) => <option key={x}>{x}</option>)}</select>
        <label htmlFor="ac">Acento</label><select id="ac" value={s.accent} onChange={(e) => set({ accent: e.target.value as 'US' | 'UK' })}><option value="US">Americano</option><option value="UK">Británico</option></select>
        <label htmlFor="th">Umbral para aprobar: {s.threshold}</label><input id="th" type="range" min={50} max={100} value={s.threshold} onChange={(e) => set({ threshold: +e.target.value })} />
        <label htmlFor="mn">Mínimo por habilidad: {s.minPerSkill}/25</label><input id="mn" type="range" min={0} max={25} value={s.minPerSkill} onChange={(e) => set({ minPerSkill: +e.target.value })} />
        <label htmlFor="th2">Tema</label><select id="th2" value={s.theme} onChange={(e) => set({ theme: e.target.value as any })}><option value="auto">Automático</option><option value="light">Claro</option><option value="dark">Oscuro</option></select></div>
      <div className="card"><h2>Recordatorios</h2>
        <label><input type="checkbox" style={{ width: 'auto' }} checked={s.reminders.daily} onChange={(e) => enableNotif(e.target.checked)} /> Recordatorio diario ({s.timezone})</label>
        <label htmlFor="tm">Hora</label><input id="tm" type="time" value={s.reminders.time} onChange={(e) => set({ reminders: { ...s.reminders, time: e.target.value } })} />
        {note && <p role="status">{note}</p>}</div>
      <div className="card"><h2>Privacidad y datos</h2>
        <p>Todo se guarda en este dispositivo. Sin cuentas, sin anuncios, sin venta de datos. Las grabaciones no se almacenan.</p>
        <button className="s" onClick={() => download('lingua-datos.json', JSON.stringify(db, null, 2), 'application/json')}>Exportar mis datos</button>
        <button className="s" onClick={() => { if (confirm('¿Borrar todos los datos locales?')) { localRepo.clear(); location.reload(); } }}>Borrar todos mis datos</button></div>
      <div className="card"><h2>Ayuda y limitaciones</h2><ul>
        <li>YouTube requiere conexión; la app no extrae audio, letras ni subtítulos.</li>
        <li>No hay evaluación fonética profesional; el reconocimiento de voz depende del navegador.</li>
        <li>Los niveles son orientativos, no certificaciones.</li>
        <li>Pendiente: tutor con IA, sincronización en la nube, app Android firmada.</li></ul></div>
    </>
  );
}
