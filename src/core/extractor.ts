/**
 * Extractor de vocabulario y frases reales a partir de transcripciones de YouTube.
 * Garantiza que NUNCA se inventen palabras ni frases de ejemplo:
 * todas las palabras, oraciones de dictado y de pronunciación provienen
 * directamente del texto del video seleccionado.
 */

export interface ExtractedWord {
  term: string;
  meaning: string;
  pronunciation: string;
  partOfSpeech: string;
  level: string;
  example: string;
  translation: string;
  origin: 'extracted';
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'so', 'as', 'of', 'at', 'by', 'for', 'with', 'about',
  'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from',
  'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'than', 'too', 'very', 's', 't', 'can',
  'will', 'just', 'don', 'should', 'now', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves',
  'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
  'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which',
  'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'would', 'could', 'shall',
  'might', 'must', 'oh', 'yeah', 'ooh', 'la', 'na', 'ba', 'hey', 'ah', 'uh', 'um', 'whoa', 'baby',
  'gotta', 'gonna', 'wanna', 'im', 'ive', 'youre', 'cant', 'dont', 'wont', 'ill', 'cause', 'cos',
]);

const VOCAB_LEXICON: Record<string, { meaning: string; pronunciation: string; partOfSpeech: string; level: string }> = {
  succeed: { meaning: 'tener éxito / lograr', pronunciation: '/səkˈsiːd/', partOfSpeech: 'verb', level: 'B1' },
  replace: { meaning: 'reemplazar / sustituir', pronunciation: '/rɪˈpleɪs/', partOfSpeech: 'verb', level: 'A2' },
  stream: { meaning: 'fluir / correr (agua, lágrimas)', pronunciation: '/striːm/', partOfSpeech: 'verb', level: 'B1' },
  streaming: { meaning: 'fluyendo / corriendo', pronunciation: '/ˈstriːmɪŋ/', partOfSpeech: 'verb', level: 'B1' },
  tears: { meaning: 'lágrimas', pronunciation: '/tɪəz/', partOfSpeech: 'noun', level: 'A2' },
  waste: { meaning: 'desperdiciar / malgastar', pronunciation: '/weɪst/', partOfSpeech: 'verb', level: 'B1' },
  reverse: { meaning: 'marcha atrás / retroceso', pronunciation: '/rɪˈvɜːs/', partOfSpeech: 'noun/verb', level: 'B1' },
  ignite: { meaning: 'encender / prender fuego', pronunciation: '/ɪɡˈnaɪt/', partOfSpeech: 'verb', level: 'B2' },
  guide: { meaning: 'guiar / orientar', pronunciation: '/ɡaɪd/', partOfSpeech: 'verb', level: 'A2' },
  shine: { meaning: 'brillar', pronunciation: '/ʃaɪn/', partOfSpeech: 'verb', level: 'A2' },
  shadow: { meaning: 'sombra', pronunciation: '/ˈʃædəʊ/', partOfSpeech: 'noun', level: 'B1' },
  bleed: { meaning: 'sangrar', pronunciation: '/bliːd/', partOfSpeech: 'verb', level: 'B1' },
  heal: { meaning: 'curar / sanar', pronunciation: '/hiːl/', partOfSpeech: 'verb', level: 'B1' },
  breath: { meaning: 'respiración / aliento', pronunciation: '/breθ/', partOfSpeech: 'noun', level: 'A2' },
  breathe: { meaning: 'respirar', pronunciation: '/briːð/', partOfSpeech: 'verb', level: 'A2' },
  wonder: { meaning: 'preguntarse / maravillarse', pronunciation: '/ˈwʌndə/', partOfSpeech: 'verb', level: 'B1' },
  whisper: { meaning: 'susurrar', pronunciation: '/ˈwɪspə/', partOfSpeech: 'verb', level: 'B1' },
  scream: { meaning: 'gritar', pronunciation: '/skriːm/', partOfSpeech: 'verb', level: 'A2' },
  shiver: { meaning: 'temblar / escalofrío', pronunciation: '/ˈʃɪvə/', partOfSpeech: 'verb/noun', level: 'B2' },
  promise: { meaning: 'prometer / promesa', pronunciation: '/ˈprɒmɪs/', partOfSpeech: 'noun/verb', level: 'A2' },
  struggle: { meaning: 'luchar / esfuerzo', pronunciation: '/ˈstrʌɡl/', partOfSpeech: 'verb/noun', level: 'B2' },
  remember: { meaning: 'recordar', pronunciation: '/rɪˈmembə/', partOfSpeech: 'verb', level: 'A1' },
  forget: { meaning: 'olvidar', pronunciation: '/fəˈɡet/', partOfSpeech: 'verb', level: 'A1' },
  forgive: { meaning: 'perdonar', pronunciation: '/fəˈɡɪv/', partOfSpeech: 'verb', level: 'B1' },
  belong: { meaning: 'pertenecer', pronunciation: '/bɪˈlɒŋ/', partOfSpeech: 'verb', level: 'A2' },
  escape: { meaning: 'escapar / huida', pronunciation: '/ɪˈskeɪp/', partOfSpeech: 'verb/noun', level: 'B1' },
  survive: { meaning: 'sobrevivir', pronunciation: '/səˈvaɪv/', partOfSpeech: 'verb', level: 'B1' },
  drown: { meaning: 'ahogarse / hundirse', pronunciation: '/draʊn/', partOfSpeech: 'verb', level: 'B2' },
  fly: { meaning: 'volar', pronunciation: '/flaɪ/', partOfSpeech: 'verb', level: 'A1' },
  hide: { meaning: 'esconder / ocultar', pronunciation: '/haɪd/', partOfSpeech: 'verb', level: 'A2' },
  seek: { meaning: 'buscar / perseguir', pronunciation: '/siːk/', partOfSpeech: 'verb', level: 'B2' },
  hope: { meaning: 'esperanza / esperar', pronunciation: '/həʊp/', partOfSpeech: 'noun/verb', level: 'A1' },
  fear: { meaning: 'miedo / temer', pronunciation: '/fɪə/', partOfSpeech: 'noun/verb', level: 'B1' },
  brave: { meaning: 'valiente', pronunciation: '/breɪv/', partOfSpeech: 'adjective', level: 'A2' },
  gentle: { meaning: 'suave / tierno', pronunciation: '/ˈdʒentl/', partOfSpeech: 'adjective', level: 'B1' },
  wild: { meaning: 'salvaje / libre', pronunciation: '/waɪld/', partOfSpeech: 'adjective', level: 'B1' },
  silent: { meaning: 'silencioso / callado', pronunciation: '/ˈsaɪlənt/', partOfSpeech: 'adjective', level: 'B1' },
  silence: { meaning: 'silencio', pronunciation: '/ˈsaɪləns/', partOfSpeech: 'noun', level: 'A2' },
  lonely: { meaning: 'solitario / solo', pronunciation: '/ˈləʊnli/', partOfSpeech: 'adjective', level: 'A2' },
  heavy: { meaning: 'pesado / intenso', pronunciation: '/ˈhevi/', partOfSpeech: 'adjective', level: 'A2' },
  empty: { meaning: 'vacío', pronunciation: '/ˈempti/', partOfSpeech: 'adjective', level: 'A2' },
  broken: { meaning: 'roto / quebrado', pronunciation: '/ˈbrəʊkən/', partOfSpeech: 'adjective', level: 'A2' },
  worth: { meaning: 'que vale la pena / valor', pronunciation: '/wɜːθ/', partOfSpeech: 'adjective/noun', level: 'B1' },
  journey: { meaning: 'viaje / trayecto', pronunciation: '/ˈdʒɜːni/', partOfSpeech: 'noun', level: 'B1' },
  destiny: { meaning: 'destino', pronunciation: '/ˈdestɪni/', partOfSpeech: 'noun', level: 'B2' },
  forever: { meaning: 'para siempre', pronunciation: '/fərˈevə/', partOfSpeech: 'adverb', level: 'A2' },
  together: { meaning: 'juntos', pronunciation: '/təˈɡeðə/', partOfSpeech: 'adverb', level: 'A1' },
  somewhere: { meaning: 'en algún lugar', pronunciation: '/ˈsʌmweə/', partOfSpeech: 'adverb', level: 'A2' },
  faith: { meaning: 'fe / confianza', pronunciation: '/feɪθ/', partOfSpeech: 'noun', level: 'B1' },
  truth: { meaning: 'verdad', pronunciation: '/truːθ/', partOfSpeech: 'noun', level: 'A2' },
  freedom: { meaning: 'libertad', pronunciation: '/ˈfriːdəm/', partOfSpeech: 'noun', level: 'B1' },
  flame: { meaning: 'llama / fuego', pronunciation: '/fleɪm/', partOfSpeech: 'noun', level: 'B1' },
  storm: { meaning: 'tormenta', pronunciation: '/stɔːm/', partOfSpeech: 'noun', level: 'A2' },
  ocean: { meaning: 'océano', pronunciation: '/ˈəʊʃn/', partOfSpeech: 'noun', level: 'A2' },
  river: { meaning: 'río', pronunciation: '/ˈrɪvə/', partOfSpeech: 'noun', level: 'A1' },
  bridge: { meaning: 'puente', pronunciation: '/brɪdʒ/', partOfSpeech: 'noun', level: 'A2' },
  dream: { meaning: 'soñar / sueño', pronunciation: '/driːm/', partOfSpeech: 'noun/verb', level: 'A1' },
  chase: { meaning: 'perseguir', pronunciation: '/tʃeɪs/', partOfSpeech: 'verb', level: 'B1' },
  hold: { meaning: 'sostener / abrazar', pronunciation: '/həʊld/', partOfSpeech: 'verb', level: 'A2' },
  stuck: { meaning: 'atrapado / atascado', pronunciation: '/stʌk/', partOfSpeech: 'adjective', level: 'B1' },
  tired: { meaning: 'cansado', pronunciation: '/ˈtaɪəd/', partOfSpeech: 'adjective', level: 'A1' },
  lose: { meaning: 'perder', pronunciation: '/luːz/', partOfSpeech: 'verb', level: 'A1' },
  find: { meaning: 'encontrar', pronunciation: '/faɪnd/', partOfSpeech: 'verb', level: 'A1' },
  try: { meaning: 'intentar / probar', pronunciation: '/traɪ/', partOfSpeech: 'verb', level: 'A1' },
  leave: { meaning: 'dejar / marcharse', pronunciation: '/liːv/', partOfSpeech: 'verb', level: 'A1' },
  stay: { meaning: 'quedarse / permanecer', pronunciation: '/steɪ/', partOfSpeech: 'verb', level: 'A1' },
  hear: { meaning: 'escuchar / oír', pronunciation: '/hɪə/', partOfSpeech: 'verb', level: 'A1' },
  listen: { meaning: 'escuchar atentamente', pronunciation: '/ˈlɪsn/', partOfSpeech: 'verb', level: 'A1' },
  lights: { meaning: 'luces', pronunciation: '/laɪts/', partOfSpeech: 'noun', level: 'A1' },
  bones: { meaning: 'huesos', pronunciation: '/bəʊnz/', partOfSpeech: 'noun', level: 'A2' },
  settled: { meaning: 'asentado / establecido', pronunciation: '/ˈsetld/', partOfSpeech: 'adjective/verb', level: 'B2' },
  glory: { meaning: 'gloria', pronunciation: '/ˈɡlɔːri/', partOfSpeech: 'noun', level: 'B1' },
  bittersweet: { meaning: 'agridulce', pronunciation: '/ˌbɪtəˈswiːt/', partOfSpeech: 'adjective', level: 'B2' },
  beg: { meaning: 'rogar / suplicar', pronunciation: '/beɡ/', partOfSpeech: 'verb', level: 'B1' },
  haze: { meaning: 'neblina / confusión', pronunciation: '/heɪz/', partOfSpeech: 'noun', level: 'B2' },
  remind: { meaning: 'recordar (hacer que alguien recuerde)', pronunciation: '/rɪˈmaɪnd/', partOfSpeech: 'verb', level: 'B1' },
  over: { meaning: 'terminado / por encima', pronunciation: '/ˈəʊvə/', partOfSpeech: 'preposition/adverb', level: 'A1' },
};

