import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { load } from 'cheerio';
import { redirects, validateRedirects } from '../scripts/redirects.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const approved = {
  '/sinnvolle-und-einheitliche-dateibenennung/': 'https://work-with-ease.com/blog/dateien-richtig-benennen/',
  '/einfacher-excel-projektplan/': 'https://work-with-ease.com/blog/einfacher-projektplan/',
  '/ordnerstruktur-und-aktenplan/': 'https://work-with-ease.com/blog/ordnerstruktur-und-aktenplan/',
  '/ordnung-auf-laufwerken-praktische-umsetzung-2/': 'https://work-with-ease.com/blog/ordnerstruktur-umstellen/',
  '/ordner-und-laufwerkstruktur/': 'https://work-with-ease.com/blog/ordnerstruktur-und-aktenplan/',
  '/profil/': 'https://work-with-ease.com/ueber-uns.html',
  '/speaking-2/': 'https://work-with-ease.com/vortraege.html',
  '/speaking-2/videos/': 'https://work-with-ease.com/vortraege.html',
  '/workshops-trainings/': 'https://work-with-ease.com/angebote.html',
  '/digitalisierung-der-geschaeftsprozesse/': 'https://work-with-ease.com/digitale-werkzeuge.html',
  '/papierloses-buero/': 'https://work-with-ease.com/digitale-werkzeuge.html',
  '/workshops/ordner-und-laufwerkstruktur/': 'https://work-with-ease.com/angebote.html#format-beratung',
};
const outputFor = (source) => path.join(root, source.slice(1), 'index.html');

test('genau die zwölf beschlossenen Zuordnungen sind hinterlegt', () => {
  assert.equal(redirects.length, 12);
  assert.deepEqual(Object.fromEntries(redirects.map(({ from, to }) => [from, to])), approved);
});

test('ungültige, doppelte oder fremde Weiterleitungsziele werden abgewiesen', () => {
  const valid = { from: '/alter-artikel/', to: 'https://work-with-ease.com/blog/beispiel/' };
  assert.doesNotThrow(() => validateRedirects([valid]));
  assert.throws(() => validateRedirects({}));
  assert.throws(() => validateRedirects([valid, valid]));
  assert.throws(() => validateRedirects([{ ...valid, extra: true }]));
  for (const from of ['/', '/../profil/', '/profil', '//profil/', '/profil/?x=1', '/profil/#alt', '/%2e%2e/', '/foo\\bar/']) {
    assert.throws(() => validateRedirects([{ ...valid, from }]), from);
  }
  for (const to of ['https://example.com/', 'http://work-with-ease.com/', 'https://work-with-ease.com.evil.example/',
    'https://user:password@work-with-ease.com/', 'https://work-with-ease.com/?next=x',
    'https://work-with-ease.com:444/', 'https://work-with-ease.com/foo/../', 'javascript:alert(1)', '/relative/']) {
    assert.throws(() => validateRedirects([{ ...valid, to }]), to);
  }
});

test('alle gebauten Seiten besitzen sofortige Weiterleitung, Canonical und sichtbaren Link', async (t) => {
  const manifest = JSON.parse(await readFile(path.join(root, '.build-manifest.json'), 'utf8'));
  assert.equal(manifest.length, new Set(manifest).size, 'keine doppelten Ausgabe-Pfade');
  for (const [source, target] of Object.entries(approved)) {
    await t.test(source, async () => {
      const html = await readFile(outputFor(source), 'utf8');
      const $ = load(html);
      assert.equal($('meta[http-equiv="refresh"]').attr('content'), `0; url=${target}`);
      assert.equal($('link[rel="canonical"]').length, 1);
      assert.equal($('link[rel="canonical"]').attr('href'), target.split('#')[0]);
      assert.equal($('body a').length, 1);
      assert.equal($('body a').attr('href'), target);
      assert.match($('body a').text(), /WORK WITH EASE/);
      assert.ok(!$('meta[name="robots"]').attr('content')?.includes('noindex'));
      assert.equal($('article').length, 0, 'keine konkurrierende alte Artikelausgabe');
      assert.ok(html.indexOf('<script>') < html.indexOf('http-equiv="refresh"'), 'JS erhält URL-Parameter vor Meta-Refresh');
      assert.ok(manifest.includes(source.slice(1) + 'index.html'), 'auch ergänzte Seiten werden beim nächsten Build aufgeräumt');
    });
  }
});

test('ausgeliefertes JavaScript erhält Query und Fragmente, erlaubt kein fremdes Ziel', async (t) => {
  const query = '?utm_source=xing&utm_content=a%20b&term=%26%3Cscript%3E&next=https://evil.example/';
  for (const [source, target] of Object.entries(approved)) {
    await t.test(source, async () => {
      const $ = load(await readFile(outputFor(source), 'utf8'));
      const script = $('script').text();
      for (const [search, hash] of [['', ''], [query, ''], ['', '#alter-abschnitt'], [query, '#alter-abschnitt']]) {
        const calls = [];
        vm.runInNewContext(script, {
          URL,
          window: { location: { search, hash, replace: (url) => calls.push(url) } },
        });
        const [base, fixedHash] = target.split('#');
        assert.deepEqual(calls, [base + search + (fixedHash ? '#' + fixedHash : hash)]);
        assert.equal(new URL(calls[0]).origin, 'https://work-with-ease.com');
      }
    });
  }
});

test('alle Artikelquellen bleiben im Archiv verlinkt, nur vier Artikel-Ausgaben ziehen um', async () => {
  const articlesDir = path.join(root, 'production/src/artikel');
  const sources = (await readdir(articlesDir)).filter((name) => name.endsWith('.md'));
  assert.ok(sources.length > 200);
  const blog = load(await readFile(path.join(root, 'blog/index.html'), 'utf8'));
  const blogLinks = new Set(blog('a[href]').map((_, el) => blog(el).attr('href')).get());
  let moved = 0;
  for (const source of sources) {
    const markdown = await readFile(path.join(articlesDir, source), 'utf8');
    const permalink = markdown.match(/^permalink: "([^"]+)"$/m)?.[1];
    assert.ok(permalink, `${source}: ursprünglicher Permalink vorhanden`);
    assert.ok(blogLinks.has('..' + permalink), `${permalink}: bleibt im Blog-Archiv erreichbar`);
    const page = load(await readFile(outputFor(permalink), 'utf8'));
    if (approved[permalink]) {
      moved++;
      assert.equal(page('meta[http-equiv="refresh"]').length, 1);
    } else {
      assert.equal(page('article.article').length, 1, `${permalink}: weiterhin Archivartikel`);
      assert.equal(page('meta[http-equiv="refresh"]').length, 0);
    }
  }
  assert.equal(moved, 4);
});

test('die allgemeine 404-Behandlung und /publikationen/ werden nicht auf WORK WITH EASE umgebogen', async () => {
  const $ = load(await readFile(path.join(root, '404.html'), 'utf8'));
  const calls = [];
  vm.runInNewContext($('script').text(), {
    location: { pathname: '/publikationen/', hostname: 'zeitgewinn-hamburg.de', replace: (url) => calls.push(url) },
  });
  assert.deepEqual(calls, ['/']);
  assert.equal(approved['/publikationen/'], undefined);
  const home = load(await readFile(path.join(root, 'index.html'), 'utf8'));
  assert.equal(home('meta[http-equiv="refresh"]').length, 0, 'die Archiv-Startseite bleibt erreichbar');
});
