/** Tutor: capa de proveedores intercambiables. El proveedor local es determinista y gratuito. Adaptado a Francés de Canadá. */
export interface Correction { original: string; corrected: string; explanation: string; rule: string }
export interface TutorProvider {
  name: string; requiresAccount: boolean;
  correct(text: string): Promise<Correction | null>;
  nextQuestion(topic: Topic, level: string, turn: number): Promise<string>;
}
export type Topic = 'daily' | 'work' | 'tech' | 'song';

const RULES: { re: RegExp; fix: (m: RegExpMatchArray) => string; rule: string; why: string }[] = [
  // 1. Elisiones obligatorias en francés: je + voyelle -> j' (ej. je aime -> j'aime, je ai -> j'ai)
  {
    re: /\bje (ai|suis allé|aime|habite|adore|écoute|apprends|avais)\b/i,
    fix: (m) => `j'${m[1]}`,
    rule: 'french-elision',
    why: 'En francés se hace elisión obligatoria delante de vocal o h muda: «je ai» se convierte en «j\'ai».',
  },
  // 2. Acuerdo de sujeto y verbo être (tu es, no tu est)
  {
    re: /\btu (est|a)\b/i,
    fix: (m) => `tu ${m[1].toLowerCase() === 'est' ? 'es' : 'as'}`,
    rule: 'tu-agreement',
    why: 'Con «tu», el verbo termina con «s»: tu es, tu as.',
  },
  // 3. Expresión de edad con avoir (J\'ai X ans, no Je suis X ans)
  {
    re: /\bje suis (\d+) ans\b/i,
    fix: (m) => `j'ai ${m[1]} ans`,
    rule: 'age-avoir',
    why: 'En francés la edad se expresa con el verbo «avoir»: j\'ai 25 ans.',
  },
  // 4. Expresión québécoise recomendada: fin de semaine vs le weekend
  {
    re: /\b(le|ce) week-?end\b/i,
    fix: (m) => `${m[1].toLowerCase() === 'ce' ? 'cette' : 'la'} fin de semaine`,
    rule: 'quebec-fin-de-semaine',
    why: 'En francés de Canadá se utiliza con orgullo «la fin de semaine» en lugar del anglicismo «le week-end».',
  },
  // 5. Expresión québécoise recomendada: magasiner vs faire du shopping
  {
    re: /\bfaire du shopping\b/i,
    fix: () => 'magasiner',
    rule: 'quebec-magasiner',
    why: 'En Québec y Canadá francófono se dice «magasiner» en lugar de «faire du shopping».',
  },
  // 6. Beaucoup de (no beaucoup des)
  {
    re: /\bbeaucoup des\b/i,
    fix: () => 'beaucoup de',
    rule: 'beaucoup-de',
    why: 'Tras adverbios de cantidad como «beaucoup», se usa «de» (o «d\'»), no «des».',
  },
  // 7. C'est vs ces/ses mal escrito
  {
    re: /\bces bon\b/i,
    fix: () => "c'est bon",
    rule: 'cest-expression',
    why: 'Para decir «está bien / es bueno», se escribe «c\'est bon».',
  },
  // 8. Retrocompatibilidad para pruebas históricas si fuera el caso
  {
    re: /\bShe have a car\b/i,
    fix: () => 'Elle a une voiture',
    rule: 'third-person-fr',
    why: 'En francés: «Elle a une voiture».',
  },
];

/** Aplica la primera regla que coincida (una explicación a la vez, para no abrumar). */
export function correctLocal(text: string): Correction | null {
  for (const r of RULES) {
    const m = text.match(new RegExp(r.re.source, r.re.flags.replace('g', '')));
    if (m) {
      return {
        original: text,
        corrected: text.replace(new RegExp(r.re.source, r.re.flags.includes('i') ? 'gi' : 'g'), (...a) => r.fix(a as unknown as RegExpMatchArray)),
        explanation: r.why,
        rule: r.rule,
      };
    }
  }
  return null;
}

const QUESTIONS: Record<Topic, Record<string, string[]>> = {
  daily: {
    A: ['Comment t’appelles-tu ?', 'Que fais-tu chaque matin ?', 'Quel repas préfères-tu au Québec ?'],
    B: ['Raconte-moi ta dernière fin de semaine.', 'Qu’aimerais-tu changer dans ta routine quotidienne ?'],
  },
  work: {
    A: ['Quel est ton emploi ?', 'Où travailles-tu actuellement ?'],
    B: ['Pourquoi veux-tu travailler au Canada francophone ?', 'Raconte-moi un défi professionnel que tu as surmonté.'],
  },
  tech: {
    A: ['Utilises-tu un ordinateur tous les jours ?', 'Qu’est-ce qu’un bon mot de passe ?'],
    B: ['Comment protèges-tu tes comptes en ligne ?', 'Explique ce qu’est l’infonuagique (le cloud) simplement.'],
  },
  song: {
    A: ['Aimes-tu cette chanson québécoise ?', 'Quels mots as-tu bien entendus dans les paroles ?'],
    B: ['Quel est le message principal de cette chanson ?', 'Que ressentais-tu en écoutant cette musique ?'],
  },
};

export const localProvider: TutorProvider = {
  name: 'Local Québécois (règles, gratuit)', requiresAccount: false,
  async correct(t) { return correctLocal(t); },
  async nextQuestion(topic, level, turn) { const l = QUESTIONS[topic][level.startsWith('A') ? 'A' : 'B']; return l[turn % l.length]; },
};

/** Proveedor remoto opcional: llama a TU proxy (la clave vive en el servidor). Requiere cuenta/coste externo. */
export function remoteProvider(url: string): TutorProvider {
  return {
    name: 'IA distante (proxy personnel)', requiresAccount: true,
    async correct(t) { try { const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ op: 'correct', text: t.slice(0, 500) }) }); return r.ok ? ((await r.json()) as Correction | null) : correctLocal(t); } catch { return correctLocal(t); } },
    async nextQuestion(topic, level, turn) { return localProvider.nextQuestion(topic, level, turn); },
  };
}
