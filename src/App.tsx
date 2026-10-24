import { useEffect, useMemo, useRef, useState } from 'react';
import { parseYouTubeId } from './core/youtube';
import { compareText } from './core/diff';
import { review, dueCards, dayKey, type Card } from './core/srs';
import { evaluate } from './core/assessment';
import { award, streak, type Activity } from './core/xp';
import { advance, canShowTranscript, newLesson, repeatListening, type Lesson, type Stage } from './core/lesson';
import { loadAsync, saveAsync, clearAsync, emptyDB, type DB, type Song } from './data/repo';
import { isNative, nativeRecognize, syncNativeReminders } from './platform';
import { diagnose, weeklySummary, mapState } from './core/diagnosis';
import { LISTEN_ITEMS } from './data/content';
import { Placement, Tutor, Missions, Practice } from './Extras';
import { shouldNotify } from './core/extras';
import { SEED_WORDS, DICTATIONS, MINIMAL_PAIRS } from './data/content';
import { fetchYouTubeTranscript } from './core/transcription';
import { extractVocabularyFromTranscript, extractDictationLines, extractSpeakingLines, extractNotebookLines } from './core/extractor';
import { LEVELED_CATALOG, getUnlockedLevels, type LeveledSong } from './data/catalog';

type Tab = 'home' | 'library' | 'review' | 'progress' | 'settings' | 'lesson' | 'tutor' | 'missions' | 'practice';
const uid = () => crypto.randomUUID();
const today = () => dayKey(Date.now());
const STAGE_LABEL: Record<Stage, string> = { listening: 'Listening', confirm: 'Confirmar', reading: 'Reading', writing: 'Writing', speaking: 'Speaking', test: 'Test final', done: 'Resultado' };

function speak(text: string, accent: 'US' | 'UK', rate = 1) {
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  setTimeout(() => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      const targetLang = accent === 'US' ? 'en-US' : 'en-GB';
      u.lang = targetLang;
      // Normal = 1.0; Lento = 0.5 (la mitad de velocidad para diferenciar claramente lento vs normal)
      u.rate = rate < 0.8 ? 0.5 : 1.0;
      u.pitch = rate < 0.8 ? 0.9 : 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const matchingVoice =
          voices.find((v) => v.lang === targetLang) ||
          voices.find((v) => v.lang.replace('_', '-').startsWith('en')) ||
          voices[0];
        if (matchingVoice) u.voice = matchingVoice;
      }
      window.speechSynthesis.speak(u);
    } catch {
      // Ignorar si el sintetizador no está listo
    }
  }, 50);
  return true;
}

export function App() {
  const [db, setDb] = useState<DB>(emptyDB);
  const [ready, setReady] = useState(false);
  useEffect(() => { loadAsync().then((d) => { setDb(d); setReady(true); }); navigator.storage?.persist?.().catch(() => {}); }, []);
  const [tab, setTab] = useState<Tab>('home');
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => { if (ready) saveAsync(db); }, [db, ready]);
  useEffect(() => { document.documentElement.dataset.theme = db.settings.theme; }, [db.settings.theme]);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    addEventListener('online', on); addEventListener('offline', off);
    return () => { removeEventListener('online', on); removeEventListener('offline', off); };
  }, []);
  const update = (f: (d: DB) => DB) => setDb((d) => f(d));
  useEffect(() => {
    const tick = () => {
      const r = db.settings.reminders;
      const granted = r.granted && 'Notification' in window && Notification.permission === 'granted';
      if (shouldNotify({ daily: r.daily, time: r.time, days: r.days, timezone: db.settings.timezone, notificationsGranted: granted }, Date.now(), db.lastNotifiedDay)) {
        new Notification('Lingua Songs AI', { body: 'Es hora de tu práctica de inglés.' });
        setDb((d) => ({ ...d, lastNotifiedDay: new Intl.DateTimeFormat('en-CA', { timeZone: d.settings.timezone }).format(Date.now()) }));
      }
    };
    tick(); const t = setInterval(tick, 30000); return () => clearInterval(t);
  }, [db.settings, db.lastNotifiedDay]);
  const giveXp = (a: Activity) => update((d) => {
    const r = award(d.xp, a, today());
    return { ...d, xp: r.state, activeDays: d.activeDays.includes(today()) ? d.activeDays : [...d.activeDays, today()] };
  });
  const lesson = db.lessons.find((l) => l.id === lessonId) ?? null;
  const song = db.songs.find((s) => s.id === lesson?.songId);
  const setLesson = (l: Lesson) => update((d) => ({ ...d, lessons: d.lessons.map((x) => (x.id === l.id ? l : x)) }));
  const open = (id: string) => { setLessonId(id); setTab('lesson'); };

  if (!ready) return <main><p role="status">Cargando tus datos…</p></main>;
  return (
    <>
      {!online && <div className="banner" role="status">Sin conexión: el reproductor de YouTube no funciona, pero repaso, cuaderno y dictados guardados sí.</div>}
      <main>
        <h1>Lingua Songs AI</h1>
        {tab !== 'home' && tab !== 'lesson' && (
          <div style={{ marginBottom: 12 }}>
            <button className="s" onClick={() => setTab('home')}>⬅️ Volver al Inicio</button>
          </div>
        )}
        {tab === 'home' && <Home db={db} go={setTab} open={open} update={update} />}
        {tab === 'library' && <Library db={db} update={update} open={open} />}
        {tab === 'tutor' && <Tutor db={db} update={update} giveXp={giveXp} />}
        {tab === 'missions' && <Missions db={db} />}
        {tab === 'practice' && <Practice db={db} update={update} />}
        {tab === 'review' && <Review db={db} update={update} giveXp={giveXp} />}
        {tab === 'progress' && <Progress db={db} />}
        {tab === 'settings' && <Settings db={db} update={update} />}
        {tab === 'lesson' && lesson && song && (
          <LessonView
            key={lesson.id}
            db={db}
            lesson={lesson}
            song={song}
            setLesson={setLesson}
            update={update}
            giveXp={giveXp}
            online={online}
            exitToLibrary={() => setTab('library')}
          />
        )}
        {tab === 'lesson' && !lesson && <p>No hay lección activa. Ve a la biblioteca.</p>}
      </main>
      <nav aria-label="Navegación principal">
        {([['home', 'Inicio'], ['library', 'Canciones'], ['review', 'Repasar'], ['practice', 'Escribir'], ['tutor', 'Tutor'], ['missions', 'Misiones'], ['progress', 'Progreso'], ['settings', 'Ajustes']] as [Tab, string][]).map(([t, l]) => (
          <button key={t} aria-current={tab === t ? 'page' : undefined} onClick={() => setTab(t)}>{l}</button>
        ))}
      </nav>
    </>
  );
}

