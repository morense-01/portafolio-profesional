import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

function youtubeTranscriptPlugin() {
  const handler = async (req: any, res: any, next: any) => {
    const rawUrl = req.url || '';
    if (!rawUrl.startsWith('/api/transcript')) {
      return next();
    }
    const parsed = new URL(rawUrl, 'http://localhost');
    const v = parsed.searchParams.get('v');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      res.end();
      return;
    }

    if (!v) {
      res.statusCode = 400;
      res.end(JSON.stringify({ ok: false, error: 'Falta el parámetro v (ID de video)' }));
      return;
    }

    try {
      const { YoutubeTranscript } = await import('youtube-transcript');
      const items = await YoutubeTranscript.fetchTranscript(v);
      const decodeHtml = (html: string) =>
        html
          .replace(/&amp;#39;|&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/\[Music\]|\[Aplausos\]|\[Laughter\]/gi, '')
          .trim();
      const segments = items
        .map((it) => ({
          text: decodeHtml(it.text),
          startMs: Math.round(it.offset),
          durationMs: Math.round(it.duration),
        }))
        .filter((s) => s.text.length > 0);
      const transcript = segments.map((s) => s.text).join('\n');
      res.statusCode = 200;
      res.end(JSON.stringify({ ok: true, videoId: v, transcript, segments }));
    } catch (err: any) {
      res.statusCode = 200;
      res.end(JSON.stringify({ ok: false, videoId: v, error: err.message || 'No se encontraron subtítulos para este video' }));
    }
  };

  return {
    name: 'youtube-transcript-api',
    configureServer(server: any) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server: any) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig({
  plugins: [react(), youtubeTranscriptPlugin()],
  server: {
    allowedHosts: true,
  },
  preview: {
    allowedHosts: true,
  },
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.test.ts'],
  },
});

