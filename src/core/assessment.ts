/** Puntuación del test final (4 x 25). Habilidades sin evidencia quedan 'pending', nunca inventadas. */
export type Skill = 'listening' | 'reading' | 'writing' | 'speaking';
export interface SkillScores { listening: number | null; reading: number; writing: number; speaking: number | null }
export interface Result {
  perSkill: SkillScores; total: number; maxPossible: number; passed: boolean;
  speakingStatus: 'evaluated' | 'pending'; listeningStatus: 'evaluated' | 'pending';
  failedMinimums: Skill[]; priorities: Skill[];
}
export interface Rules { threshold: number; minPerSkill: number }
export const DEFAULT_RULES: Rules = { threshold: 80, minPerSkill: 0 };

export function evaluate(s: SkillScores, rules: Rules = DEFAULT_RULES): Result {
  const speakingStatus = s.speaking === null ? 'pending' : 'evaluated';
  const listeningStatus = s.listening === null ? 'pending' : 'evaluated';
  const total = Math.round((s.listening ?? 0) + s.reading + s.writing + (s.speaking ?? 0));
  const evaluated = (Object.keys(s) as Skill[]).filter((k) => s[k] !== null);
  const maxPossible = evaluated.length * 25;
  const failedMinimums = evaluated.filter((k) => (s[k] as number) < rules.minPerSkill);
  // Con alguna habilidad pendiente no se puede aprobar: el dominio queda pendiente.
  const passed = evaluated.length === 4 && total >= rules.threshold && failedMinimums.length === 0;
  const priorities = [...evaluated].sort((a, b) => (s[a] as number) - (s[b] as number)).slice(0, 3);
  return { perSkill: s, total, maxPossible, passed, speakingStatus, listeningStatus, failedMinimums, priorities };
}
