import { describe, it, expect } from 'vitest';
import { parseYouTubeId } from './youtube';
import { compareText } from './diff';
import { review, dueCards, type Card } from './srs';
import { evaluate } from './assessment';
import { award, streak } from './xp';
import { newLesson, advance, canShowTranscript, repeatListening } from './lesson';

describe('youtube', () => {
  it('acepta formatos válidos', () => {
    for (const u of ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ?t=3', 'https://youtube.com/shorts/dQw4w9WgXcQ', 'https://m.youtube.com/embed/dQw4w9WgXcQ'])
      expect(parseYouTubeId(u)).toBe('dQw4w9WgXcQ');
  });
  it('rechaza no compatibles', () => {
    for (const u of ['', 'hola', 'https://vimeo.com/123', 'https://evil.com/watch?v=dQw4w9WgXcQ', 'javascript:alert(1)', 'https://youtube.com/watch?v=corto', 'https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ'])
      expect(parseYouTubeId(u)).toBeNull();
  });
});

describe('diff', () => {
  it('ignora puntuación y comillas tipográficas', () => {
    const r = compareText("I don't know, really.", 'i don’t know really');
    expect(r.accuracy).toBeGreaterThan(0.85);
    expect(r.items.some((i) => i.kind === 'missing' || i.kind === 'extra')).toBe(false);
  });
  it('detecta omisión, añadido y ortografía', () => {
    const r = compareText('She likes green apples', 'She likse apples today');
    const k = r.items.map((i) => i.kind);
    expect(k).toContain('spelling'); expect(k).toContain('missing'); expect(k).toContain('extra');
  });
  it('detecta contracción incorrecta', () => {
    expect(compareText("I don't know", 'I dont know').items.some((i) => i.kind === 'contraction')).toBe(true);
  });
  it('mayúsculas son error leve', () => {
    expect(compareText('I like London', 'i like london').items.filter((i) => i.kind === 'case')).toHaveLength(2);
  });
});

const base: Card = { id: '1', term: 'run', meaning: 'correr', example: '', translation: '', pronunciation: '', partOfSpeech: 'verb', level: 'A1', status: 'new', intervalDays: 0, nextReviewAt: 0, correctSessions: [], usedActively: false, origin: 'confirmed' };
describe('srs', () => {
  const D = 86_400_000, t0 = Date.UTC(2026, 0, 1);
  it('no domina con una sola respuesta correcta', () => {
    const c = review(base, true, t0, true);
    expect(c.status).not.toBe('mastered'); expect(c.intervalDays).toBe(1);
  });
  it('intervalos 1,3,7 y dominio tras 3 sesiones con uso activo', () => {
    let c = review(base, true, t0, true);
    c = review(c, true, t0 + D); expect(c.intervalDays).toBe(3);
    c = review(c, true, t0 + 4 * D); expect(c.intervalDays).toBe(7);
    expect(c.status).toBe('mastered');
  });
  it('misma sesión (mismo día) no suma', () => {
    let c = review(base, true, t0, true); c = review(c, true, t0 + 1000);
    expect(c.correctSessions).toHaveLength(1);
  });
  it('fallo reinicia', () => {
    const c = review(review(base, true, t0), false, t0 + D);
    expect(c.status).toBe('relearn'); expect(c.intervalDays).toBe(1);
  });
  it('pendientes', () => {
    const c = review(base, true, t0);
    expect(dueCards([c], t0)).toHaveLength(0); expect(dueCards([c], t0 + 2 * D)).toHaveLength(1);
  });
});

describe('assessment', () => {
  it('aprueba con >=80 y speaking evaluado', () => expect(evaluate({ listening: 22, reading: 22, writing: 20, speaking: 18 }).passed).toBe(true));
  it('no aprueba con 79', () => expect(evaluate({ listening: 20, reading: 20, writing: 20, speaking: 19 }).passed).toBe(false));
  it('speaking pendiente no inventa puntaje', () => {
    const r = evaluate({ listening: 25, reading: 25, writing: 25, speaking: null });
    expect(r.passed).toBe(false); expect(r.speakingStatus).toBe('pending'); expect(r.maxPossible).toBe(75);
    expect(evaluate({ listening: null, reading: 25, writing: 25, speaking: 25 }).passed).toBe(false);
  });
  it('mínimo por habilidad', () => {
    const r = evaluate({ listening: 25, reading: 25, writing: 25, speaking: 10 }, { threshold: 80, minPerSkill: 15 });
    expect(r.passed).toBe(false); expect(r.failedMinimums).toEqual(['speaking']);
  });
});

describe('xp', () => {
  it('aplica tope diario', () => {
    let s = { total: 0, byDay: {} } as any; let sum = 0;
    for (let i = 0; i < 10; i++) { const r = award(s, 'review', '2026-01-01'); s = r.state; sum += r.gained; }
    expect(sum).toBe(50); expect(s.total).toBe(50);
    expect(award(s, 'review', '2026-01-02').gained).toBe(5);
  });
  it('racha: hoy pendiente no la rompe', () => {
    expect(streak(['2026-01-01', '2026-01-02'], '2026-01-03')).toBe(2);
    expect(streak(['2026-01-01'], '2026-01-05')).toBe(0);
  });
});

describe('lesson', () => {
  it('transcripción oculta hasta confirmar', () => {
    let l = newLesson('l', 's');
    expect(canShowTranscript(l)).toBe(false);
    l = advance(l); expect(l.stage).toBe('confirm'); expect(canShowTranscript(l)).toBe(false);
    l = advance(l); expect(l.stage).toBe('reading'); expect(canShowTranscript(l)).toBe(true);
  });
  it('repetir escucha vuelve a listening y oculta', () => {
    let l = advance(newLesson('l', 's'));
    l = repeatListening(l); expect(l.stage).toBe('listening'); expect(canShowTranscript(l)).toBe(false); expect(l.listening.replays).toBe(1);
  });
  it('completa las cuatro etapas', () => {
    let l = newLesson('l', 's');
    for (let i = 0; i < 6; i++) l = advance(l);
    expect(l.stage).toBe('done');
    expect(l.completed).toEqual({ listening: true, reading: true, writing: true, speaking: true });
  });
});
