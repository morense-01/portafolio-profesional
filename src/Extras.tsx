import { useState } from 'react';
import { PLACEMENT, placementLevel, MISSIONS, missionProgress } from './core/extras';
import { localProvider, remoteProvider, type Correction, type Topic, type TutorProvider } from './core/tutor';
import { compareText } from './core/diff';
import type { DB } from './data/repo';

type Upd = (f: (d: DB) => DB) => void;

export function Placement({ db, update, onDone }: { db: DB; update: Upd; onDone: () => void }) {
  const [ans, setAns] = useState<number[]>([]);
  const [lvl, setLvl] = useState<string | null>(null);
  return (
    <div className="card"><h2>Evaluación inicial (opcional)</h2>
      <p className="mut">Estimación orientativa, no una certificación oficial. Puedes cambiar tu nivel en Ajustes.</p>
      {PLACEMENT.map((q, i) => (
        <fieldset key={i}><legend>{i + 1}. {q.q}</legend>
          {q.options.map((o, k) => <label key={o} style={{ display: 'block', fontWeight: 400 }}><input type="radio" style={{ width: 'auto' }} name={'p' + i} checked={ans[i] === k} onChange={() => { const a = [...ans]; a[i] = k; setAns(a); }} /> {o}</label>)}
        </fieldset>))}
      {lvl && <p role="status">Nivel estimado: <b>{lvl}</b></p>}
      <button className="p" onClick={() => { const l = placementLevel(ans); setLvl(l); update((d) => ({ ...d, placementDone: true, settings: { ...d.settings, level: l } })); }}>Ver resultado</button>
      <button className="s" onClick={() => { update((d) => ({ ...d, placementDone: true })); onDone(); }}>{lvl ? 'Continuar' : 'Omitir'}</button>
    </div>
  );
}

export function Tutor({ db, update, giveXp }: { db: DB; update: Upd; giveXp: (a: 'conversation') => void }) {
  const [topic, setTopic] = useState<Topic>('daily');
  const [useRemote, setUseRemote] = useState(false);
  const url = import.meta.env.VITE_AI_PROXY_URL as string | undefined;
  const remoteOk = !!url && !url.includes('example.invalid');
  const provider: TutorProvider = useRemote && remoteOk ? remoteProvider(url!) : localProvider;
  const [turn, setTurn] = useState(0);
  const [log, setLog] = useState<{ who: 'tutor' | 'you'; text: string; corr?: Correction | null }[]>([]);
  const [input, setInput] = useState(''); const [busy, setBusy] = useState(false);
  async function start() { setTurn(0); setLog([{ who: 'tutor', text: await provider.nextQuestion(topic, db.settings.level, 0) }]); }
  async function send() {
    const text = input.trim(); if (!text || text.length > 500) return; setBusy(true); setInput('');
    const corr = await provider.correct(text);
    const next = await provider.nextQuestion(topic, db.settings.level, turn + 1);
    setLog((l) => [...l, { who: 'you', text, corr }, { who: 'tutor', text: next }]); setTurn(turn + 1); setBusy(false);
    update((d) => ({ ...d, tutorErrors: corr ? { ...d.tutorErrors, [corr.rule]: (d.tutorErrors[corr.rule] ?? 0) + 1 } : d.tutorErrors, events: turn + 1 === 3 ? [...d.events, { type: 'conversations', at: Date.now() }] : d.events }));
    if (turn + 1 === 3) giveXp('conversation'); // una conversación completa = 3 respuestas
  }
  return (
    <div className="card"><h2>Tutor de conversación</h2>
      <p className="mut">Proveedor: {provider.name}. {remoteOk ? '' : 'La IA remota no está configurada; el tutor local funciona sin internet ni coste.'}</p>
      {remoteOk && <label><input type="checkbox" style={{ width: 'auto' }} checked={useRemote} onChange={(e) => setUseRemote(e.target.checked)} /> Usar IA remota (requiere cuenta externa y envía tu texto a tu proxy)</label>}
      <label htmlFor="tp">Tema</label>
      <select id="tp" value={topic} onChange={(e) => setTopic(e.target.value as Topic)}><option value="daily">Vida cotidiana</option><option value="work">Trabajo y entrevistas</option><option value="tech">Tecnología</option><option value="song">La canción</option></select>
      <button className="p" onClick={start}>Empezar</button>
      <div aria-live="polite">{log.map((m, i) => <div key={i} className="card"><b>{m.who === 'tutor' ? 'Tutor' : 'Tú'}:</b> {m.text}
        {m.corr && <p><span className="bad">Versión corregida:</span> <b>{m.corr.corrected}</b><br />{m.corr.explanation}<br /><span className="mut">Repite la versión corregida en voz alta o por escrito.</span></p>}
        {m.who === 'you' && m.corr === null && <p className="ok">Sin errores detectados por las reglas locales.</p>}</div>)}</div>
      {log.length > 0 && <><label htmlFor="ti">Tu respuesta (en francés)</label><textarea id="ti" rows={2} maxLength={500} value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="p" disabled={busy || !input.trim()} onClick={send}>Enviar</button></>}
      {Object.keys(db.tutorErrors).length > 0 && <p className="mut">Errores recurrentes: {Object.entries(db.tutorErrors).map(([k, v]) => `${k} ×${v}`).join(', ')}</p>}
    </div>
  );
}