/** Limpia y divide el texto de la canción en líneas o versos limpios. */
export function extractLines(transcript: string): string[] {
  if (!transcript || typeof transcript !== 'string') return [];
  return transcript
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^♪+\s*|\s*♪+$/g, '').trim())
    .filter((l) => l.length > 0 && !/^\[.*?\]$/.test(l));
}

/**
 * Extrae vocabulario real presente en el texto de la canción.
 * Asocia cada término con el verso exacto donde aparece en la canción.
 */
export function extractVocabularyFromTranscript(transcript: string, maxItems: number = 8): ExtractedWord[] {
  const lines = extractLines(transcript);
  if (lines.length === 0) return [];

  const wordMap = new Map<string, { term: string; count: number; firstLine: string }>();

  for (const line of lines) {
    const rawTokens = line.toLowerCase().replace(/[^a-z'’\s-]/g, ' ').split(/\s+/).filter(Boolean);
    for (let token of rawTokens) {
      token = token.replace(/^['’]+|['’]+$/g, '');
      if (token.length < 3 || STOP_WORDS.has(token)) continue;

      if (!wordMap.has(token)) {
        wordMap.set(token, { term: token, count: 1, firstLine: line });
      } else {
        wordMap.get(token)!.count++;
      }
    }
  }

  // Ordenar priorizando palabras reconocidas en el léxico pedagógico y frecuencia en la canción
  const candidates = Array.from(wordMap.values()).sort((a, b) => {
    const aKnown = VOCAB_LEXICON[a.term] ? 10 : 0;
    const bKnown = VOCAB_LEXICON[b.term] ? 10 : 0;
    return (bKnown + b.count) - (aKnown + a.count);
  });

  const selected = candidates.slice(0, maxItems);

  return selected.map((item) => {
    const lex = VOCAB_LEXICON[item.term];
    const meaning = lex ? lex.meaning : `(palabra del video: «${item.term}»)`;
    const pronunciation = lex ? lex.pronunciation : `/${item.term}/`;
    const partOfSpeech = lex ? lex.partOfSpeech : 'palabra clave';
    const level = lex ? lex.level : 'B1';

    return {
      term: item.term,
      meaning,
      pronunciation,
      partOfSpeech,
      level,
      example: item.firstLine,
      translation: `Aparece en el video: «${item.firstLine}»`,
      origin: 'extracted' as const,
    };
  });
}

/**
 * Extrae oraciones reales del video ideales para ejercicios de dictado (Writing).
 * Filtra líneas de 4 a 12 palabras sin caracteres extraños ni corchetes.
 */
export function extractDictationLines(transcript: string, fallback: string[] = []): string[] {
  const lines = extractLines(transcript);
  const goodLines = lines.filter((line) => {
    const words = line.split(/\s+/).filter(Boolean);
    return words.length >= 4 && words.length <= 12 && !/[\[\]♪]/.test(line);
  });

  if (goodLines.length > 0) {
    // Tomar hasta 5 líneas únicas del video
    return Array.from(new Set(goodLines)).slice(0, 5);
  }
  return fallback;
}

/**
 * Extrae frases reales del video para practicar pronunciación (Speaking).
 */
export function extractSpeakingLines(transcript: string, fallback: string[] = []): string[] {
  const lines = extractLines(transcript);
  const candidates = lines.filter((line) => {
    const words = line.split(/\s+/).filter(Boolean);
    return words.length >= 3 && words.length <= 10;
  });

  if (candidates.length > 0) {
    return Array.from(new Set(candidates)).slice(0, 4);
  }
  return fallback;
}
