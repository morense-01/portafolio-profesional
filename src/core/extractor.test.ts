import { describe, it, expect } from 'vitest';
import {
  extractVocabularyFromTranscript,
  extractDictationLines,
  extractSpeakingLines,
  extractNotebookLines,
  formatProseForWriting,
} from './extractor';

describe('extractor', () => {
  const sampleTranscript = `
When you try your best, but you don't succeed
When you get what you want, but not what you need
When you feel so tired, but you can't sleep
Stuck in reverse
And the tears come streaming down your face
When you lose something you can't replace
When you love someone, but it goes to waste
Could it be worse?
Lights will guide you home
And ignite your bones
And I will try to fix you
`;

  it('extrae vocabulario real del texto sin inventar palabras ajenas', () => {
    const vocab = extractVocabularyFromTranscript(sampleTranscript, 10);
    expect(vocab.length).toBeGreaterThanOrEqual(6);
    const terms = vocab.map((v) => v.term);
    expect(terms).toContain('succeed');
    expect(terms).toContain('tears');
    expect(terms).toContain('replace');

    // Cada palabra debe tener como ejemplo el verso exacto donde aparece
    const succeedWord = vocab.find((v) => v.term === 'succeed')!;
    expect(succeedWord.example).toContain("you don't succeed");
    expect(succeedWord.origin).toBe('extracted');
  });

  it('extrae líneas de dictado directamente de las estrofas del video', () => {
    const dictations = extractDictationLines(sampleTranscript);
    expect(dictations.length).toBeGreaterThan(0);
    expect(dictations[0]).toBe("When you try your best, but you don't succeed");
  });

  it('extrae frases de speaking directamente de las estrofas del video', () => {
    const speaking = extractSpeakingLines(sampleTranscript);
    expect(speaking.length).toBeGreaterThan(0);
    expect(speaking.some((s) => s.includes('Lights will guide you home') || s.includes('Stuck in reverse'))).toBe(true);
  });

  it('extrae líneas para cuaderno físico de notas', () => {
    const notebook = extractNotebookLines(sampleTranscript, 5);
    expect(notebook.length).toBe(5);
    expect(notebook[0]).toContain('When you try your best');
  });

  it('formatea el texto de la canción en prosa y oraciones completas con sentido gramatical', () => {
    const prose = formatProseForWriting(sampleTranscript);
    expect(prose.sentences.length).toBeGreaterThan(0);
    // Cada oración debe terminar en punto, signo de interrogación o exclamación
    expect(prose.sentences.every((s) => /[.?!]$/.test(s.sentence))).toBe(true);
    // Debe tener párrafos legibles
    expect(prose.paragraphs.length).toBeGreaterThan(0);
    expect(typeof prose.fullProse).toBe('string');
  });

  it('devuelve array vacío de forma segura si la transcripción está vacía', () => {
    expect(extractVocabularyFromTranscript('')).toEqual([]);
    expect(extractDictationLines('', ['fallback'])).toEqual(['fallback']);
  });
});
