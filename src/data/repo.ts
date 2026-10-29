import { get, set, del } from 'idb-keyval';
import type { Card } from '../core/srs';
import type { Lesson } from '../core/lesson';
import type { XpState } from '../core/xp';
import { resolveWorkingVideoId } from './catalog';

export type Accent = 'CA' | 'QC' | 'AC';
export interface Song { id: string; title: string; artist: string; videoId: string; url: string; level: string; accent: Accent; transcript: string; transcriptSource: 'youtube' | 'user-provided' | 'none'; createdAt: number }
export interface Settings { level: string; accent: Accent; threshold: number; minPerSkill: number; timezone: string; reminders: { daily: boolean; review: boolean; time: string; days: number[]; granted: boolean }; theme: 'auto' | 'light' | 'dark' }
export interface DB {
  version: number; songs: Song[]; lessons: Lesson[]; cards: Card[]; xp: XpState; activeDays: string[];
  assessments: { lessonId: string; at: number; scores: Record<string, number | null>; total: number; passed: boolean }[];
  writingAttempts: { at: number; type: string; prompt: string; response: string; accuracy: number }[];
  speakingAttempts: { at: number; reference: string; recognized: string | null; status: 'recognized' | 'no-recognition' }[];
  settings: Settings;
  events: { type: 'reviews' | 'dictations' | 'conversations' | 'lessons'; at: number }[];
  tutorErrors: Record<string, number>;
  placementDone: boolean;
  lastNotifiedDay: string | null;
}
export const SCHEMA_VERSION = 6;
export const emptyDB = (): DB => ({
  version: SCHEMA_VERSION, songs: [], lessons: [], cards: [], xp: { total: 0, byDay: {} }, activeDays: [],
  assessments: [], writingAttempts: [], speakingAttempts: [],
  settings: { level: 'A1', accent: 'CA', threshold: 80, minPerSkill: 0, timezone: 'America/Santo_Domingo', reminders: { daily: false, review: false, time: '19:00', days: [0, 1, 2, 3, 4, 5, 6], granted: false }, theme: 'auto' },
  events: [], tutorErrors: {}, placementDone: false, lastNotifiedDay: null,
});

const OLD_ENGLISH_SONG_TITLES = new Set([
  'heaven', 'what a wonderful world', 'stand by me (live)', 'yellow', 'three little birds',
  'ghost', 'fix you', 'count on me', 'imagine', 'treat you better', 'someone like you',
  'wake me up', 'boulevard of broken dreams', 'my heart will go on', 'viva la vida',
  'shape of you', 'rolling in the deep', 'demo'
]);

/** Migraciones: índice n migra de versión n a n+1. */
const MIGRATIONS: ((d: any) => any)[] = [
  (d) => d, // 0 → 1: sin datos previos
  (d) => ({ // 1 → 2: eventos, errores del tutor, recordatorios por día
    ...d, events: d.events ?? [], tutorErrors: d.tutorErrors ?? {}, placementDone: d.placementDone ?? false, lastNotifiedDay: null,
    settings: { ...d.settings, reminders: { days: [0, 1, 2, 3, 4, 5, 6], granted: false, ...d.settings?.reminders } },
  }),
  (d) => ({ // 2 → 3: acento canadiense por defecto
    ...d,
    settings: {
      ...d.settings,
      accent: d.settings?.accent || 'CA',
    },
  }),
  (d) => ({ // 3 → 4: migración a Francés de Canadá (elimina inglés US/UK)
    ...d,
    settings: {
      ...d.settings,
      accent: (d.settings?.accent === 'QC' || d.settings?.accent === 'AC') ? d.settings.accent : 'CA',
    },
    songs: (d.songs ?? []).map((s: any) => ({
      ...s,
      accent: (s.accent === 'QC' || s.accent === 'AC') ? s.accent : 'CA',
    })),
  }),
  (d) => { // 4 → 5: purga total de canciones y tarjetas anteriores en inglés
    const validSongs = (d.songs ?? []).filter((s: any) => {
      const titleLower = (s.title || '').toLowerCase().trim();
      return !OLD_ENGLISH_SONG_TITLES.has(titleLower);
    });
    const validSongIds = new Set(validSongs.map((s: any) => s.id));
    const validLessons = (d.lessons ?? []).filter((l: any) => validSongIds.has(l.songId));
    const validCards = (d.cards ?? []).filter((c: any) => {
      const isEnglishSeed = ['look forward to', 'deploy', 'password', 'reliable', 'schedule'].includes(c.term);
      const belongsToValidSong = Array.from(validSongIds).some((id) => c.id.startsWith(id as string));
      return !isEnglishSeed && (belongsToValidSong || !c.id.includes(':'));
    });
    return {
      ...d,
      settings: {
        ...d.settings,
        accent: (d.settings?.accent === 'QC' || d.settings?.accent === 'AC') ? d.settings.accent : 'CA',
      },
      songs: validSongs,
      lessons: validLessons,
      cards: validCards,
    };
  },
  (d) => ({ // 5 → 6: actualiza videoIds antiguos a IDs oficiales de YouTube con inserción habilitada
    ...d,
    songs: (d.songs ?? []).map((s: any) => {
      const fixedId = resolveWorkingVideoId(s.videoId || '', s.title);
      const fixedTitle = (s.title || '').toLowerCase().trim() === "l'indien" ? 'Lindberg' : s.title;
      return {
        ...s,
        title: fixedTitle,
        videoId: fixedId,
        url: `https://www.youtube.com/watch?v=${fixedId}`,
      };
    }),
  }),
];
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

/** Persistencia principal: IndexedDB (idb-keyval). Migra automáticamente datos antiguos de localStorage. */
export async function loadAsync(): Promise<DB> {
  try {
    const v = await get('db');
    if (v) return migrate(v);
    const ls = localStorage.getItem(KEY);
    if (ls) { const d = migrate(JSON.parse(ls)); await set('db', d); localStorage.removeItem(KEY); return d; }
  } catch { /* IndexedDB no disponible: se usa estado vacío */ }
  return emptyDB();
}
export async function saveAsync(db: DB): Promise<void> { try { await set('db', db); } catch { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* sin almacenamiento */ } } }
export async function clearAsync(): Promise<void> { try { await del('db'); } catch { /* ignorar */ } localStorage.removeItem(KEY); }
