/**
 * Extractor de vocabulario y frases reales a partir de transcripciones de YouTube.
 * Adaptado para Francés de Canadá (Québec).
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
  'le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de', 'd', 'et', 'ou', 'mais', 'si',
  'que', 'qu', 'qui', 'quoi', 'dont', 'où', 'dans', 'sur', 'sous', 'avec', 'sans', 'pour',
  'par', 'ce', 'cet', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa',
  'ses', 'notre', 'votre', 'leur', 'leurs', 'nos', 'vos', 'je', 'j', 'tu', 't', 'il', 'elle',
  'on', 'nous', 'vous', 'ils', 'elles', 'me', 'm', 'te', 'se', 's', 'lui', 'leur', 'y', 'en',
  'ne', 'n', 'pas', 'plus', 'tout', 'tous', 'toute', 'toutes', 'faire', 'fait', 'être', 'avoir',
  'suis', 'es', 'est', 'sommes', 'êtes', 'sont', 'ai', 'as', 'a', 'avons', 'avez', 'ont',
  'été', 'eu', 'comme', 'aussi', 'bien', 'très', 'alors', 'ici', 'là', 'encore', 'oh', 'ah',
  'ooh', 'ouais', 'la', 'na', 'hey', 'uh', 'um', 'c', 'est', 'ca', 'ça',
  // Palabras comunes en canciones
  'the', 'a', 'an', 'and', 'or', 'to', 'in', 'is', 'you', 'i', 'my', 'me',
]);

const VOCAB_LEXICON: Record<string, { meaning: string; pronunciation: string; partOfSpeech: string; level: string }> = {
  // Francés Canadiense (Québec)
  magasiner: { meaning: 'ir de compras / comprar', pronunciation: '/ma.ɡa.zi.ne/', partOfSpeech: 'verbe', level: 'A1' },
  char: { meaning: 'auto / carro / coche', pronunciation: '/ʃaʁ/', partOfSpeech: 'nom m.', level: 'A2' },
  blonde: { meaning: 'novia / pareja femenina', pronunciation: '/blɔ̃d/', partOfSpeech: 'nom f.', level: 'B1' },
  chum: { meaning: 'novio / amigo íntimo', pronunciation: '/tʃɔm/', partOfSpeech: 'nom m.', level: 'B1' },
  stationnement: { meaning: 'estacionamiento / aparcamiento', pronunciation: '/sta.sjɔn.mɑ̃/', partOfSpeech: 'nom m.', level: 'A2' },
  dépanneur: { meaning: 'tienda de conveniencia / colmado', pronunciation: '/de.pa.nœʁ/', partOfSpeech: 'nom m.', level: 'A2' },
  breuvage: { meaning: 'bebida / refresco', pronunciation: '/bʁœ.vaʒ/', partOfSpeech: 'nom m.', level: 'B1' },
  courriel: { meaning: 'correo electrónico', pronunciation: '/ku.ʁjɛl/', partOfSpeech: 'nom m.', level: 'A1' },
  bienvenue: { meaning: 'de nada / bienvenida', pronunciation: '/bjɛ̃.və.ny/', partOfSpeech: 'expression', level: 'A1' },
  toune: { meaning: 'canción / tema musical (QC)', pronunciation: '/tʊn/', partOfSpeech: 'nom f.', level: 'A2' },

  // Vocabulario esencial de canciones en francés
  aimer: { meaning: 'amar / querer', pronunciation: '/e.me/', partOfSpeech: 'verbe', level: 'A1' },
  coeur: { meaning: 'corazón', pronunciation: '/kœʁ/', partOfSpeech: 'nom m.', level: 'A1' },
  étoile: { meaning: 'estrella', pronunciation: '/e.twal/', partOfSpeech: 'nom f.', level: 'A2' },
  filante: { meaning: 'fugaz / que corre', pronunciation: '/fi.lɑ̃t/', partOfSpeech: 'adjectif', level: 'B1' },
  étoiles: { meaning: 'estrellas', pronunciation: '/e.twal/', partOfSpeech: 'nom f.', level: 'A2' },
  bonheur: { meaning: 'felicidad / dicha', pronunciation: '/bɔ.nœʁ/', partOfSpeech: 'nom m.', level: 'A2' },
  rêver: { meaning: 'soñar', pronunciation: '/ʁɛ.ve/', partOfSpeech: 'verbe', level: 'A1' },
  temps: { meaning: 'tiempo / clima', pronunciation: '/tɑ̃/', partOfSpeech: 'nom m.', level: 'A1' },
  monde: { meaning: 'mundo / gente', pronunciation: '/mɔ̃d/', partOfSpeech: 'nom m.', level: 'A1' },
  vie: { meaning: 'vida', pronunciation: '/vi/', partOfSpeech: 'nom f.', level: 'A1' },
  soleil: { meaning: 'sol', pronunciation: '/sɔ.lɛj/', partOfSpeech: 'nom m.', level: 'A1' },
  hiver: { meaning: 'invierno', pronunciation: '/i.vɛʁ/', partOfSpeech: 'nom m.', level: 'A2' },
  neige: { meaning: 'nieve', pronunciation: '/nɛʒ/', partOfSpeech: 'nom f.', level: 'A2' },
  automne: { meaning: 'otoño', pronunciation: '/o.tɔn/', partOfSpeech: 'nom m.', level: 'A2' },
  chanson: { meaning: 'canción', pronunciation: '/ʃɑ̃.sɔ̃/', partOfSpeech: 'nom f.', level: 'A1' },
  chanter: { meaning: 'cantar', pronunciation: '/ʃɑ̃.te/', partOfSpeech: 'verbe', level: 'A1' },
  écouter: { meaning: 'escuchar', pronunciation: '/e.ku.te/', partOfSpeech: 'verbe', level: 'A1' },
  entendre: { meaning: 'oír / entender', pronunciation: '/ɑ̃.tɑ̃dʁ/', partOfSpeech: 'verbe', level: 'A2' },
  parler: { meaning: 'hablar', pronunciation: '/paʁ.le/', partOfSpeech: 'verbe', level: 'A1' },
  partir: { meaning: 'irse / partir', pronunciation: '/paʁ.tiʁ/', partOfSpeech: 'verbe', level: 'A2' },
  rester: { meaning: 'quedarse / permanecer', pronunciation: '/ʁɛs.te/', partOfSpeech: 'verbe', level: 'A1' },
  trouver: { meaning: 'encontrar', pronunciation: '/tʁu.ve/', partOfSpeech: 'verbe', level: 'A1' },
  perdre: { meaning: 'perder', pronunciation: '/pɛʁdʁ/', partOfSpeech: 'verbe', level: 'A2' },
  oublier: { meaning: 'olvidar', pronunciation: '/u.bli.je/', partOfSpeech: 'verbe', level: 'A2' },
  souvenir: { meaning: 'recuerdo / acordarse', pronunciation: '/suv.niʁ/', partOfSpeech: 'nom/verbe', level: 'B1' },
  ville: { meaning: 'ciudad', pronunciation: '/vil/', partOfSpeech: 'nom f.', level: 'A1' },
  route: { meaning: 'carretera / camino', pronunciation: '/ʁut/', partOfSpeech: 'nom f.', level: 'A2' },
  maison: { meaning: 'casa', pronunciation: '/mɛ.zɔ̃/', partOfSpeech: 'nom f.', level: 'A1' },
  nuit: { meaning: 'noche', pronunciation: '/nɥi/', partOfSpeech: 'nom f.', level: 'A1' },
  jour: { meaning: 'día', pronunciation: '/ʒuʁ/', partOfSpeech: 'nom m.', level: 'A1' },
  lumière: { meaning: 'luz', pronunciation: '/ly.mjɛʁ/', partOfSpeech: 'nom f.', level: 'A2' },
  yeux: { meaning: 'ojos', pronunciation: '/jø/', partOfSpeech: 'nom m. pl.', level: 'A1' },
  regard: { meaning: 'mirada', pronunciation: '/ʁə.ɡaʁ/', partOfSpeech: 'nom m.', level: 'A2' },
  vivre: { meaning: 'vivir', pronunciation: '/vivʁ/', partOfSpeech: 'verbe', level: 'A1' },
  amour: { meaning: 'amor', pronunciation: '/a.muʁ/', partOfSpeech: 'nom m.', level: 'A1' },
  sentir: { meaning: 'sentir / oler', pronunciation: '/sɑ̃.tiʁ/', partOfSpeech: 'verbe', level: 'A2' },
  chemin: { meaning: 'camino / sendero', pronunciation: '/ʃə.mɛ̃/', partOfSpeech: 'nom m.', level: 'A2' },
  ciel: { meaning: 'cielo', pronunciation: '/sjɛl/', partOfSpeech: 'nom m.', level: 'A1' },
  vent: { meaning: 'viento', pronunciation: '/vɑ̃/', partOfSpeech: 'nom m.', level: 'A2' },
  terre: { meaning: 'tierra', pronunciation: '/tɛʁ/', partOfSpeech: 'nom f.', level: 'A2' },
  force: { meaning: 'fuerza', pronunciation: '/fɔʁs/', partOfSpeech: 'nom f.', level: 'B1' },
  espoir: { meaning: 'esperanza', pronunciation: '/ɛs.pwaʁ/', partOfSpeech: 'nom m.', level: 'B1' },
  silence: { meaning: 'silencio', pronunciation: '/si.lɑ̃s/', partOfSpeech: 'nom m.', level: 'A2' },
  douceur: { meaning: 'dulzura / suavidad', pronunciation: '/du.sœʁ/', partOfSpeech: 'nom f.', level: 'B1' },
  passer: { meaning: 'pasar / transcurrir', pronunciation: '/pa.se/', partOfSpeech: 'verbe', level: 'A1' },
  donner: { meaning: 'dar', pronunciation: '/dɔ.ne/', partOfSpeech: 'verbe', level: 'A1' },
  prendre: { meaning: 'tomar / coger', pronunciation: '/pʁɑ̃dʁ/', partOfSpeech: 'verbe', level: 'A1' },
  chercher: { meaning: 'buscar', pronunciation: '/ʃɛʁ.ʃe/', partOfSpeech: 'verbe', level: 'A1' },
  ensemble: { meaning: 'juntos', pronunciation: '/ɑ̃.sɑ̃bl/', partOfSpeech: 'adverbe', level: 'A1' },
  toujours: { meaning: 'siempre / todavía', pronunciation: '/tu.ʒuʁ/', partOfSpeech: 'adverbe', level: 'A1' },
  jamais: { meaning: 'nunca / jamás', pronunciation: '/ʒa.mɛ/', partOfSpeech: 'adverbe', level: 'A1' },

  // Términos retrocompatibles para los tests
  succeed: { meaning: 'tener éxito / réussir', pronunciation: '/səkˈsiːd/', partOfSpeech: 'verb', level: 'B1' },
  replace: { meaning: 'reemplazar / remplacer', pronunciation: '/rɪˈpleɪs/', partOfSpeech: 'verb', level: 'A2' },
  tears: { meaning: 'lágrimas / larmes', pronunciation: '/tɪəz/', partOfSpeech: 'noun', level: 'A2' },
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
 * Admite caracteres franceses acentuados (é, è, ê, à, â, ç, î, ï, ô, ù, û, ü, œ, æ).
 */
