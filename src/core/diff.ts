/** Comparación de escritura/dictado: normaliza puntuación y detecta omisiones, añadidos y ortografía. */
export type DiffKind = 'correct' | 'missing' | 'extra' | 'spelling' | 'case' | 'contraction';
export interface DiffItem { kind: DiffKind; expected?: string; actual?: string; tip?: string }
export interface DiffResult { items: DiffItem[]; accuracy: number; punctuationNotes: string[] }

const normQuotes = (s: string) => s.replace(/[’‘`]/g, "'");
export function tokenize(s: string): string[] {
  return normQuotes(s).replace(/[^A-Za-z0-9'\s-]/g, ' ').split(/\s+/).filter(Boolean);
}

function lev(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

export function compareText(reference: string, response: string): DiffResult {
  const r = tokenize(reference), a = tokenize(response);
  // LCS sobre palabras en minúsculas
  const L = r.map(() => Array(a.length + 1).fill(0)).concat([Array(a.length + 1).fill(0)]);
  for (let i = r.length - 1; i >= 0; i--)
    for (let j = a.length - 1; j >= 0; j--)
      L[i][j] = r[i].toLowerCase() === a[j].toLowerCase() ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const items: DiffItem[] = [];
  let i = 0, j = 0;
  const pendingR: string[] = [], pendingA: string[] = [];
  const flush = () => {
    // Empareja omisiones y añadidos próximos como errores ortográficos si son similares
    while (pendingR.length && pendingA.length) {
      const e = pendingR.shift()!, x = pendingA.shift()!;
      const close = lev(e.toLowerCase(), x.toLowerCase()) <= Math.max(1, Math.ceil(e.length / 3));
      if (close) {
        const contraction = e.includes("'") !== x.includes("'");
        items.push({
          kind: contraction ? 'contraction' : 'spelling', expected: e, actual: x,
          tip: contraction ? `Revisa el apóstrofo: «${e}».` : `Se escribe «${e}», no «${x}».`,
        });
      } else {
        items.push({ kind: 'missing', expected: e, tip: `Falta «${e}».` });
        items.push({ kind: 'extra', actual: x, tip: `«${x}» no estaba en la referencia.` });
      }
    }
    pendingR.splice(0).forEach((e) => items.push({ kind: 'missing', expected: e, tip: `Falta «${e}».` }));
    pendingA.splice(0).forEach((x) => items.push({ kind: 'extra', actual: x, tip: `«${x}» no estaba en la referencia.` }));
  };
  while (i < r.length || j < a.length) {
    if (i < r.length && j < a.length && r[i].toLowerCase() === a[j].toLowerCase()) {
      flush();
      if (r[i] !== a[j]) items.push({ kind: 'case', expected: r[i], actual: a[j], tip: `Mayúsculas: «${r[i]}».` });
      else items.push({ kind: 'correct', expected: r[i], actual: a[j] });
      i++; j++;
    } else if (j >= a.length || (i < r.length && L[i + 1][j] >= L[i][j + 1])) pendingR.push(r[i++]);
    else pendingA.push(a[j++]);
  }
  flush();
  const punctuationNotes: string[] = [];
  if (/[.!?]$/.test(reference.trim()) && !/[.!?]$/.test(response.trim())) punctuationNotes.push('Falta la puntuación final (no penaliza la precisión).');
  // 'case' cuenta como medio acierto; puntuación no penaliza
  const total = Math.max(r.length, 1);
  const pts = items.reduce((s, it) => s + (it.kind === 'correct' ? 1 : it.kind === 'case' ? 0.5 : 0), 0);
  return { items, accuracy: Math.min(1, pts / total), punctuationNotes };
}
