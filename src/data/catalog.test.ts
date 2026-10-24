import { describe, it, expect } from 'vitest';
import { LEVELED_CATALOG, getUnlockedLevels } from './catalog';

describe('catalog', () => {
  it('tiene canciones para los 4 niveles A1, A2, B1, B2', () => {
    const levels = new Set(LEVELED_CATALOG.map((s) => s.level));
    expect(levels.has('A1')).toBe(true);
    expect(levels.has('A2')).toBe(true);
    expect(levels.has('B1')).toBe(true);
    expect(levels.has('B2')).toBe(true);
  });

  it('calcula niveles desbloqueados por nivel actual', () => {
    expect(getUnlockedLevels('A1', 0)).toEqual(['A1']);
    expect(getUnlockedLevels('A2', 0)).toEqual(['A1', 'A2']);
    expect(getUnlockedLevels('B1', 0)).toEqual(['A1', 'A2', 'B1']);
    expect(getUnlockedLevels('B2', 0)).toEqual(['A1', 'A2', 'B1', 'B2']);
  });

  it('desbloquea niveles superiores según el progreso de lecciones aprobadas', () => {
    // Si el usuario comenzó en A1 pero aprobó 4 lecciones, desbloquea hasta B1
    expect(getUnlockedLevels('A1', 4)).toEqual(['A1', 'A2', 'B1']);
    // Con 8 o más lecciones aprobadas, desbloquea hasta B2
    expect(getUnlockedLevels('A1', 8)).toEqual(['A1', 'A2', 'B1', 'B2']);
  });
});
