export interface LeveledSong {
  id: string;
  title: string;
  artist: string;
  videoId: string;
  url: string;
  level: 'A1' | 'A2' | 'B1' | 'B2';
  accent: 'US' | 'UK';
  description: string;
  grammarFocus: string;
}

export const LEVELED_CATALOG: LeveledSong[] = [
  // NIVEL A1 (Principiante: oraciones cortas, vocabulario cotidiano, ritmo pausado)
  {
    id: 'a1-stand-by-me',
    title: 'Stand By Me',
    artist: 'Ben E. King',
    videoId: 'hwZNL7QVJjE',
    url: 'https://www.youtube.com/watch?v=hwZNL7QVJjE',
    level: 'A1',
    accent: 'US',
    description: 'Canción clásica con pronunciación muy clara, vocabulario básico y oraciones simples.',
    grammarFocus: 'Presente simple, oraciones afirmativas y negativas básicas.',
  },
  {
    id: 'a1-yellow',
    title: 'Yellow',
    artist: 'Coldplay',
    videoId: 'yKNxeF4KMsY',
    url: 'https://www.youtube.com/watch?v=yKNxeF4KMsY',
    level: 'A1',
    accent: 'UK',
    description: 'Ritmo suave y constante, ideal para entrenar el oído a sonidos vocálicos en inglés británico.',
    grammarFocus: 'Adjetivos descriptivos, pronombres de objeto y pasado simple regular.',
  },
  {
    id: 'a1-three-little-birds',
    title: 'Three Little Birds',
    artist: 'Bob Marley',
    videoId: 'zaGUr6AKvyU',
    url: 'https://www.youtube.com/watch?v=zaGUr6AKvyU',
    level: 'A1',
    accent: 'US',
    description: 'Estructura repetitiva muy amigable para hispanohablantes.',
    grammarFocus: 'Contracciones básicas (don’t worry, every little thing).',
  },

  // NIVEL A2 (Básico consolidado: preguntas, pasado simple, rutinas)
  {
    id: 'a2-fix-you',
    title: 'Fix You',
    artist: 'Coldplay',
    videoId: 'k4V3Mo61fJM',
    url: 'https://www.youtube.com/watch?v=k4V3Mo61fJM',
    level: 'A2',
    accent: 'UK',
    description: 'Estructuras de causa y consecuencia con verbos cotidianos.',
    grammarFocus: 'Cláusulas temporales con "When you...", verbos modales can/could.',
  },
  {
    id: 'a2-count-on-me',
    title: 'Count On Me',
    artist: 'Bruno Mars',
    videoId: '4JNtAtGGNRU',
    url: 'https://www.youtube.com/watch?v=4JNtAtGGNRU',
    level: 'A2',
    accent: 'US',
    description: 'Frases de amistad, números y condicional de primer tipo.',
    grammarFocus: 'Primer condicional (If you ever find yourself...), conectores.',
  },
  {
    id: 'a2-imagine',
    title: 'Imagine',
    artist: 'John Lennon',
    videoId: 'bN3yPd7w_34',
    url: 'https://www.youtube.com/watch?v=bN3yPd7w_34',
    level: 'A2',
    accent: 'UK',
    description: 'Oraciones reflexivas breves y vocabulario social fundamental.',
    grammarFocus: 'Imperativo (Imagine there’s no...), infinitivos con "to".',
  },

  // NIVEL B1 (Intermedio: narrativa en pasado, emociones, expresiones idiomáticas)
  {
    id: 'b1-someone-like-you',
    title: 'Someone Like You',
    artist: 'Adele',
    videoId: 'hLQl3WQQoQ0',
    url: 'https://www.youtube.com/watch?v=hLQl3WQQoQ0',
    level: 'B1',
    accent: 'UK',
    description: 'Narrativa emotiva con contrastes entre pasado y presente.',
    grammarFocus: 'Present perfect, contraste entre past simple y used to.',
  },
  {
    id: 'b1-wake-me-up',
    title: 'Wake Me Up',
    artist: 'Avicii',
    videoId: '5y_KJAg8bHI',
    url: 'https://www.youtube.com/watch?v=5y_KJAg8bHI',
    level: 'B1',
    accent: 'US',
    description: 'Metáforas de crecimiento personal y lenguaje figurado.',
    grammarFocus: 'Metáforas, adverbios de tiempo y oraciones de relativo.',
  },
  {
    id: 'b1-boulevard',
    title: 'Boulevard of Broken Dreams',
    artist: 'Green Day',
    videoId: 'Soa3gO7tL-c',
    url: 'https://www.youtube.com/watch?v=Soa3gO7tL-c',
    level: 'B1',
    accent: 'US',
    description: 'Excelente para distinguir pronunciación americana de la "r" y enlaces entre palabras.',
    grammarFocus: 'Present continuous para hábitos, adjetivos compuestos.',
  },

  // NIVEL B2 (Intermedio alto: habla rápida, phrasal verbs, contracciones naturales)
  {
    id: 'b2-viva-la-vida',
    title: 'Viva La Vida',
    artist: 'Coldplay',
    videoId: 'dvgZkm1xWPE',
    url: 'https://www.youtube.com/watch?v=dvgZkm1xWPE',
    level: 'B2',
    accent: 'UK',
    description: 'Léxico avanzado histórico, estructuras pasivas y ritmo rápido.',
    grammarFocus: 'Voz pasiva, cláusulas subordinadas complejas y vocabulario formal.',
  },
  {
    id: 'b2-shape-of-you',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    videoId: 'JGwWNGJdvx8',
    url: 'https://www.youtube.com/watch?v=JGwWNGJdvx8',
    level: 'B2',
    accent: 'UK',
    description: 'Entrenamiento intensivo de velocidad auditiva y linking words.',
    grammarFocus: 'Phrasal verbs, jerga coloquial moderna y cadencia rápida.',
  },
  {
    id: 'b2-rolling-in-the-deep',
    title: 'Rolling in the Deep',
    artist: 'Adele',
    videoId: 'rYEDA3JcQqw',
    url: 'https://www.youtube.com/watch?v=rYEDA3JcQqw',
    level: 'B2',
    accent: 'UK',
    description: 'Expresiones idiomáticas inglesas intensas y variaciones fonéticas.',
    grammarFocus: 'Idioms (rolling in the deep, lay your head), oraciones modales compuestas.',
  },
];

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2'] as const;

/**
 * Determina qué niveles están desbloqueados según el nivel actual del estudiante
 * o el número de lecciones aprobadas.
 */
export function getUnlockedLevels(currentLevel: string, passedCount: number): ('A1' | 'A2' | 'B1' | 'B2')[] {
  const currentIdx = Math.max(0, LEVEL_ORDER.indexOf(currentLevel as any));
  const earnedIdx = passedCount >= 8 ? 3 : passedCount >= 4 ? 2 : passedCount >= 1 ? 1 : 0;
  const maxIdx = Math.max(currentIdx, earnedIdx);
  return LEVEL_ORDER.slice(0, maxIdx + 1) as unknown as ('A1' | 'A2' | 'B1' | 'B2')[];
}
