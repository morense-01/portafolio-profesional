import { describe, it, expect } from 'vitest';
import { correctLocal, localProvider } from './tutor';
import { placementLevel, PLACEMENT, MISSIONS, missionProgress, shouldNotify, localParts, deviceSchedule } from './extras';
import { enqueue, sync, resolve, type Transport, type Remote } from './sync';
import { diagnose, weeklySummary, mapState } from './diagnosis';
import { emptyDB, migrate } from '../data/repo';

describe('tutor', () => {
  it('corrige y explica en español', () => {
    const c = correctLocal('je aime la musique');
    expect(c?.corrected).toBe("j'aime la musique"); expect(c?.explanation).toMatch(/elisión/i);
  });
  it('expresiones quebequenses', () => expect(correctLocal('ce weekend')?.corrected).toBe('cette fin de semaine'));
  it('frase correcta sin corrección', () => expect(correctLocal("J'aime la musique.")).toBeNull());
  it('pregunta según nivel', async () => expect(await localProvider.nextQuestion('work', 'A1', 0)).toBe('Quel est ton emploi ?'));
});

describe('placement', () => {
  it('todo correcto → B2', () => expect(placementLevel(PLACEMENT.map((q) => q.answer))).toBe('B2'));
  it('todo incorrecto → A1', () => expect(placementLevel(PLACEMENT.map(() => 99))).toBe('A1'));
  it('hasta A2', () => expect(placementLevel(PLACEMENT.map((q) => (q.level === 'A1' || q.level === 'A2' ? q.answer : 99)))).toBe('A2'));
});

describe('missions', () => {
  const now = Date.UTC(2026, 0, 10, 15);
  it('cuenta solo eventos del periodo y con tope', () => {
    const ev = [...Array(8)].map((_, i) => ({ type: 'reviews' as const, at: now - i * 1000 })).concat([{ type: 'reviews', at: now - 3 * 86_400_000 }]);
    expect(missionProgress(MISSIONS[0], ev, now)).toBe(5);
    expect(missionProgress(MISSIONS[1], ev, now)).toBe(0);
  });
});

describe('notificaciones', () => {
  const base = { daily: true, time: '19:00', days: [0, 1, 2, 3, 4, 5, 6], timezone: 'America/Santo_Domingo', notificationsGranted: true };
  const t = (h: number) => Date.UTC(2026, 0, 10, h); // Santo Domingo = UTC-4
  it('zona horaria', () => expect(localParts(t(23), base.timezone).hhmm).toBe('19:00'));
  it('antes de la hora no avisa', () => expect(shouldNotify(base, t(22), null)).toBe(false));
  it('a la hora avisa una vez al día', () => { expect(shouldNotify(base, t(23), null)).toBe(true); expect(shouldNotify(base, t(23), '2026-01-10')).toBe(false); });
  it('respeta desactivado y permiso denegado', () => { expect(shouldNotify({ ...base, daily: false }, t(23), null)).toBe(false); expect(shouldNotify({ ...base, notificationsGranted: false }, t(23), null)).toBe(false); });
  it('respeta días de la semana', () => expect(shouldNotify({ ...base, days: [1] }, t(23), null)).toBe(false)); // 10 ene 2026 = sábado
});

describe('deviceSchedule', () => {
  it('mismo huso', () => expect(deviceSchedule('19:00', [1], 'America/Santo_Domingo', 'America/Santo_Domingo')).toEqual([{ dow: 1, hour: 19, minute: 0 }]));
  it('UTC: 19:00 RD = 23:00', () => expect(deviceSchedule('19:00', [1], 'America/Santo_Domingo', 'UTC')).toEqual([{ dow: 1, hour: 23, minute: 0 }]));
  it('Tokio: cambia de día', () => expect(deviceSchedule('19:00', [1], 'America/Santo_Domingo', 'Asia/Tokyo')).toEqual([{ dow: 2, hour: 8, minute: 0 }]));
});

