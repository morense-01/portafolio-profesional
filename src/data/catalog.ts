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
    videoId: 'AzaTyxMduH4',
    url: 'https://www.youtube.com/watch?v=AzaTyxMduH4',
    level: 'A1',
    accent: 'CA',
    description: 'La balada francófona más icónica de Céline Dion. Dicción lenta, articulación impecable y oraciones en presente.',
    grammarFocus: 'Presente de indicativo, pronombres reflexivos y oraciones de deseo con "pour que".',
  },
  {
    id: 'a1-comme-des-enfants',
    title: 'Comme des enfants',
    artist: 'Cœur de pirate',
    videoId: 'U-fU_V7Boic',
    url: 'https://www.youtube.com/watch?v=U-fU_V7Boic',
    level: 'A1',
    accent: 'QC',
    description: 'Pop québécois indie dulce y rítmico con vocabulario sencillo de sentimientos y relaciones cotidianas.',
    grammarFocus: 'Comparaciones con "comme", adjetivos básicos y presente simple.',
  },
  {
    id: 'a1-je-reviendrai-a-montreal',
    title: 'Je reviendrai à Montréal',
    artist: 'Robert Charlebois',
    videoId: '4oYhxqfrY5A',
    url: 'https://www.youtube.com/watch?v=4oYhxqfrY5A',
    level: 'A1',
    accent: 'CA',
    description: 'Clásico emotivo quebequense que rinde tributo a Montreal, ideal para entrenar el oído a la cadencia canadiense.',
    grammarFocus: 'Futuro simple regular (reviendrai) y vocabulario urbano de Québec.',
  },
  {
    id: 'a1-pour-un-instant',
    title: 'Pour un instant',
    artist: 'Harmonium',
    videoId: 'RkC9HgrRq3Q',
    url: 'https://www.youtube.com/watch?v=RkC9HgrRq3Q',
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
    videoId: '4j8DVTkZdCE',
    url: 'https://www.youtube.com/watch?v=4j8DVTkZdCE',
    level: 'A2',
    accent: 'CA',
    description: 'Balada contemporánea de Montreal. Canto íntimo y claro para practicar entonación y enlaces vocálicos.',
    grammarFocus: 'Verbos de movimiento en presente, pronombres de objeto directo e indirecto.',
  },
  {
    id: 'a2-seul',
    title: 'Seul',
    artist: 'Garou',
    videoId: 'R3jDPgpUN9k',
    url: 'https://www.youtube.com/watch?v=R3jDPgpUN9k',
    level: 'A2',
    accent: 'CA',
    description: 'Voz profunda y resonante del cantante quebequense Garou. Expresiones sobre la rutina y la soledad.',
    grammarFocus: 'Passé composé vs imparfait y adjetivos calificativos.',
  },
  {
    id: 'a2-toune-dautomne',
    title: "Toune d'automne",
    artist: 'Les Cowboys Fringants',
    videoId: 'boK-TEe2_sA',
    url: 'https://www.youtube.com/watch?v=boK-TEe2_sA',
    level: 'A2',
    accent: 'QC',
    description: 'Folk entrañable con palabras típicas quebequenses sobre el clima, las estaciones y la nostalgia.',
    grammarFocus: 'Léxico québécois (toune = canción), expresiones temporales y descripciones meteorológicas.',
  },
  {
    id: 'a2-rever-mieux',
    title: 'Rêver mieux',
    artist: 'Daniel Bélanger',
    videoId: 'j0wQ5snYyoo',
    url: 'https://www.youtube.com/watch?v=j0wQ5snYyoo',
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
    videoId: 'InCeVCGtHak',
    url: 'https://www.youtube.com/watch?v=InCeVCGtHak',
    level: 'B1',
    accent: 'QC',
    description: 'La canción más querida y emblemática de la música quebequense moderna. Reflexión profunda sobre la vida.',
    grammarFocus: 'Imparfait para relatar recuerdos pasados y vocabulario de etapas vitales.',
  },
  {
    id: 'b1-jirai-ou-tu-iras',
    title: "J'irai où tu iras",
    artist: 'Céline Dion & Jean-Jacques Goldman',
    videoId: '0J3wIDAaLSU',
    url: 'https://www.youtube.com/watch?v=0J3wIDAaLSU',
    level: 'B1',
    accent: 'CA',
    description: 'Dúo enérgico y dinámico con referencias geográficas norteamericanas y canadienses.',
    grammarFocus: 'Futuro simple regular e irregular (irai, feras, seras), oraciones de relativo con "où".',
  },
  {
    id: 'b1-1990',
    title: '1990',
    artist: 'Jean Leloup',
    videoId: 'VI3C6MROOvY',
    url: 'https://www.youtube.com/watch?v=VI3C6MROOvY',
    level: 'B1',
    accent: 'QC',
    description: 'Clásico festivo y desenfadado de Jean Leloup con juego rítmico y modismos francófonos auténticos.',
    grammarFocus: 'Conectores discursivos, frases idiomáticas informales y ritmo rápido.',
  },
  {
    id: 'b1-calvaire',
    title: 'Calvaire',
    artist: 'La Chicane',
    videoId: 'DqEaSVqQF1M',
    url: 'https://www.youtube.com/watch?v=DqEaSVqQF1M',
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
    videoId: 'UgPFUO76Kbo',
    url: 'https://www.youtube.com/watch?v=UgPFUO76Kbo',
    level: 'B2',
    accent: 'QC',
    description: 'Himno legendario de Les Colocs. Ritmo veloz, crítica a la urbanización y jerga cotidiana québécoise.',
    grammarFocus: 'Joual y habla popular de Québec, elisiones fonéticas rápidas y sátira social.',
  },
  {
    id: 'b2-sil-suffisait-daimer',
    title: "S'il suffisait d'aimer",
    artist: 'Céline Dion',
    videoId: '2vmHANYQcVw',
    url: 'https://www.youtube.com/watch?v=2vmHANYQcVw',
    level: 'B2',
    accent: 'CA',
    description: 'Balada con rica estructura subordinada, vocabulario humanista y amplio registro poético.',
    grammarFocus: 'Estructuras hipotéticas con "Si + imparfait → conditionnel présent".',
  },
  {
    id: 'b2-le-ptit-bonheur',
    title: "Le p'tit bonheur",
    artist: 'Félix Leclerc',
    videoId: 'IOmZ_pF_XFI',
    url: 'https://www.youtube.com/watch?v=IOmZ_pF_XFI',
    level: 'B2',
    accent: 'QC',
    description: 'El padre de la chanson québécoise. Poesía tradicional rica en metáforas campestres y cultura francocanadiense.',
    grammarFocus: 'Passé simple literario en contraste con passé composé, metáforas culturales.',
  },
  {
    id: 'b2-lindberg',
    title: 'Lindberg',
    artist: 'Robert Charlebois',
    videoId: 'AtYcPgLXzG8',
    url: 'https://www.youtube.com/watch?v=AtYcPgLXzG8',
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
