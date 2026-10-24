/** Tutor: capa de proveedores intercambiables. El proveedor local es determinista y gratuito. */
export interface Correction { original: string; corrected: string; explanation: string; rule: string }
export interface TutorProvider {
  name: string; requiresAccount: boolean;
  correct(text: string): Promise<Correction | null>;
  nextQuestion(topic: Topic, level: string, turn: number): Promise<string>;
}
export type Topic = 'daily' | 'work' | 'tech' | 'song';

const RULES: { re: RegExp; fix: (m: RegExpMatchArray) => string; rule: string; why: string }[] = [
  { re: /\bi\b(?=\s)/g, fix: () => 'I', rule: 'capital-i', why: 'El pronombre «I» siempre va en mayúscula.' },
  { re: /\b(he|she|it) (have|do|go)\b/i, fix: (m) => `${m[1]} ${({ have: 'has', do: 'does', go: 'goes' } as any)[m[2].toLowerCase()]}`, rule: 'third-person-s', why: 'Con he/she/it el presente cambia: has, does, goes.' },
  { re: /\b(i|you|we|they) (is)\b/i, fix: (m) => `${m[1]} ${m[1].toLowerCase() === 'i' ? 'am' : 'are'}`, rule: 'be-agreement', why: 'I am; you/we/they are.' },
  { re: /\b(dont|doesnt|cant|wont|isnt|im)\b/i, fix: (m) => ({ dont: "don't", doesnt: "doesn't", cant: "can't", wont: "won't", isnt: "isn't", im: "I'm" } as any)[m[1].toLowerCase()], rule: 'contraction', why: 'Las contracciones llevan apóstrofo.' },
  { re: /\bI am agree\b/i, fix: () => 'I agree', rule: 'agree', why: '«Agree» es un verbo; no se usa con «am».' },
  { re: /\bmore better\b/i, fix: () => 'better', rule: 'double-comparative', why: '«Better» ya es comparativo.' },
  { re: /\bI have (\d+) years\b/i, fix: (m) => `I am ${m[1]} years`, rule: 'age', why: 'En inglés la edad se expresa con «be»: I am 30 years old.' },
];
/** Aplica la primera regla que coincida (una explicación a la vez, para no abrumar). */
export function correctLocal(text: string): Correction | null {
  for (const r of RULES) {
    const m = text.match(new RegExp(r.re.source, r.re.flags.replace('g', '')));
    if (m) return { original: text, corrected: text.replace(new RegExp(r.re.source, r.re.flags.includes('i') ? 'gi' : 'g'), (...a) => r.fix(a as unknown as RegExpMatchArray)), explanation: r.why, rule: r.rule };
  }
  return null;
}
const QUESTIONS: Record<Topic, Record<string, string[]>> = {
  daily: { A: ['What is your name?', 'What do you do every morning?', 'What food do you like?'], B: ['Describe your last weekend.', 'What would you change about your routine?'] },
  work: { A: ['What is your job?', 'Where do you work?'], B: ['Why do you want this job?', 'Tell me about a problem you solved at work.'] },
  tech: { A: ['Do you use a computer every day?', 'What is a password?'], B: ['How do you keep your accounts secure?', 'Explain what the cloud is in simple words.'] },
  song: { A: ['Do you like the song?', 'Which words did you hear?'], B: ['What is the message of the song?', 'How does the song make you feel and why?'] },
};
export const localProvider: TutorProvider = {
  name: 'Local (reglas, gratis)', requiresAccount: false,
  async correct(t) { return correctLocal(t); },
  async nextQuestion(topic, level, turn) { const l = QUESTIONS[topic][level.startsWith('A') ? 'A' : 'B']; return l[turn % l.length]; },
};
/** Proveedor remoto opcional: llama a TU proxy (la clave vive en el servidor). Requiere cuenta/coste externo. */
export function remoteProvider(url: string): TutorProvider {
  return {
    name: 'IA remota (proxy propio)', requiresAccount: true,
    async correct(t) { try { const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ op: 'correct', text: t.slice(0, 500) }) }); return r.ok ? ((await r.json()) as Correction | null) : correctLocal(t); } catch { return correctLocal(t); } },
    async nextQuestion(topic, level, turn) { return localProvider.nextQuestion(topic, level, turn); },
  };
}
