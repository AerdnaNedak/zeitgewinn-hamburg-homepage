import { readFileSync } from 'node:fs';

export function validateRedirects(entries) {
  if (!Array.isArray(entries)) throw new Error('Weiterleitungen müssen eine Liste sein.');
  const sources = new Set();
  for (const entry of entries) {
    if (!entry || Object.keys(entry).sort().join(',') !== 'from,to') {
      throw new Error('Jede Weiterleitung braucht genau from und to.');
    }
    if (typeof entry.from !== 'string' || !/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)+$/.test(entry.from)) {
      throw new Error(`Ungültiger alter Pfad: ${entry.from}`);
    }
    if (sources.has(entry.from)) throw new Error(`Doppelter alter Pfad: ${entry.from}`);
    sources.add(entry.from);
    let target;
    try { target = new URL(entry.to); } catch { throw new Error(`Ungültiges Ziel: ${entry.to}`); }
    if (typeof entry.to !== 'string' || target.origin !== 'https://work-with-ease.com' ||
        target.username || target.password || target.search || target.href !== entry.to) {
      throw new Error(`Ziel muss eine eindeutige HTTPS-Adresse bei WORK WITH EASE ohne Query sein: ${entry.to}`);
    }
  }
  return entries;
}

export const redirects = validateRedirects(JSON.parse(readFileSync(new URL('../redirects.json', import.meta.url), 'utf8')));

export function redirectOutputPath(source) {
  return source.slice(1) + 'index.html';
}

const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

export function renderRedirect({ to }) {
  const canonical = new URL(to);
  canonical.hash = '';
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Umgezogen · WORK WITH EASE</title>
<link rel="canonical" href="${escapeHtml(canonical.href)}">
<script>
// Das feste Ziel schützt vor fremden Weiterleitungszielen aus URL-Parametern.
// Der ausdrücklich festgelegte Abschnitt hat Vorrang vor einem alten Fragment.
(() => {
  const target = new URL(${JSON.stringify(to).replace(/</g, '\\u003c')});
  target.search = window.location.search;
  if (!target.hash) target.hash = window.location.hash;
  window.location.replace(target.href);
})();
</script>
<meta http-equiv="refresh" content="0; url=${escapeHtml(to)}">
</head>
<body style="font-family:system-ui,sans-serif;line-height:1.6;max-width:45rem;margin:3rem auto;padding:0 1rem">
<h1>Diese Seite ist umgezogen.</h1>
<p>Sie finden den aktuellen Inhalt jetzt bei WORK WITH EASE:</p>
<p><a href="${escapeHtml(to)}">Zur aktuellen Seite bei WORK WITH EASE</a></p>
</body>
</html>
`;
}
