/** Máquina de estados de la lección: Listening → confirmación → Reading → Writing → Speaking → Test. */
export type Stage = 'listening' | 'confirm' | 'reading' | 'writing' | 'speaking' | 'test' | 'done';
export const ORDER: Stage[] = ['listening', 'confirm', 'reading', 'writing', 'speaking', 'test', 'done'];
export interface Lesson {
  id: string; songId: string; stage: Stage; confirmedReading: boolean;
  listening: { seconds: number; replays: number; comprehension?: number; difficulty?: number; summary?: string };
  completed: Partial<Record<'listening' | 'reading' | 'writing' | 'speaking', boolean>>;
}
export const newLesson = (id: string, songId: string): Lesson =>
  ({ id, songId, stage: 'listening', confirmedReading: false, listening: { seconds: 0, replays: 0 }, completed: {} });

/** La transcripción solo es visible tras la confirmación manual. */
export const canShowTranscript = (l: Lesson) => l.confirmedReading && ORDER.indexOf(l.stage) >= ORDER.indexOf('reading');

export function advance(l: Lesson): Lesson {
  const i = ORDER.indexOf(l.stage);
  if (l.stage === 'listening') return { ...l, stage: 'confirm', completed: { ...l.completed, listening: true } };
  if (l.stage === 'confirm') return { ...l, stage: 'reading', confirmedReading: true };
  if (i >= ORDER.length - 1) return l;
  const skill = l.stage as 'reading' | 'writing' | 'speaking';
  return { ...l, stage: ORDER[i + 1], completed: { ...l.completed, ...(skill in l.completed || ['reading', 'writing', 'speaking'].includes(l.stage) ? { [skill]: true } : {}) } };
}
/** «Necesito repetir»: vuelve a Listening sin revelar texto. */
export const repeatListening = (l: Lesson): Lesson =>
  ({ ...l, stage: 'listening', listening: { ...l.listening, replays: l.listening.replays + 1 } });