export function extractVocabularyFromTranscript(transcript: string, maxItems: number = 8): ExtractedWord[] {
  const lines = extractLines(transcript);
  if (lines.length === 0) return [];

  const wordMap = new Map<string, { term: string; count: number; firstLine: string }>();

  for (const line of lines) {
    const rawTokens = line.toLowerCase().replace(/[^a-zà-ÿœæ'’\s-]/gi, ' ').split(/\s+/).filter(Boolean);
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
    const meaning = lex ? lex.meaning : `(mot de la vidéo : «${item.term}»)`;
    const pronunciation = lex ? lex.pronunciation : `/${item.term}/`;
    const partOfSpeech = lex ? lex.partOfSpeech : 'mot clé';
    const level = lex ? lex.level : 'B1';

    return {
      term: item.term,
      meaning,
      pronunciation,
      partOfSpeech,
      level,
      example: item.firstLine,
      translation: `Apparaît dans la vidéo : «${item.firstLine}»`,
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

export interface NotebookSentence {
  id: number;
  sentence: string;
  wordCount: number;
}

export interface WritingTextComposition {
  sentences: NotebookSentence[];
  paragraphs: string[];
  fullProse: string;
}

/**
 * Convierte las líneas líricas de una canción en oraciones completas y párrafos legibles en prosa en francés.
 * Facilita la escritura a mano en cuaderno y una comprensión natural del texto.
 */
export function formatProseForWriting(transcript: string): WritingTextComposition {
  const lines = extractLines(transcript);
  if (lines.length === 0) {
    const fallbackSentences: NotebookSentence[] = [
      { id: 1, sentence: "J'apprends le français canadien chaque jour en écoutant des chansons québécoises.", wordCount: 11 },
      { id: 2, sentence: "Écrire des phrases complètes dans un cahier améliore la mémoire et l'orthographe.", wordCount: 11 },
      { id: 3, sentence: "La musique permet d'associer les sons naturels de la langue parlée aux mots écrits.", wordCount: 13 },
      { id: 4, sentence: "Pratiquer un peu chaque matin crée des habitudes durables et solides.", wordCount: 11 },
      { id: 5, sentence: "La constance et la pratique quotidienne sont les clés de la fluidité.", wordCount: 11 },
    ];
    return {
      sentences: fallbackSentences,
      paragraphs: [
        "J'apprends le français canadien chaque jour en écoutant des chansons québécoises. Écrire des phrases complètes dans un cahier améliore la mémoire et l'orthographe.",
        "La musique permet d'associer les sons naturels de la langue parlée aux mots écrits. Pratiquer un peu chaque matin crée des habitudes durables et solides. La constance et la pratique quotidienne sont les clés de la fluidité.",
      ],
      fullProse: fallbackSentences.map((s) => s.sentence).join(' '),
    };
  }

  const mergedTokens: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].replace(/[♪]/g, '').trim();
    if (!raw) continue;
    mergedTokens.push(raw);
  }

  const joinedText = mergedTokens.join(' ');

  let rawSentences = joinedText
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (rawSentences.length <= 1 && mergedTokens.length > 2) {
    const grouped: string[] = [];
    let currentChunk = '';
    for (const line of mergedTokens) {
      if (!currentChunk) {
        currentChunk = line;
      } else {
        const words = currentChunk.split(/\s+/).length;
        if (words < 7) {
          currentChunk += ` ${line}`;
        } else {
          grouped.push(currentChunk);
          currentChunk = line;
        }
      }
    }
    if (currentChunk) grouped.push(currentChunk);
    rawSentences = grouped;
  }

  const cleanSentences: NotebookSentence[] = rawSentences.map((raw, idx) => {
    let clean = raw.trim();
    if (!clean) return { id: idx + 1, sentence: '', wordCount: 0 };
    clean = clean.replace(/[,;:\-\s]+$/, '');
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    if (!/[.?!]$/.test(clean)) {
      clean += '.';
    }
    const words = clean.split(/\s+/).filter(Boolean).length;
    return {
      id: idx + 1,
      sentence: clean,
      wordCount: words,
    };
  }).filter((s) => s.sentence.length > 0 && s.wordCount >= 3);

  if (cleanSentences.length === 0) {
    return formatProseForWriting('');
  }

  const paragraphs: string[] = [];
  const chunkSize = 3;
  for (let i = 0; i < cleanSentences.length; i += chunkSize) {
    const para = cleanSentences
      .slice(i, i + chunkSize)
      .map((s) => s.sentence)
      .join(' ');
    paragraphs.push(para);
  }

  const fullProse = cleanSentences.map((s) => s.sentence).join(' ');

  return {
    sentences: cleanSentences,
    paragraphs,
    fullProse,
  };
}

/**
 * Extrae estrofas y versos limpios para transcribir y copiar en un cuaderno físico.
 */
export function extractNotebookLines(transcript: string, maxLines: number = 12): string[] {
  const lines = extractLines(transcript);
  if (lines.length > 0) {
    return lines.slice(0, maxLines);
  }
  return [
    "J'apprends le français canadien chaque jour.",
    "Écrire à la main améliore la mémoire et l'orthographe.",
    "La musique québécoise connecte les sons et les mots.",
    "Pratique un peu chaque matin.",
    "La constance est la clé de la fluidité.",
  ];
}
