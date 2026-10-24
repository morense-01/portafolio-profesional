import type { Card } from '../core/srs';
import type { Lesson } from '../core/lesson';
import type { XpState } from '../core/xp';

export interface Song { id: string; title: string; artist: string; videoId: string; url: string; level: string; accent: 'US' | 'UK'; transcript: string; transcriptSource: 'user-provided' | 'none'; createdAt: number }
export interface Settings { level: string; accent: 'US' | 'UK'; threshold: number; minPerSkill: number; timezone: string; reminders: { daily: boolean; review: boolean; time: string }; theme: 'auto' | 'light' | 'dark' }
export interface DB {
  version: number; songs: Song[]; lessons: Lesson[]; cards: Card[]; xp: XpState; activeDays: string[];
  assessments: { lessonId: string; at: number; scores: Record<string, number | null>; total: number; passed: boolean }[];
  writingAttempts: { at: number; type: string; prompt: string; response: string; accuracy: number }[];
  speakingAttempts: { at: number; reference: string; recognized: string | null; status: 'recognized' | 'no-recognition' }[];
  settings: Settings;
}
export const SCHEMA_VERSION = 1;
export const emptyDB = (): DB => ({
  version: SCHEMA_VERSION, songs: [], lessons: [], cards: [], xp: { total: 0, byDay: {} }, activeDays: [],
  assessments: [], writingAttempts: [], speakingAttempts: [],
  settings: { level: 'A1', accent: 'US', threshold: 80, minPerSkill: 0, timezone: 'America/Santo_Domingo', reminders: { daily: false, review: false, time: '19:00' }, theme: 'auto' },
});
/** Migraciones: índice n migra de versión n a n+1. */
const MIGRATIONS: ((d: any) => any)[] = [];
export function migrate(raw: any): DB {
  if (!raw || typeof raw !== 'object') return emptyDB();
  let d = raw;
  for (let v = d.version ?? 0; v < SCHEMA_VERSION; v++) d = MIGRATIONS[v]?.(d) ?? d;
  return { ...emptyDB(), ...d, version: SCHEMA_VERSION };
}
const KEY = 'lingua-songs-db';
export interface Repo { load(): DB; save(db: DB): void; clear(): void }
export const localRepo: Repo = {
  load() { try { return migrate(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch { return emptyDB(); } },
  save(db) { localStorage.setItem(KEY, JSON.stringify(db)); },
  clear() { localStorage.removeItem(KEY); },
};
