import type { Accent } from './repo';

export interface LeveledSong {
  id: string;
  title: string;
  artist: string;
  videoId: string;
  url: string;
  level: 'A1' | 'A2' | 'B1' | 'B2';
  accent: Accent;
  description: string;
  grammarFocus: string;
}

export const LEVELED_CATALOG: LeveledSong[] = [
  // NIVEL A1 (Débutant : oraciones cortas, vocabulario cotidiano, ritmo pausado)
  {
    id: 'a1-pour-que-tu-maimes-encore',
    title: "Pour que tu m'aimes encore",
    artist: 'Céline Dion',
    videoId: 'AzaTyxMapAQ',
    url: 'https://www.youtube.com/watch?v=AzaTyxMapAQ',
    level: 'A1',
    accent: 'CA',
    description: 'La balada francófona más icónica de Céline Dion. Dicción lenta, articulación impecable y oraciones en presente.',
    grammarFocus: 'Presente de indicativo, pronombres reflexivos y oraciones de deseo con "pour que".',
  },
  {
    id: 'a1-comme-des-enfants',
    title: 'Comme des enfants',
    artist: 'Cœur de pirate',
    videoId: 'PaUI3O_oI18',
    url: 'https://www.youtube.com/watch?v=PaUI3O_oI18',
    level: 'A1',
    accent: 'QC',
    description: 'Pop québécois indie dulce y rítmico con vocabulario sencillo de sentimientos y relaciones cotidianas.',
    grammarFocus: 'Comparaciones con "comme", adjetivos básicos y presente simple.',
  },
  {
    id: 'a1-je-reviendrai-a-montreal',
    title: 'Je reviendrai à Montréal',
    artist: 'Robert Charlebois',
    videoId: 'u1xR7U5vD2Y',
    url: 'https://www.youtube.com/watch?v=u1xR7U5vD2Y',
    level: 'A1',
    accent: 'CA',
    description: 'Clásico emotivo quebequense que rinde tributo a Montreal, ideal para entrenar el oído a la cadencia canadiense.',
    grammarFocus: 'Futuro simple regular (reviendrai) y vocabulario urbano de Québec.',
  },
  {
    id: 'a1-pour-un-instant',
    title: 'Pour un instant',
    artist: 'Harmonium',
    videoId: 'Xm2lDqX2xZc',
    url: 'https://www.youtube.com/watch?v=Xm2lDqX2xZc',
    level: 'A1',
    accent: 'QC',
    description: 'Himno del folk-rock quebequense clásico de los años 70 con tempo pausado y pronunciación clara.',
    grammarFocus: 'Preposiciones simples (pour, dans), sustantivos y concordancia de género.',
  },

  // NIVEL A2 (Élémentaire consolidé : preguntas, passé composé, tiempo y viajes)
  {
    id: 'a2-faufile',
    title: 'Faufile',
    artist: 'Charlotte Cardin',
    videoId: 'l2uS2Lw5H7o',
    url: 'https://www.youtube.com/watch?v=l2uS2Lw5H7o',
    level: 'A2',
    accent: 'CA',
    description: 'Balada contemporánea de Montreal. Canto íntimo y claro para practicar entonación y enlaces vocálicos.',
    grammarFocus: 'Verbos de movimiento en presente, pronombres de objeto directo e indirecto.',
  },
  {
    id: 'a2-seul',
    title: 'Seul',
    artist: 'Garou',
    videoId: 'O0oYpM2o3e8',
    url: 'https://www.youtube.com/watch?v=O0oYpM2o3e8',
    level: 'A2',
    accent: 'CA',
    description: 'Voz profunda y resonante del cantante quebequense Garou. Expresiones sobre la rutina y la soledad.',
    grammarFocus: 'Passé composé vs imparfait y adjetivos calificativos.',
  },
  {
    id: 'a2-toune-dautomne',
    title: "Toune d'automne",
    artist: 'Les Cowboys Fringants',
    videoId: 'm_1b_4lB3tA',
    url: 'https://www.youtube.com/watch?v=m_1b_4lB3tA',
    level: 'A2',
    accent: 'QC',
    description: 'Folk entrañable con palabras típicas quebequenses sobre el clima, las estaciones y la nostalgia.',
    grammarFocus: 'Léxico québécois (toune = canción), expresiones temporales y descripciones meteorológicas.',
  },
  {
    id: 'a2-rever-mieux',
    title: 'Rêver mieux',
    artist: 'Daniel Bélanger',
    videoId: 'PjF15dYn9f8',
    url: 'https://www.youtube.com/watch?v=PjF15dYn9f8',
    level: 'A2',
    accent: 'QC',
    description: 'Obra maestra del pop alternativo de Québec con ritmo melódico y oraciones reflexivas.',
    grammarFocus: 'Infinitivos tras verbos modales (vouloir, pouvoir) y estructuras de consejo.',
  },

  // NIVEL B1 (Intermédiaire : narrativa, expresiones coloquiales québécoises y reflexiones)
  {
    id: 'b1-les-etoiles-filantes',
    title: 'Les étoiles filantes',
    artist: 'Les Cowboys Fringants',
    videoId: '0Q8EQgq14Qo',
    url: 'https://www.youtube.com/watch?v=0Q8EQgq14Qo',
    level: 'B1',
    accent: 'QC',
    description: 'La canción más querida y emblemática de la música quebequense moderna. Reflexión profunda sobre la vida.',
    grammarFocus: 'Imparfait para relatar recuerdos pasados y vocabulario de etapas vitales.',
  },
  {
    id: 'b1-jirai-ou-tu-iras',
    title: "J'irai où tu iras",
    artist: 'Céline Dion & Jean-Jacques Goldman',
    videoId: 'B3J9j-4Z8Q8',
    url: 'https://www.youtube.com/watch?v=B3J9j-4Z8Q8',
    level: 'B1',
    accent: 'CA',
    description: 'Dúo enérgico y dinámico con referencias geográficas norteamericanas y canadienses.',
    grammarFocus: 'Futuro simple regular e irregular (irai, feras, seras), oraciones de relativo con "où".',
  },
  {
    id: 'b1-1990',
    title: '1990',
    artist: 'Jean Leloup',
    videoId: 'c_K7U9k-6h0',
    url: 'https://www.youtube.com/watch?v=c_K7U9k-6h0',
    level: 'B1',
    accent: 'QC',
    description: 'Clásico festivo y desenfadado de Jean Leloup con juego rítmico y modismos francófonos auténticos.',
    grammarFocus: 'Conectores discursivos, frases idiomáticas informales y ritmo rápido.',
  },
  {
    id: 'b1-calvaire',
    title: 'Calvaire',
    artist: 'La Chicane',
    videoId: 'eM3t8z6PZf0',
    url: 'https://www.youtube.com/watch?v=eM3t8z6PZf0',
    level: 'B1',
    accent: 'QC',
    description: 'Rock quebequense cargado de sentimiento con entonación natural de la provincia de Québec.',
    grammarFocus: 'Oraciones condicionales de primer tipo y expresiones de lamento y causa.',
  },

  // NIVEL B2 (Avancé : dicción rápida, jerga québécoise, críticas sociales y poesía)
  {
    id: 'b2-la-rue-principale',
    title: 'La Rue Principale',
    artist: 'Les Colocs',
    videoId: '6J8O0c_n0yI',
    url: 'https://www.youtube.com/watch?v=6J8O0c_n0yI',
    level: 'B2',
    accent: 'QC',
    description: 'Himno legendario de Les Colocs. Ritmo veloz, crítica a la urbanización y jerga cotidiana québécoise.',
    grammarFocus: 'Joual y habla popular de Québec, elisiones fonéticas rápidas y sátira social.',
  },
  {
    id: 'b2-sil-suffisait-daimer',
    title: "S'il suffisait d'aimer",
    artist: 'Céline Dion',
    videoId: 'B2_U8r9v8V4',
    url: 'https://www.youtube.com/watch?v=B2_U8r9v8V4',
    level: 'B2',
    accent: 'CA',
    description: 'Balada con rica estructura subordinada, vocabulario humanista y amplio registro poético.',
    grammarFocus: 'Estructuras hipotéticas con "Si + imparfait → conditionnel présent".',
  },
  {
    id: 'b2-le-ptit-bonheur',
    title: "Le p'tit bonheur",
    artist: 'Félix Leclerc',
    videoId: 'a8Kk2S-d6i0',
    url: 'https://www.youtube.com/watch?v=a8Kk2S-d6i0',
    level: 'B2',
    accent: 'QC',
    description: 'El padre de la chanson québécoise. Poesía tradicional rica en metáforas campestres y cultura francocanadiense.',
    grammarFocus: 'Passé simple literario en contraste con passé composé, metáforas culturales.',
  },
  {
    id: 'b2-lindien',
    title: "L'Indien",
    artist: 'Robert Charlebois',
    videoId: 'h8U9m4c7o7M',
    url: 'https://www.youtube.com/watch?v=h8U9m4c7o7M',
    level: 'B2',
    accent: 'QC',
    description: 'Psicodelia y rock quebequense histórico con velocidad verbal, cadencia rítmica y alusiones culturales.',
    grammarFocus: 'Registro lírico complejo, expresiones compuestas y velocidad articulatoria.',
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
