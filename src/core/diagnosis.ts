/** Diagnóstico a partir de mediciones guardadas. Solo emite hallazgos con evidencia suficiente (>= MIN muestras). */
import type { DB } from '../data/repo';
export const MIN = 3;
export interface Finding { title: string; evidence: string; exercise: string }
const avg = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const pct = (x: number) => Math.round(x * 100) + '%';

export function diagnose(db: DB): { findings: Finding[]; insufficient: string[] } {
  const f: Finding[] = []; const insufficient: string[] = [];
  const by = (t: string) => db.writingAttempts.filter((a) => a.type === t).map((a) => a.accuracy);
  const dict = by('dictation'), recall = by('recall'), guided = by('guided');
  if (dict.length >= MIN && recall.length >= MIN) {
    const d = avg(dict), r = avg(recall);
    if (r - d >= 0.2) f.push({ title: 'Reconoces la palabra escrita, pero te cuesta cuando la escuchas', evidence: `Recuperación de memoria ${pct(r)} (${recall.length} intentos) vs dictado ${pct(d)} (${dict.length})`, exercise: 'Más dictados de palabras sueltas y pares mínimos en Speaking.' });
  } else insufficient.push('Escucha vs lectura (necesita ≥3 dictados y ≥3 recuperaciones)');
  if (dict.length >= MIN && avg(dict) < 0.6) f.push({ title: 'Dictado por debajo del 60%', evidence: `Promedio ${pct(avg(dict))} en ${dict.length} dictados`, exercise: 'Repite dictados cortos con velocidad lenta y revisa las diferencias marcadas.' });
  if (guided.length >= MIN && avg(guided) < 0.6) f.push({ title: 'Dificultad para construir frases', evidence: `Solo ${pct(avg(guided))} de tus frases guiadas sin observaciones (${guided.length} intentos)`, exercise: 'Escritura guiada con 3 frases de 4+ palabras usando vocabulario nuevo.' });
  const top = Object.entries(db.tutorErrors).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1])[0];
  if (top) f.push({ title: `Error recurrente en el tutor: ${top[0]}`, evidence: `${top[1]} veces registradas`, exercise: 'Conversa con el tutor y repite la versión corregida.' });
  const relearn = db.cards.filter((c) => c.status === 'relearn').length;
  if (db.cards.length >= 5 && relearn / db.cards.length >= 0.3) f.push({ title: 'Olvidas expresiones tras pocos días', evidence: `${relearn} de ${db.cards.length} tarjetas están pendientes de recuperación`, exercise: 'Repasa a diario; los intervalos se reinician tras cada fallo.' });
  const sp = db.speakingAttempts.filter((a) => a.status === 'recognized');
  if (sp.length === 0) insufficient.push('Speaking (sin intentos con reconocimiento de voz)');
  return { findings: f, insufficient };
}

/** Compara 7 días vs 7 días previos solo si ambos periodos tienen >= MIN dictados; no inventa porcentajes. */
export function weeklySummary(db: DB, now = Date.now()) {
  const W = 7 * 86_400_000;
  const a = db.writingAttempts.filter((x) => x.at > now - W && x.at <= now), b = db.writingAttempts.filter((x) => x.at > now - 2 * W && x.at <= now - W);
  const events = db.events.filter((e) => e.at > now - W).length;
  const comparable = a.length >= MIN && b.length >= MIN;
  return { events, attempts: a.length, comparison: comparable ? { now: avg(a.map((x) => x.accuracy)), before: avg(b.map((x) => x.accuracy)) } : null };
}

/** Mapa: 4 niveles × 3 unidades; cada unidad exige una lección aprobada más. */
export const MAP = [
  { level: 'A1', units: ['Saludos y presentaciones', 'Rutinas diarias', 'Comida y compras'] },
  { level: 'A2', units: ['Pasado simple y viajes', 'Trabajo básico', 'Tecnología cotidiana'] },
  { level: 'B1', units: ['Experiencias y planes', 'Entrevistas', 'Infraestructura y nube'] },
  { level: 'B2', units: ['Opiniones y debate', 'Ciberseguridad', 'IA en el trabajo'] },
];
export function mapState(passed: number) {
  return MAP.map((lv, li) => ({ level: lv.level, units: lv.units.map((name, ui) => { const need = li * 3 + ui + 1; return { name, done: passed >= need, need, missing: Math.max(0, need - passed) }; }) }));
}
