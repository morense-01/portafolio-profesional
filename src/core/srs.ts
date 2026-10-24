/** Repetición espaciada: intervalos 1, 3, 7 días, ajustados por respuestas. */
export type Mastery = 'new' | 'learning' | 'review' | 'mastered' | 'relearn';
export interface Card {
  id: string; term: string; meaning: string; example: string; translation: string;
  pronunciation: string; partOfSpeech: string; level: string;
  status: Mastery; intervalDays: number; nextReviewAt: number;
  correctSessions: string[]; // fechas (YYYY-MM-DD) distintas con acierto
  usedActively: boolean; origin: 'confirmed' | 'inferred' | 'verify';
}
const DAY = 86_400_000;
const STEPS = [1, 3, 7];
export const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10);

export function review(card: Card, correct: boolean, now = Date.now(), activeUse = false): Card {
  const c = { ...card, usedActively: card.usedActively || (correct && activeUse) };
  if (!correct) {
    c.status = 'relearn'; c.intervalDays = 1; c.correctSessions = [];
    c.nextReviewAt = now + DAY; return c;
  }
  const today = dayKey(now);
  if (!c.correctSessions.includes(today)) c.correctSessions = [...c.correctSessions, today];
  const idx = STEPS.indexOf(card.intervalDays);
  c.intervalDays = card.status === 'new' ? 1 : idx >= 0 && idx < STEPS.length - 1 ? STEPS[idx + 1]
    : Math.round(Math.max(7, card.intervalDays) * 2);
  // Dominada: >=3 sesiones distintas correctas y uso activo
  c.status = c.correctSessions.length >= 3 && c.usedActively ? 'mastered'
    : c.correctSessions.length >= 2 ? 'review' : 'learning';
  c.nextReviewAt = now + c.intervalDays * DAY;
  return c;
}
export const dueCards = (cards: Card[], now = Date.now()) =>
  cards.filter((c) => c.status === 'new' || c.nextReviewAt <= now);
