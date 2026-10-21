// Eleventy baut aus production/src die Seite in die Wurzel des Repos.
import fs from 'node:fs/promises';
import path from 'node:path';

const MANIFEST = path.resolve(import.meta.dirname, '../.build-manifest.json');

// Diese WordPress-Kategorien ordnen die Filterliste im Blog.
const ARTIKEL = 75;
const GRUPPEN = [
  { titel: 'Artikel', parent: ARTIKEL },
  { titel: 'Coole Tools', parent: 83, mitOberthema: true },
  { titel: 'Literaturtipps', parent: 66, mitOberthema: true },
  { titel: 'Weitere Themen', parent: 0, ohne: [ARTIKEL, 83, 66] },
];

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets', 'src/wp-content': 'wp-content' });

  eleventyConfig.addCollection('neueste', (api) =>
    api.getFilteredByTag('artikel').sort((a, b) => b.date - a.date),
  );

  eleventyConfig.addFilter('datum', (d) =>
    new Date(d).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
  );
  eleventyConfig.addFilter('isoDatum', (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addGlobalData('jahr', () => new Date().getFullYear());
  eleventyConfig.addFilter('jahresspanne', (posts = []) => {
    const jahre = posts.map((p) => new Date(p.date).getUTCFullYear()).filter(Number.isFinite);
    return jahre.length ? `${Math.min(...jahre)} bis ${Math.max(...jahre)}` : '';
  });

  // Themen eines Artikels ohne das Sammelthema "Artikel", als Objekte mit Name und Slug.
  eleventyConfig.addFilter('themenVon', (slugs = [], kategorien) =>
    slugs.map((s) => kategorien.find((t) => t.slug === s)).filter((t) => t && t.id !== ARTIKEL),
  );

  // Für die Filterliste: Gruppen mit Themen, Treffer-Slugs und Anzahl Artikel.
  eleventyConfig.addFilter('filterGruppen', (themen, posts) => {
    const kinder = (id) => themen.filter((t) => t.parent === id).map((t) => t.slug);
    const zaehle = (match) => posts.filter((p) => (p.data.themen || []).some((s) => match.includes(s))).length;
    const eintrag = (t, name = t.name) => {
      const match = [t.slug, ...kinder(t.id)];
      return { name, slug: t.slug, match: match.join(' '), anzahl: zaehle(match) };
    };
    return GRUPPEN.map((g) => {
      let liste = themen.filter((t) => t.parent === g.parent && !(g.ohne || []).includes(t.id)).map((t) => eintrag(t));
      liste.sort((a, b) => b.anzahl - a.anzahl);
      if (g.mitOberthema) liste.unshift(eintrag(themen.find((t) => t.id === g.parent), `Alle zu ${g.titel}`));
      return { titel: g.titel, themen: liste.filter((e) => e.anzahl > 0) };
    }).filter((g) => g.themen.length);
  });

  // Zwei Artikel mit gemeinsamem Thema, sonst die neuesten.
  eleventyConfig.addFilter('verwandte', (posts, aktuell, anzahl = 2) => {
    const eigene = (aktuell.data.themen || []).filter((s) => s !== 'artikel');
    const andere = posts.filter((p) => p.url !== aktuell.url);
    const passend = andere.filter((p) => (p.data.themen || []).some((s) => eigene.includes(s)));
    return [...passend, ...andere.filter((p) => !passend.includes(p))].slice(0, anzahl);
  });

  // Alte Kategorie-Adressen auf die neuen Themen-Slugs abbilden, für die 404-Weiterleitung.
  eleventyConfig.addFilter('kategorieMap', (themen) =>
    JSON.stringify(Object.fromEntries(themen.flatMap((t) => [[t.wpPath.split('/').pop(), t.slug], [t.slug, t.slug]]))),
  );

  // Eingebettete Videos laden erst nach einem Klick. Bis dahin zeigt die Seite einen Platzhalter
  // und baut keine Verbindung zu YouTube oder Loom auf. Läuft vor relativeLinks.
  eleventyConfig.addTransform('videosPerKlick', function (content) {
    if (!this.page.outputPath?.endsWith('.html') || !content.includes('<iframe')) return content;
    const attr = (tag, name) => (tag.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1] || '';
    let ersetzt = 0;
    const html = content.replace(/<iframe\b[^>]*>\s*<\/iframe>/g, (tag) => {
      const src = attr(tag, 'src');
      let host;
      try { host = new URL(src).hostname; } catch { return tag; }
      const anbieter = /youtube/.test(host) ? 'YouTube' : /loom\.com$/.test(host) ? 'Loom' : null;
      if (!anbieter) return tag;
      const id = (src.match(/\/embed\/([^/?#]+)/) || [])[1];
      const direkt = anbieter === 'YouTube' ? `https://www.youtube.com/watch?v=${id}` : `https://www.loom.com/share/${id}`;
      const titel = attr(tag, 'title');
      const zeigeTitel = titel && !/^(YouTube video player|Eingebettetes Video)$/i.test(titel);
      ersetzt++;
      return `<div class="embed" data-src="${src}" data-title="${titel || 'Video'}">
<button type="button" class="embed-play"><span class="embed-icon" aria-hidden="true"></span><span class="embed-label">${zeigeTitel ? titel : 'Video'} abspielen</span><span class="embed-hint">Lädt das Video von ${anbieter}</span></button>
<p class="embed-note">Erst mit dem Klick wird eine Verbindung zu ${anbieter} aufgebaut und Ihre IP-Adresse übertragen. Mehr dazu in der <a href="/datenschutzerklaerung/">Datenschutzerklärung</a>. Oder direkt <a href="${direkt}">auf ${anbieter} ansehen</a>.</p>
</div>`;
    });
    if (!ersetzt) return content;
    return html.replace('</body>', '<script src="/assets/embed.js" defer></script>\n</body>');
  });

  // Alle Links relativ machen. So funktioniert die Seite unter der eigenen Domain
  // genauso wie unter github.io/<repo>/ oder lokal.
  eleventyConfig.addTransform('relativeLinks', function (content) {
    const out = this.page.outputPath;
    if (!out || !out.endsWith('.html') || this.page.url === '/404.html') return content;
    const tiefe = this.page.url.split('/').filter(Boolean).length - (this.page.url.endsWith('/') ? 0 : 1);
    const prefix = tiefe > 0 ? '../'.repeat(tiefe) : './';
    return content.replace(/(\s(?:href|src|poster)=")\/(?!\/)/g, `$1${prefix}`);
  });

  // Merkt sich die erzeugten Dateien, damit der nächste Build veraltete wieder entfernen kann.
  eleventyConfig.on('eleventy.after', async ({ results }) => {
    const root = path.resolve(import.meta.dirname, '..');
    const files = results.map((r) => path.relative(root, path.resolve(r.outputPath))).sort();
    await fs.writeFile(MANIFEST, JSON.stringify(files, null, 1) + '\n');
  });

  return {
    dir: { input: 'src', output: '..', includes: '_includes', data: '_data' },
    templateFormats: ['md', 'njk'],
    markdownTemplateEngine: false,
    htmlTemplateEngine: 'njk',
  };
}
