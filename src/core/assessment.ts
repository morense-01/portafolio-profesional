/** Puntuación del test final (4 x 25). Speaking sin evidencia queda 'pending', nunca inventado. */
export type Skill = 'listening' | 'reading' | 'writing' | 'speaking';
export interface SkillScores { listening: number; reading: number; writing: number; speaking: number | null }
export interface Result {
  perSkill: SkillScores; total: number; maxPossible: number; passed: boolean;
  speakingStatus: 'evaluated' | 'pending'; failedMinimums: Skill[]; priorities: Skill[];
}
export interface Rules { threshold: number; minPerSkill: number }
export const DEFAULT_RULES: Rules = { threshold: 80, minPerSkill: 0 };

export function evaluate(s: SkillScores, rules: Rules = DEFAULT_RULES): Result {
  const speakingStatus = s.speaking === null ? 'pending' : 'evaluated';
  const total = Math.round(s.listening + s.reading + s.writing + (s.speaking ?? 0));
  const maxPossible = speakingStatus === 'pending' ? 75 : 100;
  const failedMinimums = (Object.keys(s) as Skill[]).filter((k) => s[k] !== null && (s[k] as number) < rules.minPerSkill);
  // Con Speaking pendiente no se puede aprobar: el dominio queda pendiente.
  const passed = speakingStatus === 'evaluated' && total >= rules.threshold && failedMinimums.length === 0;
  const priorities = (Object.keys(s) as Skill[]).filter((k) => s[k] !== null)
    .sort((a, b) => (s[a] as number) - (s[b] as number)).slice(0, 3);
  return { perSkill: s, total, maxPossible, passed, speakingStatus, failedMinimums, priorities };
}