export function Missions({ db }: { db: DB }) {
  const now = Date.now();
  return (
    <div className="card"><h2>Misiones</h2>
      {MISSIONS.map((m) => { const p = missionProgress(m, db.events, now); return <div key={m.id}><b>{m.period === 'daily' ? 'Diaria' : 'Semanal'}:</b> {m.title} — {p}/{m.target} {p >= m.target && '✅'}
        <div className="bar" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={m.target} aria-label={m.title}><i style={{ width: (p / m.target) * 100 + '%' }} /></div></div>; })}
    </div>
  );
}

/** Escritura guiada (3–5 frases propias) y recuperación de memoria. */
export function Practice({ db, update }: { db: DB; update: Upd }) {
  const cards = db.cards;
  const [sent, setSent] = useState(['', '', '']); const [fb, setFb] = useState<string[][] | null>(null);
  const [mi, setMi] = useState(0); const [mem, setMem] = useState(''); const [memRes, setMemRes] = useState<boolean | null>(null);
  if (cards.length === 0) return <div className="card"><h2>Práctica de escritura</h2><p className="mut">Guarda palabras en Reading para practicar aquí.</p></div>;
  const words = cards.map((c) => c.term.toLowerCase());
  function check() {
    const out = sent.map((s) => {
      const notes: string[] = [];
      if (!s.trim()) return ['(vacía)'];
      if (!words.some((w) => s.toLowerCase().includes(w))) notes.push('No usa ninguna palabra de tu vocabulario.');
      if (!/^[A-Z]/.test(s.trim())) notes.push('Empieza con mayúscula.');
      if (!/[.!?]$/.test(s.trim())) notes.push('Termina con puntuación.');
      if (s.trim().split(/\s+/).length < 4) notes.push('Muy corta: intenta al menos 4 palabras.');
      return notes.length ? notes : ['Sin observaciones de forma. La gramática profunda no se evalúa sin IA.'];
    });
    setFb(out);
    update((d) => ({ ...d, writingAttempts: [...d.writingAttempts, { at: Date.now(), type: 'guided', prompt: 'frases propias', response: sent.join(' | '), accuracy: out.filter((o) => o[0].startsWith('Sin')).length / out.length }] }));
  }
  const c = cards[mi % cards.length];
  return (
    <>
      <div className="card"><h2>Escritura guiada</h2>
        {sent.map((s, i) => <div key={i}><label htmlFor={'s' + i}>Frase {i + 1}</label><textarea id={'s' + i} rows={2} value={s} onChange={(e) => setSent(sent.map((x, k) => (k === i ? e.target.value : x)))} />{fb && <p className="mut">{fb[i].join(' ')}</p>}</div>)}
        {sent.length < 5 && <button className="s" onClick={() => setSent([...sent, ''])}>Añadir frase</button>}
        <button className="p" onClick={check}>Revisar</button></div>
      <div className="card"><h2>Recuperación de memoria</h2>
        <p>Significado: <b>{c.meaning}</b></p>
        <label htmlFor="mem">¿Cómo se dice en francés?</label><input id="mem" value={mem} onChange={(e) => setMem(e.target.value)} />
        <button className="p" onClick={() => { const ok = compareText(c.term, mem).accuracy >= 0.99; setMemRes(ok); update((d) => ({ ...d, writingAttempts: [...d.writingAttempts, { at: Date.now(), type: 'recall', prompt: c.meaning, response: mem, accuracy: ok ? 1 : 0 }] })); }}>Comprobar</button>
        {memRes !== null && <p role="status">{memRes ? <span className="ok">✔ Correcto</span> : <span className="bad">✘ Era «{c.term}»</span>} <button className="s" onClick={() => { setMi(mi + 1); setMem(''); setMemRes(null); }}>Siguiente</button></p>}</div>
    </>
  );
}
