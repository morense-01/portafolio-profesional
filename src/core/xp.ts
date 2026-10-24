/** XP con tope diario por tipo de actividad, para evitar farmeo por repetición. */
export const XP_TABLE = { listening: 20, reading: 20, writing: 20, speaking: 20, review: 5, test: 50, conversation: 15 } as const;
export const DAILY_CAP = { listening: 40, reading: 40, writing: 60, speaking: 60, review: 50, test: 100, conversation: 45 } as const;
export type Activity = keyof typeof XP_TABLE;
export interface XpState { total: number; byDay: Record<string, Partial<Record<Activity, number>>>; }

export function award(state: XpState, activity: Activity, day: string): { state: XpState; gained: number } {
  const used = state.byDay[day]?.[activity] ?? 0;
  const gained = Math.max(0, Math.min(XP_TABLE[activity], DAILY_CAP[activity] - used));
  if (!gained) return { state, gained: 0 };
  return {
    gained,
    state: { total: state.total + gained, byDay: { ...state.byDay, [day]: { ...state.byDay[day], [activity]: used + gained } } },
  };
}
export function streak(days: string[], today: string): number {
  const set = new Set(days); let n = 0; const d = new Date(today + 'T00:00:00Z');
  if (!set.has(today)) d.setUTCDate(d.getUTCDate() - 1); // hoy aún no cuenta como pérdida
  while (set.has(d.toISOString().slice(0, 10))) { n++; d.setUTCDate(d.getUTCDate() - 1); }
  return n;
}
