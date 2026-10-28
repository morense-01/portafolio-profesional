/** Evaluación inicial, misiones y recordatorios (lógica pura). */
export interface PlacementQ { q: string; options: string[]; answer: number; level: 'A1' | 'A2' | 'B1' | 'B2' }
export const PLACEMENT: PlacementQ[] = [
  { q: 'Elle ___ étudiante à Montréal.', options: ['suis', 'est', 'sont'], answer: 1, level: 'A1' },
  { q: 'Je ___ un café chaque matin.', options: ['bois', 'boit', 'boire'], answer: 0, level: 'A1' },
  { q: 'Hier, nous ___ au parc du Mont-Royal.', options: ['allons', 'sommes allés', 'aller'], answer: 1, level: 'A2' },
  { q: 'Il y ___ deux ordinateurs dans la salle.', options: ['a', 'sont', 'ont'], answer: 0, level: 'A2' },
  { q: 'S’il neige demain, je ___ à la maison.', options: ['reste', 'resterai', 'resté'], answer: 1, level: 'B1' },
  { q: 'J’habite au Québec ___ deux ans.', options: ['pendant', 'depuis', 'pour'], answer: 1, level: 'B1' },
  { q: 'Le rapport ___ terminé avant vendredi.', options: ['doit être', 'doit été', 'doit étant'], answer: 0, level: 'B2' },
  { q: 'Si j’avais su, j’___ agi différemment.', options: ['aurais', 'avais', 'aurais été'], answer: 0, level: 'B2' },
];

/** Nivel = el más alto con al menos la mitad acertada y todos los anteriores aprobados. Estimación, no certificación. */
export function placementLevel(answers: number[]): 'A1' | 'A2' | 'B1' | 'B2' {
  let level: 'A1' | 'A2' | 'B1' | 'B2' = 'A1';
  for (const lv of ['A1', 'A2', 'B1', 'B2'] as const) {
    const qs = PLACEMENT.map((q, i) => ({ q, i })).filter((x) => x.q.level === lv);
    const ok = qs.filter((x) => answers[x.i] === x.q.answer).length;
    if (ok * 2 >= qs.length && ok > 0) level = lv; else break;
  }
  return level;
}

export interface Mission { id: string; title: string; target: number; metric: 'reviews' | 'dictations' | 'conversations' | 'lessons'; period: 'daily' | 'weekly' }
export const MISSIONS: Mission[] = [
  { id: 'd-review', title: 'Repasa 5 tarjetas', target: 5, metric: 'reviews', period: 'daily' },
  { id: 'd-dictation', title: 'Haz 1 dictado', target: 1, metric: 'dictations', period: 'daily' },
  { id: 'w-conv', title: 'Mantén 3 conversaciones con el tutor', target: 3, metric: 'conversations', period: 'weekly' },
  { id: 'w-lessons', title: 'Completa 2 lecciones', target: 2, metric: 'lessons', period: 'weekly' },
];
export interface EventLog { type: Mission['metric']; at: number }
export function missionProgress(m: Mission, events: EventLog[], now: number): number {
  const d = new Date(now); const start = m.period === 'daily' ? Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) : now - 7 * 86_400_000;
  return Math.min(m.target, events.filter((e) => e.type === m.metric && e.at >= start && e.at <= now).length);
}

export interface ReminderPrefs { daily: boolean; time: string; days: number[]; timezone: string; notificationsGranted: boolean }

/** Hora local (HH:MM y día de semana 0-6) en una zona horaria IANA. */
export function localParts(now: number, tz: string): { hhmm: string; dow: number } {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, hour: '2-digit', minute: '2-digit', weekday: 'short' }).formatToParts(now);
  const g = (t: string) => f.find((p) => p.type === t)!.value;
  return { hhmm: `${g('hour') === '24' ? '00' : g('hour')}:${g('minute')}`, dow: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')) };
}

/** ¿Toca avisar ahora? Respeta permisos, desactivación, día, hora y no repetir el mismo día. */
export function shouldNotify(p: ReminderPrefs, now: number, lastNotifiedDay: string | null): boolean {
  if (!p.daily || !p.notificationsGranted) return false;
  const { hhmm, dow } = localParts(now, p.timezone);
  if (!p.days.includes(dow) || hhmm < p.time) return false;
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: p.timezone }).format(now);
  return lastNotifiedDay !== day;
}

function tzOffsetMs(instant: number, tz: string): number {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(instant);
  const g = (t: string) => +f.find((p) => p.type === t)!.value;
  return Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') % 24, g('minute'), g('second')) - Math.floor(instant / 1000) * 1000;
}

/** Convierte «HH:MM en la zona elegida» a día/hora/minuto en la zona del dispositivo (para alarmas nativas semanales). */
export function deviceSchedule(time: string, days: number[], tz: string, deviceTz: string, now = Date.now()): { dow: number; hour: number; minute: number }[] {
  const [h, m] = time.split(':').map(Number);
  return days.map((day) => {
    for (let k = 0; k < 8; k++) {
      const d = new Date(now + k * 86_400_000);
      const wall = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h, m);
      const instant = wall - tzOffsetMs(wall, tz);
      if (localParts(instant, tz).dow === day) {
        const lp = localParts(instant, deviceTz); const [hh, mm] = lp.hhmm.split(':').map(Number);
        return { dow: lp.dow, hour: hh, minute: mm };
      }
    }
    return { dow: day, hour: h, minute: m };
  });
}
