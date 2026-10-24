/**
 * Servicio cliente para obtener transcripciones de YouTube.
 * 1. Primero consulta la API del servidor (/api/transcript?v=...).
 * 2. Si no hay respuesta (p.ej. host estático puro), intenta servicios públicos espejo.
 * 3. En caso de no tener subtítulos generados por el autor del video, reporta claramente
 *    para permitir ingresar la letra manualmente sin bloquear la experiencia.
 */

export async function fetchYouTubeTranscript(videoId: string): Promise<{ ok: boolean; transcript: string; error?: string }> {
  if (!videoId || videoId.length !== 11) {
    return { ok: false, transcript: '', error: 'ID de video de YouTube inválido' };
  }

  // 1. Intentar endpoint del servidor local / preview / ngrok
  try {
    const res = await fetch(`/api/transcript?v=${encodeURIComponent(videoId)}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.transcript && data.transcript.trim().length > 0) {
        return { ok: true, transcript: data.transcript.trim() };
      }
      if (data.error) {
        return { ok: false, transcript: '', error: data.error };
      }
    }
  } catch {
    // Si falla la llamada local (p.ej. offline o ruta no montada), probar fallback
  }

  // 2. Fallback a instancias públicas Invidious
  const publicMirrors = [
    `https://inv.nadeko.net/api/v1/captions/${videoId}`,
    `https://yewtu.be/api/v1/captions/${videoId}`,
  ];

  for (const mirror of publicMirrors) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3500);
      const res = await fetch(mirror, { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        const enCap = (data.captions || []).find(
          (c: any) => (c.language_code || c.languageCode || '').startsWith('en')
        ) || (data.captions || [])[0];

        if (enCap && enCap.url) {
          const baseUrl = new URL(mirror).origin;
          const capRes = await fetch(`${baseUrl}${enCap.url}`);
          if (capRes.ok) {
            const vtt = await capRes.text();
            const text = vtt
              .replace(/WEBVTT[\s\S]*?\n\n/, '')
              .replace(/\d{2}:\d{2}[\s\S]*?-->[\s\S]*?\n/g, '')
              .replace(/<[^>]+>/g, '')
              .replace(/&amp;#39;|&#39;/g, "'")
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, '&')
              .split(/\r?\n/)
              .map((l) => l.trim())
              .filter(Boolean)
              .join('\n');
            if (text.length > 20) {
              return { ok: true, transcript: text };
            }
          }
        }
      }
    } catch {
      // Intentar siguiente espejo
    }
  }

  return {
    ok: false,
    transcript: '',
    error: 'No se encontraron subtítulos automáticos para este video en YouTube. Puedes pegar la letra abajo para extraer el vocabulario real.',
  };
}
