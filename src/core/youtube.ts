/** Valida URLs de YouTube y extrae el ID del video (11 caracteres). No descarga nada. */
const ID = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTubeId(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(url.protocol)) return null;
  const host = url.hostname.replace(/^www\.|^m\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com' || host === 'music.youtube.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else {
      const m = url.pathname.match(/^\/(embed|shorts|live)\/([^/]+)/);
      if (m) id = m[2];
    }
  }
  return id && ID.test(id) ? id : null;
}