function Home({ db, go, open, update }: { db: DB; go: (t: Tab) => void; open: (id: string) => void; update: (f: (d: DB) => DB) => void }) {
  const due = dueCards(db.cards).length;
  const s = streak(db.activeDays, today());
  const active = db.lessons.filter((l) => l.stage !== 'done');
  const passed = db.assessments.filter((a) => a.passed).length;
  const unlocked = getUnlockedLevels(db.settings.level, passed);
  const [loadingSongId, setLoadingSongId] = useState<string | null>(null);

  let nextUnlockMsg = '';
  if (!unlocked.includes('A2')) {
    nextUnlockMsg = `🎯 Aprueba ${1 - passed} lección más para desbloquear canciones de nivel A2`;
  } else if (!unlocked.includes('B1')) {
    nextUnlockMsg = `🎯 Aprueba ${4 - passed} lección(es) más para desbloquear canciones de nivel B1`;
  } else if (!unlocked.includes('B2')) {
    nextUnlockMsg = `🎯 Aprueba ${8 - passed} lección(es) más para desbloquear canciones de nivel B2`;
  } else {
    nextUnlockMsg = '🏆 ¡Todos los niveles (A1, A2, B1, B2) están desbloqueados!';
  }

  function deleteLesson(lessonId: string, songId: string) {
    if (typeof window !== 'undefined' && window.confirm && !window.confirm('¿Deseas eliminar esta lección en curso de tu lista?')) {
      return;
    }
    update((d) => ({
      ...d,
      lessons: d.lessons.filter((x) => x.id !== lessonId),
      songs: d.songs.filter((s) => s.id !== songId),
      cards: d.cards.filter((c) => !c.id.startsWith(songId)),
    }));
  }

  async function handleStartCatalog(catSong: LeveledSong) {
    const existing = db.songs.find((s) => s.videoId === catSong.videoId);
    if (existing) {
      const existingLesson = db.lessons.find((l) => l.songId === existing.id);
      if (existingLesson) {
        open(existingLesson.id);
        return;
      }
    }

    setLoadingSongId(catSong.id);
    let tr = '';
    let src: Song['transcriptSource'] = 'none';
    try {
      const res = await fetchYouTubeTranscript(catSong.videoId);
      if (res.ok && res.transcript) {
        tr = res.transcript;
        src = 'youtube';
      }
    } catch {}
    setLoadingSongId(null);

    const songId = uid();
    const lessonId = uid();
    const newS: Song = {
      id: songId,
      title: catSong.title,
      artist: catSong.artist,
      videoId: catSong.videoId,
      url: catSong.url,
      level: catSong.level,
      accent: catSong.accent,
      transcript: tr,
      transcriptSource: src,
      createdAt: Date.now(),
    };
    const newL = newLesson(lessonId, songId);
    update((d) => ({
      ...d,
      songs: [...d.songs, newS],
      lessons: [...d.lessons, newL],
    }));
    open(lessonId);
  }

  const recommended = LEVELED_CATALOG.filter((c) => c.level === db.settings.level);

  return (
    <>
      {!db.placementDone && <Placement db={db} update={update} onDone={() => {}} />}
      <div className="card">
        <h2>Hola 👋</h2>
        <p>Aprende inglés con canciones de YouTube. Nivel orientativo: <b>{db.settings.level}</b> (no es una certificación oficial).</p>
        <p>XP: <b>{db.xp.total}</b> · Racha: <b>{s}</b> día(s) · Repasos pendientes: <b>{due}</b></p>
        <button className="p" onClick={() => go('library')}>Añadir canción</button>
        <button className="s" onClick={() => go('review')}>Repasar hoy</button>
      </div>

      {active.length > 0 && (
        <div className="card">
          <h2>Continuar</h2>
          <p className="mut" style={{ fontSize: '0.9rem', marginBottom: 12 }}>
            Tienes {active.length} lección(es) iniciada(s). Puedes retomarlas o eliminarlas de tu lista.
          </p>
          {active.map((l) => {
            const sg = db.songs.find((x) => x.id === l.songId);
            if (!sg) return null;
            return (
              <div
                key={l.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                  paddingBottom: 10,
                  borderBottom: '1px solid var(--bd)',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div>
                  <b>{sg.title}</b> — <span className="mut">{sg.artist}</span><br />
                  <span className="mut" style={{ fontSize: '0.85rem' }}>
                    Etapa: <b>{STAGE_LABEL[l.stage]}</b> · Nivel: {sg.level}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="s" onClick={() => open(l.id)}>Retomar</button>
                  <button
                    className="s"
                    onClick={() => deleteLesson(l.id, l.songId)}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 style={{ margin: 0 }}>🎵 Canciones recomendadas para tu nivel ({db.settings.level})</h2>
            <p className="mut" style={{ margin: '4px 0 0 0', fontSize: '0.88rem' }}>
              Seleccionadas pedagógicamente para tu ritmo auditivo y gramática.
            </p>
          </div>
          <span className="ok" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
            Niveles activos: {unlocked.join(', ')}
          </span>
        </div>

        <div style={{
          border: '1px solid var(--bd)',
          borderRadius: 8,
          padding: '10px 14px',
          margin: '12px 0 16px 0',
          fontSize: '0.9rem',
        }}>
          <b>{nextUnlockMsg}</b>
          <span className="mut" style={{ display: 'block', fontSize: '0.82rem', marginTop: 4 }}>
            Lecciones aprobadas acumuladas: <b>{passed}</b>. Cada lección completada suma a tu desbloqueo de niveles más avanzados.
          </span>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {recommended.map((cat) => {
            const isOngoing = active.some((l) => {
              const sg = db.songs.find((s) => s.id === l.songId);
              return sg?.videoId === cat.videoId;
            });
            const isLoading = loadingSongId === cat.id;

            return (
              <div
                key={cat.id}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid var(--bd)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
                  <div>
                    <b style={{ fontSize: '1.05rem' }}>{cat.title}</b> — <span className="mut">{cat.artist}</span>
                    <div style={{ margin: '4px 0' }}>
                      <b>Nivel {cat.level}</b> · <span className="mut">Acento: {cat.accent === 'US' ? 'Americano (US)' : 'Británico (UK)'}</span>
                    </div>
                  </div>
                  <button
                    className="p"
                    disabled={isLoading}
                    onClick={() => handleStartCatalog(cat)}
                  >
                    {isLoading ? '⏳ Preparando...' : (isOngoing ? '▶️ Continuar' : '🎧 Practicar')}
                  </button>
                </div>
                <p style={{ margin: '6px 0 4px 0', fontSize: '0.88rem' }}>
                  {cat.description}
                </p>
                <p className="mut" style={{ margin: 0, fontSize: '0.82rem' }}>
                  🎯 <b>Enfoque gramatical:</b> {cat.grammarFocus}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function Library({ db, update, open }: { db: DB; update: (f: (d: DB) => DB) => void; open: (id: string) => void }) {
  const [url, setUrl] = useState(''), [title, setTitle] = useState(''), [artist, setArtist] = useState(''), [tr, setTr] = useState('');
  const [err, setErr] = useState('');
  const [loadingTr, setLoadingTr] = useState(false);
  const [trNotice, setTrNotice] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'A1' | 'A2' | 'B1' | 'B2'>('ALL');
  const [loadingCatalogId, setLoadingCatalogId] = useState<string | null>(null);

  const passed = db.assessments.filter((a) => a.passed).length;
  const unlocked = getUnlockedLevels(db.settings.level, passed);

  function deleteSong(songId: string) {
    if (typeof window !== 'undefined' && window.confirm && !window.confirm('¿Seguro que deseas eliminar esta canción y su lección?')) {
      return;
    }
    update((d) => ({
      ...d,
      songs: d.songs.filter((s) => s.id !== songId),
      lessons: d.lessons.filter((l) => l.songId !== songId),
      cards: d.cards.filter((c) => !c.id.startsWith(songId)),
    }));
  }

  async function handleStartCatalog(catSong: LeveledSong) {
    const existing = db.songs.find((s) => s.videoId === catSong.videoId);
    if (existing) {
      const existingLesson = db.lessons.find((l) => l.songId === existing.id);
      if (existingLesson) {
        open(existingLesson.id);
        return;
      }
    }

    setLoadingCatalogId(catSong.id);
    let transcriptText = '';
    let src: Song['transcriptSource'] = 'none';
    try {
      const res = await fetchYouTubeTranscript(catSong.videoId);
      if (res.ok && res.transcript) {
        transcriptText = res.transcript;
        src = 'youtube';
      }
    } catch {}
    setLoadingCatalogId(null);

    const songId = uid();
    const lessonId = uid();
    const newS: Song = {
      id: songId,
      title: catSong.title,
      artist: catSong.artist,
      videoId: catSong.videoId,
      url: catSong.url,
      level: catSong.level,
      accent: catSong.accent,
      transcript: transcriptText,
      transcriptSource: src,
      createdAt: Date.now(),
    };
    const newL = newLesson(lessonId, songId);
    update((d) => ({
      ...d,
      songs: [...d.songs, newS],
      lessons: [...d.lessons, newL],
    }));
    open(lessonId);
  }

  async function extractAuto(providedUrl?: string) {
    const target = providedUrl ?? url;
    const id = parseYouTubeId(target);
    if (!id) return setErr('Primero introduce una URL válida de YouTube.');
    setLoadingTr(true);
    setErr('');
    setTrNotice('Extrayendo subtítulos de YouTube...');
    const res = await fetchYouTubeTranscript(id);
    setLoadingTr(false);
    if (res.ok && res.transcript) {
      setTr(res.transcript);
      setTrNotice(`✓ Subtítulos extraídos con éxito (${res.transcript.split('\n').length} versos).`);
      if (!title.trim()) setTitle(`Canción (${id})`);
    } else {
      setTrNotice(res.error || 'No se obtuvieron subtítulos automáticos. Puedes escribir o pegar la letra.');
    }
  }

  function loadSample(sampleUrl: string, sampleTitle: string, sampleArtist: string) {
    setUrl(sampleUrl);
    setTitle(sampleTitle);
    setArtist(sampleArtist);
    extractAuto(sampleUrl);
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    const id = parseYouTubeId(url);
    if (!id) return setErr('URL no compatible. Usa un enlace de youtube.com o youtu.be con un video válido.');
    if (!title.trim() || title.length > 120 || artist.length > 120) return setErr('Escribe un título (máx. 120 caracteres).');
    if (tr.length > 30000) return setErr('La transcripción es demasiado larga (máx. 30 000 caracteres).');
    const source = tr.trim() ? (trNotice.startsWith('✓') ? 'youtube' : 'user-provided') : 'none';
    const song: Song = { id: uid(), title: title.trim(), artist: artist.trim() || 'Artista', videoId: id, url: `https://www.youtube.com/watch?v=${id}`, level: db.settings.level, accent: db.settings.accent, transcript: tr.trim(), transcriptSource: source, createdAt: Date.now() };
    const l = newLesson(uid(), song.id);
    update((d) => ({ ...d, songs: [...d.songs, song], lessons: [...d.lessons, l] }));
    setErr(''); setUrl(''); setTitle(''); setArtist(''); setTr(''); setTrNotice(''); open(l.id);
  }

  const filteredCatalog = LEVELED_CATALOG.filter((c) => levelFilter === 'ALL' || c.level === levelFilter);

  return (
    <>
      <form className="card" onSubmit={add} noValidate>
        <h2>Añadir canción personalizada</h2>
        <div style={{ marginBottom: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className="mut" style={{ width: '100%' }}>Ejemplos listos para probar:</span>
          <button type="button" className="s" onClick={() => loadSample('https://www.youtube.com/watch?v=k4V3Mo61fJM', 'Fix You', 'Coldplay')}>🎵 Coldplay - Fix You</button>
          <button type="button" className="s" onClick={() => loadSample('https://www.youtube.com/watch?v=hLQl3WQQoQ0', 'Someone Like You', 'Adele')}>🎵 Adele - Someone Like You</button>
        </div>
        <label htmlFor="url">URL de YouTube</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <input style={{ flex: 1, minWidth: 220 }} id="url" value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" placeholder="https://www.youtube.com/watch?v=..." />
          <button type="button" className="s" onClick={() => extractAuto()} disabled={loadingTr}>
            {loadingTr ? '⏳ Extrayendo...' : '⚡ Extraer subtítulos'}
          </button>
        </div>
        {trNotice && <p className="ok" style={{ fontSize: '0.9rem', margin: '4px 0' }}>{trNotice}</p>}
        <label htmlFor="t">Título</label><input id="t" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label htmlFor="a">Artista</label><input id="a" value={artist} onChange={(e) => setArtist(e.target.value)} />
        <label htmlFor="tr">Transcripción / Letra de la canción</label>
        <p className="mut">Subtítulos obtenidos del video o letra pegada. El vocabulario de la lección se extraerá directamente de este texto.</p>
        <textarea id="tr" rows={6} value={tr} onChange={(e) => setTr(e.target.value)} placeholder="La letra aparecerá aquí o puedes pegarla manualmente..." />
        {err && <p role="alert" className="bad">{err}</p>}
        <div style={{ marginTop: 12 }}><button className="p" type="submit">Crear lección</button></div>
      </form>

      <h2>Mis canciones</h2>
      {db.songs.length === 0 && <p className="mut">Aún no hay canciones añadidas. Selecciona una del catálogo abajo o pega tu propia URL de YouTube.</p>}
      {db.songs.map((s) => {
        const l = db.lessons.find((x) => x.songId === s.id);
        const stageLabel = l ? STAGE_LABEL[l.stage] : 'Sin lección';
        return (
          <div className="card" key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <b>{s.title}</b> — {s.artist || 'Artista desconocido'}<br />
              <span className="mut" style={{ fontSize: '0.85rem' }}>
                Etapa: {stageLabel} · Nivel: {s.level} · Transcripción: {s.transcriptSource === 'none' ? 'sin texto' : (s.transcriptSource === 'youtube' ? 'extraída del video' : 'aportada por ti')}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {l && <button className="p" onClick={() => open(l.id)}>{l.stage === 'done' ? 'Ver' : 'Continuar'}</button>}
              <button
                className="s"
                onClick={() => deleteSong(s.id)}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        );
      })}

      <div className="card" style={{ marginTop: 24 }}>
        <h2>📚 Catálogo estructurado por nivel (A1–B2)</h2>
        <p className="mut" style={{ fontSize: '0.9rem', marginBottom: 12 }}>
          Canciones organizadas según el Marco Común Europeo (MCER). A medida que apruebes lecciones, se integrarán y desbloquearán automáticamente los siguientes niveles.
        </p>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {(['ALL', 'A1', 'A2', 'B1', 'B2'] as const).map((lv) => (
            <button
              key={lv}
              type="button"
              className={levelFilter === lv ? 'p' : 's'}
              style={{ padding: '4px 12px', fontSize: '0.85rem' }}
              onClick={() => setLevelFilter(lv)}
            >
              {lv === 'ALL' ? 'Todas' : lv}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {filteredCatalog.map((cat) => {
            const isUnlocked = unlocked.includes(cat.level);
            const isOngoing = db.songs.some((s) => s.videoId === cat.videoId);
            const isLoading = loadingCatalogId === cat.id;

            return (
              <div
                key={cat.id}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: isUnlocked ? '1px solid var(--bd)' : '1px dashed var(--bd)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
                  <div>
                    <b style={{ fontSize: '1.05rem' }}>{cat.title}</b> — <span className="mut">{cat.artist}</span>
                    <div style={{ margin: '4px 0' }}>
                      <b>Nivel {cat.level}</b> · <span className="mut">Acento: {cat.accent === 'US' ? 'Americano (US)' : 'Británico (UK)'}</span>
                    </div>
                  </div>
                  <div>
                    {isUnlocked ? (
                      <button
                        className="p"
                        disabled={isLoading}
                        onClick={() => handleStartCatalog(cat)}
                      >
                        {isLoading ? '⏳ Preparando...' : (isOngoing ? '▶️ Continuar' : '🎧 Practicar')}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        🔒 Bloqueado
                      </span>
                    )}
                  </div>
                </div>
                <p style={{ margin: '6px 0 4px 0', fontSize: '0.88rem' }}>
                  {cat.description}
                </p>
                <p className="mut" style={{ margin: 0, fontSize: '0.82rem' }}>
                  🎯 <b>Enfoque gramatical:</b> {cat.grammarFocus}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

const PREV_STAGE: Partial<Record<Stage, Stage>> = {
  confirm: 'listening',
  reading: 'listening',
  writing: 'reading',
  speaking: 'writing',
  test: 'speaking',
  done: 'test',
};

function LessonView(p: {
  db: DB;
  lesson: Lesson;
  song: Song;
  setLesson: (l: Lesson) => void;
  update: (f: (d: DB) => DB) => void;
  giveXp: (a: Activity) => void;
  online: boolean;
  exitToLibrary: () => void;
}) {
  const { lesson: l, song, exitToLibrary } = p;
  const steps: Stage[] = ['listening', 'confirm', 'reading', 'writing', 'speaking', 'test', 'done'];
  const prev = PREV_STAGE[l.stage];
  const go = (extra?: Partial<Lesson['completed']>) => { p.setLesson(advance(l)); void extra; };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <button className="s" onClick={exitToLibrary}>
          ⬅️ Volver a Canciones
        </button>
        {prev && (
          <button className="s" onClick={() => p.setLesson({ ...l, stage: prev })}>
            ⬅️ Etapa anterior ({STAGE_LABEL[prev]})
          </button>
        )}
      </div>

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
  const [loadingTr, setLoadingTr] = useState(false);
  const [editingTr, setEditingTr] = useState(false);
  const [customTr, setCustomTr] = useState(song.transcript || '');
  const [trError, setTrError] = useState('');
  const [savedNotice, setSavedNotice] = useState('');

  const mine = db.cards.filter((c) => c.id.startsWith(song.id));
  const addCard = (c: Omit<Card, 'id' | 'status' | 'intervalDays' | 'nextReviewAt' | 'correctSessions' | 'usedActively'>) => update((d) => ({ ...d, cards: [...d.cards, { ...c, id: `${song.id}:${uid()}`, status: 'new', intervalDays: 0, nextReviewAt: 0, correctSessions: [], usedActively: false }] }));

  async function extractNow() {
    setLoadingTr(true);
    setTrError('');
    const res = await fetchYouTubeTranscript(song.videoId);
    setLoadingTr(false);
    if (res.ok && res.transcript) {
      update((d) => ({
        ...d,
        songs: d.songs.map((s) => (s.id === song.id ? { ...s, transcript: res.transcript, transcriptSource: 'youtube' } : s)),
      }));
      setCustomTr(res.transcript);
    } else {
      setTrError(res.error || 'No se obtuvieron subtítulos automáticos. Puedes pegar o escribir la letra abajo.');
      setEditingTr(true);
    }
  }

  function saveCustom() {
    if (!customTr.trim()) return;
    update((d) => ({
      ...d,
      songs: d.songs.map((s) => (s.id === song.id ? { ...s, transcript: customTr.trim(), transcriptSource: 'user-provided' } : s)),
    }));
    setEditingTr(false);
  }

  // Vocabulario extraído genuinamente del texto del video (nunca inventado)
  const extractedWords = useMemo(
    () => (song.transcript ? extractVocabularyFromTranscript(song.transcript, 8) : []),
    [song.transcript]
  );

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <h3>Texto de la canción</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {!song.transcript && (
              <button className="p" onClick={extractNow} disabled={loadingTr}>
                {loadingTr ? '⏳ Extrayendo...' : '⚡ Extraer subtítulos de YouTube'}
              </button>
            )}
            <button className="s" onClick={() => setEditingTr(!editingTr)}>
              {editingTr ? 'Cerrar editor' : '✏️ ' + (song.transcript ? 'Editar letra' : 'Pegar letra')}
            </button>
          </div>
        </div>

        {trError && <p role="alert" className="bad" style={{ margin: '8px 0' }}>{trError}</p>}

        {editingTr ? (
          <div style={{ marginTop: 8 }}>
            <textarea rows={8} value={customTr} onChange={(e) => setCustomTr(e.target.value)} placeholder="Pega o escribe aquí la letra de la canción..." />
            <button className="p" onClick={saveCustom} disabled={!customTr.trim()} style={{ marginTop: 6 }}>Guardar letra y extraer vocabulario</button>
          </div>
        ) : song.transcript ? (
          <p style={{ whiteSpace: 'pre-wrap', maxHeight: 260, overflowY: 'auto', background: 'var(--card-bg)', padding: 12, borderRadius: 6, lineHeight: 1.5 }}>
            {song.transcript}
          </p>
        ) : (
          <p className="mut">
            No hay transcripción cargada aún. Pulsa <b>«⚡ Extraer subtítulos de YouTube»</b> para obtenerla automáticamente o <b>«✏️ Pegar letra»</b> para escribirla.
          </p>
        )}
      </div>

      <div className="card">
        <h3>Vocabulario sugerido (contenido original extraído del video)</h3>
        {extractedWords.length === 0 ? (
          <p className="mut">
            {song.transcript
              ? 'No se identificaron palabras clave suficientes en el texto de este video. Puedes añadir tus propias palabras abajo.'
              : 'Extrae o pega la transcripción arriba para extraer el vocabulario real del video.'}
          </p>
        ) : (
          extractedWords.map((w) => {
            const saved = mine.some((c) => c.term === w.term);
            return (
              <div key={w.term} style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <b>{w.term}</b> <span className="mut">{w.pronunciation}</span> — <b>{w.meaning}</b> <span className="mut">({w.partOfSpeech}, {w.level})</span><br />
                <i style={{ color: '#68d391' }}>«{w.example}»</i><br />
                <button className="s" onClick={() => speak(w.term, song.accent)}>🔊 Escuchar</button>
                <button className="s" disabled={saved} onClick={() => addCard({ ...w, origin: 'inferred' })}>
                  {saved ? '✓ Guardada' : 'Guardar tarjeta'}
                </button>
              </div>
            );
          })
        )}
      </div>

      <form
        className="card"
        onSubmit={(e) => {
          e.preventDefault();
          if (!manual.term.trim() || !manual.meaning.trim()) return;
          addCard({
            ...manual,
            term: manual.term.trim(),
            pronunciation: '',
            partOfSpeech: 'personalizada',
            level: song.level,
            origin: 'confirmed',
          });
          setSavedNotice(`✓ ¡Tarjeta guardada con éxito! «${manual.term.trim()}» se añadió a tu cuaderno y al sistema de repetición espaciada.`);
          setManual({ term: '', meaning: '', example: '', translation: '' });
          setTimeout(() => setSavedNotice(''), 5000);
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.4rem' }}>📝</span>
          <h3 style={{ margin: 0 }}>Añadir mi palabra (Tarjeta de estudio personalizada)</h3>
        </div>
        <p className="mut" style={{ marginTop: 6, marginBottom: 14, fontSize: '0.92rem', lineHeight: 1.5 }}>
          ¿Encontraste en la canción una palabra, expresión o contracción que no está en la lista de arriba?
          Complétala aquí para crear tu propia tarjeta de estudio. Se guardará con estado <b>«confirmada»</b> y
          se programará automáticamente en tus repasos diarios mediante <b>Repetición Espaciada (SRS)</b>.
        </p>

        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label htmlFor="mterm" style={{ fontWeight: 600 }}>Palabra en inglés *</label>
            <p className="mut" style={{ margin: '2px 0 6px 0', fontSize: '0.85rem' }}>
              La palabra, phrasal verb o expresión exacta que escuchaste o leíste en la canción.
            </p>
            <input
              id="mterm"
              value={manual.term}
              onChange={(e) => setManual({ ...manual, term: e.target.value })}
              placeholder="Ej: reverse, stuck, guide you home, mistakes..."
              required
            />
          </div>

          <div>
            <label htmlFor="mmeaning" style={{ fontWeight: 600 }}>Significado en español *</label>
            <p className="mut" style={{ margin: '2px 0 6px 0', fontSize: '0.85rem' }}>
              La traducción o definición de la palabra al español en este contexto.
            </p>
            <input
              id="mmeaning"
              value={manual.meaning}
              onChange={(e) => setManual({ ...manual, meaning: e.target.value })}
              placeholder="Ej: marcha atrás / retroceso, atrapado, guiar a casa..."
              required
            />
          </div>

          <div>
            <label htmlFor="mexample" style={{ fontWeight: 600 }}>Ejemplo (verso de la canción)</label>
            <p className="mut" style={{ margin: '2px 0 6px 0', fontSize: '0.85rem' }}>
              El verso completo en inglés donde escuchaste la palabra (para memorizarla siempre con contexto).
            </p>
            <input
              id="mexample"
              value={manual.example}
              onChange={(e) => setManual({ ...manual, example: e.target.value })}
              placeholder="Ej: Stuck in reverse"
            />
          </div>

          <div>
            <label htmlFor="mtranslation" style={{ fontWeight: 600 }}>Traducción del ejemplo</label>
            <p className="mut" style={{ margin: '2px 0 6px 0', fontSize: '0.85rem' }}>
              La traducción al español de ese verso u oración de ejemplo.
            </p>
            <input
              id="mtranslation"
              value={manual.translation}
              onChange={(e) => setManual({ ...manual, translation: e.target.value })}
              placeholder="Ej: Atrapado en marcha atrás"
            />
          </div>
        </div>

        {savedNotice && (
          <p style={{ color: '#48bb78', fontWeight: 600, marginTop: 12, fontSize: '0.92rem' }}>
            {savedNotice}
          </p>
        )}

        <div style={{ marginTop: 14 }}>
          <button className="p" type="submit" disabled={!manual.term.trim() || !manual.meaning.trim()}>
            💾 Guardar tarjeta en mi cuaderno
          </button>
        </div>
      </form>
      <button className="p" onClick={done}>Continuar a Writing</button>
    </>
  );
}

function Writing({ song, db, update, done }: { song: Song; db: DB; update: (f: (d: DB) => DB) => void; lesson: Lesson; done: () => void }) {
  const songDictations = useMemo(
    () => extractDictationLines(song.transcript, DICTATIONS),
    [song.transcript]
  );
  const notebookLines = useMemo(
    () => extractNotebookLines(song.transcript, 10),
    [song.transcript]
  );
  const [copiedLines, setCopiedLines] = useState<Record<number, boolean>>({});
  const [dictIndex, setDictIndex] = useState(0);
  const dict = songDictations[dictIndex % songDictations.length] || DICTATIONS[0];
  const [ans, setAns] = useState('');
  const [res, setRes] = useState<ReturnType<typeof compareText> | null>(null);
  const cards = db.cards.filter((c) => c.id.startsWith(song.id));
  const copiedCount = Object.values(copiedLines).filter(Boolean).length;

  function nextSentence() {
    setDictIndex((i) => i + 1);
    setAns('');
    setRes(null);
  }

  function check() {
    const r = compareText(dict, ans);
    setRes(r);
    update((d) => ({
      ...d,
      events: [...d.events, { type: 'dictations', at: Date.now() }],
      writingAttempts: [
        ...d.writingAttempts,
        { at: Date.now(), type: 'dictation', prompt: dict, response: ans, accuracy: r.accuracy },
      ],
    }));
  }

  function copyAllToClipboard() {
    const text = `--- ${song.title} (${song.artist}) ---\n\n` + notebookLines.map((l, i) => `${i + 1}. ${l}`).join('\n');
    navigator.clipboard?.writeText(text);
    alert('Texto copiado al portapapeles.');
  }

  return (
    <>
      {/* 1. SECCIÓN PRINCIPAL: TEXTO LEGIBLE PARA COPIAR EN CUADERNO FÍSICO */}
      <div className="card" style={{ borderLeft: '4px solid #3182ce' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <h3 style={{ margin: 0 }}>📖 Texto para copiar en tu cuaderno de notas</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className="s noprint" onClick={copyAllToClipboard}>📋 Copiar texto</button>
            <button type="button" className="s noprint" onClick={() => window.print()}>🖨️ Imprimir</button>
          </div>
        </div>

        <p className="mut" style={{ marginTop: 8, fontSize: '0.92rem', lineHeight: 1.5 }}>
          <b>Consejo de aprendizaje:</b> Escribir a mano en papel fija las contracciones (<i>don't, can't, you'll</i>) y la ortografía en tu memoria motriz.
          Toma tu lápiz o bolígrafo, transcribe estos versos en tu cuaderno físico y marca cada línea a medida que la completes:
        </p>

        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '12px 16px',
          margin: '12px 0',
        }}>
          {notebookLines.map((line, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: idx < notebookLines.length - 1 ? '1px dashed rgba(255,255,255,0.1)' : 'none',
                gap: 12,
              }}
            >
              <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ color: '#718096', fontSize: '0.85rem', minWidth: 24, userSelect: 'none' }}>
                  {String(idx + 1).padStart(2, '0')}.
                </span>
                <span style={{
                  fontSize: '1.08rem',
                  letterSpacing: '0.3px',
                  color: copiedLines[idx] ? '#a0aec0' : '#fff',
                  textDecoration: copiedLines[idx] ? 'line-through' : 'none',
                }}>
                  {line}
                </span>
                <button
                  type="button"
                  className="s"
                  style={{ padding: '2px 6px', fontSize: '0.75rem', marginLeft: 6 }}
                  onClick={() => speak(line, song.accent)}
                  title="Escuchar pronunciación de este verso"
                >
                  🔊
                </button>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={!!copiedLines[idx]}
                  onChange={(e) => setCopiedLines({ ...copiedLines, [idx]: e.target.checked })}
                />
                <span style={{ color: copiedLines[idx] ? '#48bb78' : '#a0aec0' }}>
                  {copiedLines[idx] ? '✓ Escrito' : 'Por escribir'}
                </span>
              </label>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span className="mut" style={{ fontSize: '0.9rem' }}>
            Progreso en cuaderno: <b>{copiedCount} de {notebookLines.length} versos</b>
          </span>
          {copiedCount === notebookLines.length && notebookLines.length > 0 && (
            <span className="ok" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              🎉 ¡Excelente! Transcribiste todos los versos a mano en tu cuaderno.
            </span>
          )}
        </div>
      </div>

      {/* 2. EJERCICIO INTERACTIVO DE DICTADO */}
      <div className="card">
        <h3>✍️ Dictado (escucha y escribe en la app)</h3>
        <p className="mut" style={{ margin: '4px 0 10px 0', fontSize: '0.9rem' }}>
          Pon a prueba tu oído: reproduce el audio y escribe exactamente lo que escuches sin mirar el texto.
        </p>

        {songDictations.length > 1 && (
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="mut">Frase { (dictIndex % songDictations.length) + 1 } de {songDictations.length}</span>
            <button className="s" onClick={nextSentence}>Siguiente frase ⏭️</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className="s" onClick={() => speak(dict, song.accent)}>🔊 Normal (1.0x)</button>
          <button className="s" onClick={() => speak(dict, song.accent, 0.5)}>🐢 Lento (0.5x)</button>
        </div>

        <label htmlFor="dict" style={{ fontWeight: 600 }}>Escribe lo que oyes:</label>
        <textarea
          id="dict"
          rows={2}
          value={ans}
          onChange={(e) => setAns(e.target.value)}
          placeholder="Escribe aquí en inglés..."
        />
        <div style={{ marginTop: 8 }}>
          <button className="p" onClick={check} disabled={!ans.trim()}>Comparar con la canción</button>
        </div>

        {res && (
          <div role="status" style={{ marginTop: 12 }}>
            <p>Precisión ortográfica: <b>{Math.round(res.accuracy * 100)}%</b></p>
            <p style={{ fontSize: '1.05rem', margin: '8px 0' }}>
              {res.items.map((it, i) => (
                <mark key={i} className={it.kind === 'correct' ? 'g' : 'e'}>
                  {it.actual ?? `[${it.expected}]`}{' '}
                </mark>
              ))}
            </p>
            <p className="mut">Texto original de la canción: <i>«{dict}»</i></p>
            <ul>
              {res.items.filter((i) => i.tip).map((i, k) => <li key={k}>{i.tip}</li>)}
              {res.punctuationNotes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* 3. VOCABULARIO GUARDADO */}
      <div className="card">
        <h3>Vocabulario guardado de esta canción</h3>
        {cards.length === 0 ? (
          <p className="mut">Aún no has guardado tarjetas de esta canción. Guarda palabras en la etapa de Reading para verlas aquí.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Palabra</th><th>Significado</th><th>Ejemplo</th></tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.id}>
                  <td><b>{c.term}</b><br /><span className="mut">{c.pronunciation}</span></td>
                  <td>{c.meaning}</td>
                  <td><i>{c.example}</i><br /><span className="mut">{c.translation}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button className="s noprint" onClick={() => download('vocabulario.json', JSON.stringify(cards, null, 2), 'application/json')}>Exportar JSON</button>
          <button className="s noprint" onClick={() => download('vocabulario.csv', toCsv(cards), 'text/csv')}>Exportar CSV</button>
        </div>
      </div>

      <button className="p" onClick={done}>Continuar a Speaking</button>
    </>
  );
}

const csvCell = (s: string) => `"${String(s).replace(/"/g, '""').replace(/^([=+\-@])/, "'$1")}"`;
const toCsv = (c: Card[]) => ['term,meaning,pronunciation,example,translation', ...c.map((x) => [x.term, x.meaning, x.pronunciation, x.example, x.translation].map(csvCell).join(','))].join('\n');
function download(name: string, text: string, type: string) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); }

function Speaking({ song, update, done }: { song: Song; update: (f: (d: DB) => DB) => void; lesson: Lesson; done: () => void; db: DB }) {
  const songPhrases = useMemo(
    () => extractSpeakingLines(song.transcript, ['I would like a cup of tea, please.']),
    [song.transcript]
  );
  const [phraseIndex, setPhraseIndex] = useState(0);
  const target = songPhrases[phraseIndex % songPhrases.length] || 'I would like a cup of tea, please.';

  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const [rec, setRec] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selfScore, setSelfScore] = useState<number | null>(null);
  const mr = useRef<MediaRecorder | null>(null);

  function nextPhrase() {
    setPhraseIndex((i) => i + 1);
    setRec(null);
    setMsg('');
    setSelfScore(null);
  }

  async function record() {
    if (!navigator.mediaDevices?.getUserMedia || !('MediaRecorder' in window)) {
      return setMsg('Tu navegador no permite grabar audio.');
    }
    try {
      setMsg('Iniciando micrófono...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const m = new MediaRecorder(stream);
      mr.current = m;
      m.ondataavailable = (e) => chunks.push(e.data);
      m.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setAudioUrl(URL.createObjectURL(new Blob(chunks)));
        setIsRecording(false);
        setMsg('✓ Grabación guardada en tu dispositivo. Escúchala abajo y compárala con el original.');
      };
      m.start();
      setIsRecording(true);
      setMsg('🎙️ Grabando... Habla ahora con claridad y pulsa «Detener grabación».');
      setTimeout(() => {
        if (m.state === 'recording') m.stop();
      }, 15000);
    } catch {
      setIsRecording(false);
      setMsg('Permiso de micrófono no concedido. Habilita el acceso al micrófono en el navegador.');
    }
  }

  function stopRecording() {
    if (mr.current && mr.current.state === 'recording') {
      mr.current.stop();
    }
  }

  async function recognize() {
    if (isNative()) {
      try {
        const text = await nativeRecognize(song.accent === 'US' ? 'en-US' : 'en-GB');
        if (!text) return setMsg('Este dispositivo no tiene reconocimiento de voz disponible. Usa el botón «🎙️ Grabar mi voz» para comparar al oído.');
        setRec(text);
        update((d) => ({
          ...d,
          speakingAttempts: [...d.speakingAttempts, { at: Date.now(), reference: target, recognized: text, status: 'recognized' }],
        }));
      } catch {
        setMsg('Permiso de voz denegado o reconocimiento no disponible en el dispositivo.');
      }
      return;
    }

    if (!SR) {
      return setMsg('Tu navegador no cuenta con el motor de reconocimiento en línea. Usa «🎙️ Grabar mi voz» abajo para grabarte y escucharte.');
    }

    // Pedir permiso explícito al micrófono primero para evitar error de permiso silencioso
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        testStream.getTracks().forEach((t) => t.stop());
      }
    } catch {
      return setMsg('Permiso de micrófono no concedido. Permite el acceso al micrófono en el navegador (candado en la barra superior).');
    }

    try {
      const r = new SR();
      r.lang = song.accent === 'US' ? 'en-US' : 'en-GB';
      r.interimResults = false;
      r.maxAlternatives = 1;
      setIsListening(true);
      setMsg('🎙️ Escuchando... Di la frase en inglés ahora.');

      r.onresult = (e: any) => {
        setIsListening(false);
        const t = e.results[0][0].transcript as string;
        setRec(t);
        setMsg('✓ Reconocimiento completado con éxito.');
        update((d) => ({
          ...d,
          speakingAttempts: [...d.speakingAttempts, { at: Date.now(), reference: target, recognized: t, status: 'recognized' }],
        }));
      };

      r.onerror = (e: any) => {
        setIsListening(false);
        const code = e.error;
        if (code === 'network') {
          setMsg('El servidor de reconocimiento en la nube de Google no respondió en esta conexión. ¡No te preocupes! Usa la opción «🎙️ Grabar mi voz» para grabarte y autoevaluar tu pronunciación al oído.');
        } else if (code === 'not-allowed') {
          setMsg('Acceso al micrófono denegado en el navegador. Haz clic en el candado de la URL para permitirlo.');
        } else if (code === 'no-speech') {
          setMsg('No se detectó voz. Vuelve a pulsar Reconocer voz y habla cerca del micrófono.');
        } else {
          setMsg(`Aviso: (${code}). Puedes grabarte localmente con el botón de abajo.`);
        }
      };

      r.onend = () => {
        setIsListening(false);
      };

      r.start();
    } catch {
      setIsListening(false);
      setMsg('No se pudo iniciar el reconocedor de voz. Usa «🎙️ Grabar mi voz» abajo.');
    }
  }

  function ratePronunciation(stars: number) {
    setSelfScore(stars);
    setMsg(`✓ Calificación de pronunciación registrada: ${stars}/5 estrellas.`);
    update((d) => ({
      ...d,
      speakingAttempts: [
        ...d.speakingAttempts,
        {
          at: Date.now(),
          reference: target,
          recognized: `[Autoevaluación: ${stars}/5 estrellas]`,
          status: 'recognized',
        },
      ],
    }));
  }

  const cmp = rec ? compareText(target, rec) : null;

  return (
    <>
      <div className="card">
        <h3>Escuchar, repetir y comparar (frase del video)</h3>
        {songPhrases.length > 1 && (
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="mut">Frase { (phraseIndex % songPhrases.length) + 1 } de {songPhrases.length}:</span>
            <button className="s" onClick={nextPhrase}>Siguiente frase ⏭️</button>
          </div>
        )}

        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '16px',
          borderRadius: 8,
          margin: '12px 0',
          borderLeft: '4px solid #48bb78',
        }}>
          <span className="mut" style={{ fontSize: '0.85rem' }}>Frase objetivo:</span>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: '6px 0 12px 0' }}>{target}</p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="s" onClick={() => speak(target, song.accent)}>🔊 Normal (1.0x)</button>
            <button className="s" onClick={() => speak(target, song.accent, 0.5)}>🐢 Lento (0.5x)</button>
          </div>
        </div>

        <h4>Práctica oral</h4>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <button className="p" onClick={recognize} disabled={isListening}>
            {isListening ? '⏳ Escuchando...' : '🎤 Reconocer voz'}
          </button>
          {!isRecording ? (
            <button className="s" onClick={record}>🎙️ Grabar mi voz</button>
          ) : (
            <button className="p" onClick={stopRecording} style={{ background: '#e53e3e', borderColor: '#e53e3e' }}>
              ⏹️ Detener grabación
            </button>
          )}
        </div>

        {audioUrl && (
          <div style={{ margin: '14px 0', padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
            <p style={{ margin: '0 0 6px 0', fontWeight: 600 }}>Tu grabación:</p>
            <audio controls src={audioUrl} style={{ width: '100%', marginBottom: 8 }} />
            
            <p style={{ fontSize: '0.9rem', margin: '8px 0 4px 0' }}>
              ¿Cómo calificarías tu pronunciación comparada con el audio original?
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  className={selfScore === s ? 'p' : 's'}
                  style={{ minWidth: 40, padding: '4px 8px' }}
                  onClick={() => ratePronunciation(s)}
                >
                  {'⭐'.repeat(s)} ({s})
                </button>
              ))}
            </div>
          </div>
        )}

        {msg && <p role="status" style={{ color: msg.startsWith('✓') ? '#48bb78' : '#ed8936', margin: '8px 0' }}>{msg}</p>}

        {cmp && (
          <div role="status" style={{ marginTop: 12, padding: 10, background: 'rgba(0,0,0,0.2)', borderRadius: 6 }}>
            <p>Reconocido: «<b>{rec}</b>»</p>
            <p>Coincidencia de texto: <b>{Math.round(cmp.accuracy * 100)}%</b></p>
          </div>
        )}

        <p className="mut" style={{ fontSize: '0.85rem', marginTop: 14 }}>
          Nota técnica: La grabación de audio se procesa 100% en tu dispositivo y nunca se envía a servidores externos.
        </p>
      </div>

      <div className="card">
        <h3>Pares mínimos</h3>
        <p className="mut" style={{ fontSize: '0.88rem' }}>Distingue sonidos cercanos en inglés:</p>
        {MINIMAL_PAIRS.map(([a, b]) => (
          <p key={a} style={{ margin: '8px 0' }}>
            <b>{a}</b> / <b>{b}</b>{' '}
            <button className="s" onClick={() => speak(a, song.accent)}>🔊 {a}</button>{' '}
            <button className="s" onClick={() => speak(b, song.accent)}>🔊 {b}</button>
          </p>
        ))}
      </div>

      <button className="p" onClick={done}>Ir al test final</button>
    </>
  );
}

function FinalTest({ db, lesson: l, song, update, giveXp, done }: { db: DB; lesson: Lesson; song: Song; update: (f: (d: DB) => DB) => void; giveXp: (a: Activity) => void; done: () => void }) {
  const cards = db.cards.filter((c) => c.id.startsWith(song.id));
  const pool = cards.length >= 2 ? cards : SEED_WORDS.map((w) => ({ ...w, id: w.term }) as unknown as Card);
  const qs = useMemo(() => pool.slice(0, 5).map((c) => ({ c, opts: [...pool].sort(() => Math.random() - 0.5).slice(0, 3).map((x) => x.meaning).concat(c.meaning).filter((v, i, a) => a.indexOf(v) === i).sort(() => Math.random() - 0.5) })), []);
  const [ans, setAns] = useState<Record<number, string>>({}); const [fill, setFill] = useState('');
  const [lAns, setLAns] = useState<Record<number, string>>({}); const [noAudio, setNoAudio] = useState(!('speechSynthesis' in window));
  const lItems = useMemo(() => LISTEN_ITEMS.slice(0, 4), []);
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
    const listening = noAudio ? null : Math.round((lItems.filter((it, i) => lAns[i] === it.say).length / lItems.length) * 25);
    const r = evaluate({ listening, reading, writing, speaking }, { threshold: db.settings.threshold, minPerSkill: db.settings.minPerSkill });
    setRes(r); giveXp('test');
    update((d) => ({ ...d, assessments: [...d.assessments, { lessonId: l.id, at: Date.now(), scores: { ...r.perSkill }, total: r.total, passed: r.passed }] }));
  }
  return (
    <div className="card"><h3>Test final</h3>
      {qs.map((q, i) => <fieldset key={i}><legend>¿Qué significa «{q.c.term}»? <button className="s" onClick={() => speak(q.c.term, song.accent)}>🔊</button></legend>
        {q.opts.map((o) => <label key={o} style={{ display: 'block', fontWeight: 400 }}><input type="radio" style={{ width: 'auto' }} name={'q' + i} checked={ans[i] === o} onChange={() => setAns({ ...ans, [i]: o })} /> {o}</label>)}</fieldset>)}
      <h4>Listening: ¿qué oyes?</h4>
      <p className="mut">Frases originales leídas por la voz de tu dispositivo (no son letras de canciones). Escucha y elige lo que oyes.</p>
      <label><input type="checkbox" style={{ width: 'auto' }} checked={noAudio} onChange={(e) => setNoAudio(e.target.checked)} /> No puedo reproducir audio ahora (Listening quedará pendiente)</label>
      {!noAudio && lItems.map((it, i) => <fieldset key={i}><legend>Frase {i + 1} <button className="s" onClick={() => speak(it.say, song.accent)}>🔊 Escuchar</button> <button className="s" onClick={() => speak(it.say, song.accent, 0.6)}>🐢</button></legend>
        {it.options.map((o) => <label key={o} style={{ display: 'block', fontWeight: 400 }}><input type="radio" style={{ width: 'auto' }} name={'l' + i} checked={lAns[i] === o} onChange={() => setLAns({ ...lAns, [i]: o })} /> {o}</label>)}</fieldset>)}
      <label htmlFor="fill">Escribe en inglés: «{qs[0].c.meaning}»</label><input id="fill" value={fill} onChange={(e) => setFill(e.target.value)} />
      <button className="p" onClick={submit}>Calificar</button>
      {res && <div role="status"><h4>Total: {res.total}/{res.maxPossible} {res.passed ? '✅ Aprobado' : '— Pendiente de dominio'}</h4>
        <ul><li>Listening: {res.perSkill.listening === null ? 'pendiente (sin audio disponible, no se inventa puntuación)' : res.perSkill.listening + '/25'}</li><li>Reading: {res.perSkill.reading}/25</li><li>Writing: {res.perSkill.writing}/25</li>
          <li>Speaking: {res.perSkill.speaking === null ? 'pendiente (sin reconocimiento de voz, no se inventa puntuación)' : res.perSkill.speaking + '/25'}</li></ul>
        <p>Prioridades de mejora: {res.priorities.join(', ')}</p>
        <p className="mut">Respuestas correctas: {qs.map((q) => `${q.c.term} = ${q.c.meaning}`).join(' · ')} · Listening: {lItems.map((it) => it.say).join(' / ')}</p>
        {!res.passed && <p>Puedes repetir el test, revisar errores o avanzar igualmente (la lección queda pendiente de dominio).</p>}
        <button className="s" onClick={() => { setRes(null); setAns({}); setFill(''); }}>Repetir prueba</button>
        {l.stage === 'test' && <button className="p" onClick={() => { update((d) => ({ ...d, events: [...d.events, { type: 'lessons', at: Date.now() }] })); done(); }}>Finalizar lección</button>}</div>}
      {hist.length > 0 && <p className="mut">Intentos previos: {hist.map((h) => h.total).join(', ')}</p>}
    </div>
  );
}

function Review({ db, update, giveXp }: { db: DB; update: (f: (d: DB) => DB) => void; giveXp: (a: Activity) => void }) {
  const due = dueCards(db.cards); const [shown, setShown] = useState(false); const [typed, setTyped] = useState('');
  const c = due[0];
  if (!c) return <p className="card">🎉 No tienes repasos pendientes hoy. {db.cards.length === 0 && 'Guarda tarjetas desde Reading.'}</p>;
  const answer = (ok: boolean, active = false) => { update((d) => ({ ...d, events: [...d.events, { type: 'reviews', at: Date.now() }], cards: d.cards.map((x) => (x.id === c.id ? review(x, ok, Date.now(), active) : x)) })); giveXp('review'); setShown(false); setTyped(''); };
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
  const passed = db.assessments.filter((a) => a.passed).length;
  const map = mapState(passed);
  const dg = diagnose(db); const wk = weeklySummary(db);
  const last = db.assessments.slice(-3).reverse();
  const counts = db.cards.reduce<Record<string, number>>((m, c) => ({ ...m, [c.status]: (m[c.status] ?? 0) + 1 }), {});
  const skills = ['reading', 'writing', 'listening', 'speaking'].map((k) => { const v = db.assessments.map((a) => a.scores[k]).filter((x): x is number => typeof x === 'number'); return [k, v.length ? Math.round((v.reduce((s, x) => s + x, 0) / v.length / 25) * 100) : null] as const; });
  const badges = [
    ['Primera canción completada', db.lessons.some((l) => l.stage === 'done')],
    ['Siete días de práctica', streak(db.activeDays, today()) >= 7],
    ['Diez dictados completados', db.writingAttempts.filter((a) => a.type === 'dictation').length >= 10],
    ['Cinco lecciones aprobadas', passed >= 5],
    ['Cien palabras aprendidas', db.cards.filter((c) => c.status === 'mastered').length >= 100],
    ['Primera conversación completa', db.events.some((e) => e.type === 'conversations')],
  ] as [string, boolean][];
  return (
    <>
      <div className="card"><h2>Mapa A1 → B2 (orientativo)</h2>
        {map.map((lv) => <div key={lv.level}><h3>{lv.level}</h3><ul>{lv.units.map((u) => <li key={u.name}>{u.done ? '✅' : '🔒'} {u.name}{!u.done && <span className="mut"> — te faltan {u.missing} lección(es) aprobada(s) (≥ {db.settings.threshold}) para desbloquearla</span>}</li>)}</ul></div>)}
        <p className="mut">Lecciones aprobadas: {passed}. Los niveles son orientativos, no certificaciones.</p></div>
      <div className="card"><h2>Competencias (promedio de tests)</h2>
        {skills.map(([k, v]) => <div key={k}>{k}: {v === null ? 'sin datos' : v + '%'}<div className="bar" role="progressbar" aria-valuenow={v ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label={'Competencia ' + k}><i style={{ width: (v ?? 0) + '%' }} /></div></div>)}</div>
      <div className="card"><h2>XP y racha</h2><p>{db.xp.total} XP · racha {streak(db.activeDays, today())} día(s). El XP tiene tope diario por actividad. Si pierdes la racha, vuelve a empezar con cualquier actividad real.</p></div>
      <div className="card"><h2>Logros</h2><ul>{badges.map(([n, ok]) => <li key={n}>{ok ? '🏅' : '🔒'} {n}</li>)}</ul></div>
      <div className="card"><h2>Diagnóstico</h2>
        {dg.findings.length === 0 && <p className="mut">Aún no hay hallazgos con evidencia suficiente.</p>}
        {dg.findings.map((f) => <div key={f.title}><b>{f.title}</b><br />Evidencia: {f.evidence}<br />Ejercicio recomendado: {f.exercise}</div>)}
        {dg.insufficient.length > 0 && <p className="mut">Datos insuficientes para: {dg.insufficient.join('; ')}.</p>}
        {last.map((a) => <p key={a.at}>{new Date(a.at).toLocaleDateString()} — total {a.total}; {Object.entries(a.scores).map(([k, v]) => `${k}: ${v ?? 'pendiente'}`).join(', ')}</p>)}
        <p>Tarjetas: {Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' · ') || 'ninguna'}</p></div>
      <div className="card"><h2>Resumen semanal</h2>
        <p>Actividades en 7 días: {wk.events} · intentos de escritura: {wk.attempts}</p>
        {wk.comparison ? <p>Precisión media de escritura: {Math.round(wk.comparison.now * 100)}% (semana anterior: {Math.round(wk.comparison.before * 100)}%).</p> : <p className="mut">Sin mediciones comparables todavía (se necesitan ≥3 intentos en cada semana); no se calcula mejora.</p>}</div>
    </>
  );
}

function Settings({ db, update }: { db: DB; update: (f: (d: DB) => DB) => void }) {
  const s = db.settings; const set = (p: Partial<typeof s>) => update((d) => ({ ...d, settings: { ...d.settings, ...p } }));
  const [note, setNote] = useState('');
  const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  async function enableNotif(on: boolean) {
    const base = { time: s.reminders.time, days: s.reminders.days, timezone: s.timezone, deviceTz };
    if (!on) {
      if (isNative()) await syncNativeReminders({ ...base, daily: false, notificationsGranted: false }).catch(() => {});
      return set({ reminders: { ...s.reminders, daily: false } });
    }
    if (isNative()) {
      try {
        const r = await syncNativeReminders({ ...base, daily: true, notificationsGranted: true });
        if (r === 'denied') { set({ reminders: { ...s.reminders, daily: false, granted: false } }); return setNote('Permiso de notificaciones denegado: no se enviarán recordatorios.'); }
        set({ reminders: { ...s.reminders, daily: true, granted: true } });
        return setNote('Recordatorios programados en el sistema (Android puede retrasarlos por ahorro de batería).');
      } catch { return setNote('No se pudieron programar los recordatorios en este dispositivo.'); }
    }
    if (!('Notification' in window)) return setNote('Este navegador no admite notificaciones.');
    const p = await Notification.requestPermission();
    if (p !== 'granted') return setNote('Permiso denegado: no se enviarán recordatorios.');
    set({ reminders: { ...s.reminders, daily: true, granted: true } });
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
        <label htmlFor="tm">Hora</label><input id="tm" type="time" value={s.reminders.time} onChange={(e) => { set({ reminders: { ...s.reminders, time: e.target.value } }); if (isNative() && s.reminders.daily) syncNativeReminders({ time: e.target.value, days: s.reminders.days, timezone: s.timezone, deviceTz, daily: true, notificationsGranted: true }).catch(() => {}); }} />
        <fieldset><legend>Días</legend>{['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((n, i) => <label key={i} style={{ marginRight: 8 }}><input type="checkbox" style={{ width: 'auto' }} checked={s.reminders.days.includes(i)} onChange={(e) => set({ reminders: { ...s.reminders, days: e.target.checked ? [...s.reminders.days, i] : s.reminders.days.filter((x) => x !== i) } })} /> {n}</label>)}</fieldset>
        {note && <p role="status">{note}</p>}</div>
      <div className="card"><h2>Privacidad y datos</h2>
        <p>Todo se guarda en este dispositivo. Sin cuentas, sin anuncios, sin venta de datos. Las grabaciones no se almacenan.</p>
        <button className="s" onClick={() => download('lingua-datos.json', JSON.stringify(db, null, 2), 'application/json')}>Exportar mis datos</button>
        <button className="s" onClick={() => { if (confirm('¿Borrar todos los datos locales?')) { clearAsync().then(() => location.reload()); } }}>Borrar todos mis datos</button></div>
      <div className="card"><h2>Ayuda y limitaciones</h2><ul>
        <li>YouTube requiere conexión; la app no extrae audio, letras ni subtítulos.</li>
        <li>No hay evaluación fonética profesional; el reconocimiento de voz depende del navegador.</li>
        <li>Los niveles son orientativos, no certificaciones.</li>
        <li>Pendiente: tutor con IA, sincronización en la nube, app Android firmada.</li></ul></div>
    </>
  );
}
