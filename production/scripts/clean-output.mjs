// Entfernt die Dateien des letzten Builds aus der Wurzel des Repos, bevor Eleventy neu baut.
// So verschwinden auch Seiten, deren Quelle gelöscht wurde. Bilder und Assets bleiben liegen,
// Eleventy kopiert sie ohnehin wieder.
import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const manifest = path.join(root, '.build-manifest.json');

let files = [];
try { files = JSON.parse(await fs.readFile(manifest, 'utf8')); } catch { process.exit(0); }

const dirs = new Set();
for (const f of files) {
  const abs = path.resolve(root, f);
  if (!abs.startsWith(root + path.sep) || !abs.endsWith('.html')) continue; // nur erzeugte HTML-Dateien
  await fs.rm(abs, { force: true });
  dirs.add(path.dirname(abs));
}
// Leere Ordner aufräumen, von innen nach außen.
for (const d of [...dirs].sort((a, b) => b.length - a.length)) {
  if (d === root) continue;
  try { await fs.rmdir(d); } catch {}
}
console.log(`${files.length} alte Dateien entfernt`);