describe('sync', () => {
  const mk = (remote: Remote[]): Transport & { pushed: string[] } => ({ pushed: [], pull: async () => remote, async push(c) { this.pushed.push(c.entityId); } });
  const ch = (id: string, payload: any) => enqueue([], { entity: 'card', entityId: id, op: 'upsert', payload, updatedAt: 200 }, 'c-' + id);
  it('empuja cambios sin conflicto', async () => {
    const t = mk([]); const r = await sync(ch('1', { a: 1 }), t, 100);
    expect(t.pushed).toEqual(['1']); expect(r.conflicts).toHaveLength(0); expect(r.queue[0].status).toBe('synced');
  });
  it('conflicto no sobrescribe en silencio', async () => {
    const t = mk([{ entity: 'card', entityId: '1', payload: { a: 2 }, updatedAt: 150 }]); const r = await sync(ch('1', { a: 1 }), t, 100);
    expect(t.pushed).toEqual([]); expect(r.conflicts).toHaveLength(1); expect(r.queue[0].status).toBe('conflict');
    expect(resolve(r.queue, r.conflicts[0], 'local')[0].status).toBe('pending');
    expect(resolve(r.queue, r.conflicts[0], 'remote')[0].status).toBe('synced');
  });
  it('aplica remotos sin cambio local', async () => {
    const r = await sync([], mk([{ entity: 'card', entityId: '9', payload: {}, updatedAt: 150 }]), 100); expect(r.applied).toHaveLength(1);
  });
  it('colapsa cambios pendientes de la misma entidad', () => {
    const q = enqueue(ch('1', { a: 1 }), { entity: 'card', entityId: '1', op: 'upsert', payload: { a: 3 }, updatedAt: 300 }, 'c2');
    expect(q).toHaveLength(1); expect(q[0].payload).toEqual({ a: 3 });
  });
});

describe('diagnóstico', () => {
  const at = (type: string, acc: number, n: number) => Array.from({ length: n }, (_, i) => ({ at: Date.now() - i, type, prompt: '', response: '', accuracy: acc }));
  it('sin datos suficientes no inventa hallazgos', () => { const r = diagnose(emptyDB()); expect(r.findings).toHaveLength(0); expect(r.insufficient.length).toBeGreaterThan(0); });
  it('detecta lectura>escucha con evidencia', () => {
    const d = { ...emptyDB(), writingAttempts: [...at('dictation', 0.4, 3), ...at('recall', 0.9, 3)] };
    const r = diagnose(d); expect(r.findings[0].title).toMatch(/escuchas/); expect(r.findings[0].evidence).toMatch(/90%/);
  });
  it('resumen semanal solo compara con datos en ambos periodos', () => {
    expect(weeklySummary(emptyDB()).comparison).toBeNull();
    const now = Date.now(); const d = { ...emptyDB(), writingAttempts: [...at('dictation', 0.8, 3), ...at('dictation', 0.5, 3).map((x) => ({ ...x, at: now - 9 * 86_400_000 }))] };
    expect(weeklySummary(d, now).comparison).not.toBeNull();
  });
  it('mapa: requisitos por unidad', () => { const m = mapState(2); expect(m[0].units.map((u) => u.done)).toEqual([true, true, false]); expect(m[0].units[2].missing).toBe(1); });
});

describe('migración de esquema', () => {
  it('v1 → versión actual conserva datos y añade campos', () => {
    const d = migrate({ version: 1, songs: [{ id: 's' }], settings: { level: 'B1', reminders: { daily: true, review: false, time: '08:00' } } });
    expect(d.version).toBeGreaterThanOrEqual(2);
    expect(d.songs).toHaveLength(1);
    expect(d.events).toEqual([]);
    expect(d.settings.reminders.days).toHaveLength(7);
    expect(d.settings.accent).toBeDefined();
  });
});
