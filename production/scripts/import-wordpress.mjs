// Importiert Blogartikel, Themen, Impressum und Datenschutz aus WordPress.
//
//   npm run import              nutzt die zwischengespeicherten Rohdaten in raw/
//   npm run import -- --refresh lädt die Rohdaten neu von zeitgewinn-hamburg.de
//
// Ergebnis:
//   src/artikel/<slug>.md        ein Artikel pro Datei, mit Front Matter
//   src/_data/kategorien.json    die WordPress-Kategorien
//   src/impressum.md
//
// Die Datenschutzerklärung wird nicht importiert. Sie ist für die statische Seite neu
// geschrieben und wird in src/datenschutzerklaerung.md von Hand gepflegt.
//   src/wp-content/uploads/...   Bilder und Downloads, Pfade wie im alten WordPress

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const ROOT = path.resolve(import.meta.dirname, '..');
const SITE = 'https://zeitgewinn-hamburg.de';
const API = SITE + '/wp-json/wp/v2';
const RAW = path.join(ROOT, 'raw');
const SRC = path.join(ROOT, 'src');
const POSTS_DIR = path.join(SRC, 'artikel');
const AUTHORS = { 6: 'Andrea Kaden', 12: 'Galina' };
const REFRESH = process.argv.includes('--refresh');
const UA = { 'User-Agent': 'zeitgewinn-hamburg-import/1.0 (static site migration)' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Rohdaten ----------

async function getJSON(url) {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(url, { headers: UA });
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      return { data: await r.json(), headers: r.headers };
    } catch (e) {
      if (i === 3) throw e;
      await sleep(1000 * (i + 1));
    }
  }
}

async function fetchAll(endpoint, query = '') {
  const out = [];
  for (let page = 1, total = 1; page <= total; page++) {
    const { data, headers } = await getJSON(`${API}/${endpoint}?per_page=100&page=${page}${query}`);
    out.push(...data);
    total = Number(headers.get('x-wp-totalpages')) || 1;
  }
  return out;
}

async function cached(name, loader) {
  const file = path.join(RAW, name);
  if (!REFRESH) {
    try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch {}
  }
  console.log(`lade ${name} …`);
  const data = await loader();
  await fs.mkdir(RAW, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data));
  return data;
}

// ---------- Medien ----------

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg|bmp)$/i;
const FILE_EXT = /\.(jpe?g|png|gif|webp|svg|bmp|pdf|xlsx?|docx?|pptx?|zip|mp3|mp4|m4a|mov)$/i;
const TYPE_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp', 'image/svg+xml': '.svg' };

function normalize(url) {
  let u;
  try { u = new URL(url.trim(), SITE); } catch { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  if (u.hostname === 'www.zeitgewinn-hamburg.de') u.hostname = 'zeitgewinn-hamburg.de';
  if (u.hostname === 'zeitgewinn-hamburg.de') u.protocol = 'https:';
  return u;
}

const isOwn = (u) => u && u.hostname === 'zeitgewinn-hamburg.de';
const isUpload = (u) => isOwn(u) && u.pathname.startsWith('/wp-content/uploads/');

const media = new Map(); // normalisierte URL -> Webpfad (oder null, wenn der Download scheiterte)
const failed = [];

function wantMedia(url) {
  const u = normalize(url);
  if (!u) return null;
  const key = isOwn(u) ? u.origin + u.pathname : u.href;
  if (!media.has(key)) media.set(key, undefined);
  return key;
}

async function exists(file) {
  try { await fs.access(file); return true; } catch { return false; }
}

async function download(key) {
  const u = new URL(key);
  let web;
  if (isUpload(u)) {
    web = decodeURIComponent(u.pathname);
  } else {
    // Fremde Bilder, zum Beispiel von Substack: unter extern/ mit Hash als Namen ablegen.
    const hash = crypto.createHash('sha1').update(key).digest('hex').slice(0, 12);
    const dir = path.join(SRC, 'wp-content/uploads/extern');
    const hit = (await fs.readdir(dir).catch(() => [])).find((f) => f.startsWith(hash + '.'));
    if (hit) { media.set(key, '/wp-content/uploads/extern/' + hit); return; }
    web = '/wp-content/uploads/extern/' + hash; // Endung folgt aus dem Content-Type
  }
  const file = path.join(SRC, web);
  if (isUpload(u) && (await exists(file))) { media.set(key, web); return; }
  try {
    let r;
    for (let i = 0; ; i++) {
      try { r = await fetch(key, { headers: UA }); break; } catch (e) { if (i === 2) throw e; await sleep(1500); }
    }
    // Wikimedia liefert manche Vorschaugrößen nicht mehr aus, das Original aber schon.
    const original = key.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/[^/]+)\/thumb(\/.+)\/[^/]+$/);
    if (!r.ok && original) r = await fetch(original[1] + original[2], { headers: UA });
    if (!r.ok) throw new Error(String(r.status));
    const buf = Buffer.from(await r.arrayBuffer());
    if (!isUpload(u)) {
      const type = (r.headers.get('content-type') || '').split(';')[0];
      const ext = TYPE_EXT[type] || (u.pathname.match(IMAGE_EXT) || ['.bin'])[0].toLowerCase();
      web += ext;
    }
    await fs.mkdir(path.dirname(path.join(SRC, web)), { recursive: true });
    await fs.writeFile(path.join(SRC, web), buf);
    media.set(key, web);
  } catch (e) {
    media.set(key, null);
    failed.push(`${key} (${e.message})`);
  }
}

async function pool(items, size, fn) {
  let i = 0;
  let done = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (i < items.length) {
      await fn(items[i++]);
      if (++done % 50 === 0) console.log(`  ${done}/${items.length} Dateien`);
    }
  }));
}

const webUrl = (p) => encodeURI(p);

// ---------- HTML aufräumen ----------

function decodeEntities(s) {
  return cheerio.load(`<i>${s}</i>`, null, false)('i').text();
}

function shortcodes(html) {
  return html
    .replace(/\[if lt IE 9\]>?|<!\[endif\]>?|\[endif\]/g, '')
    .replace(/\[\/?(vc_|us_)[a-z_]*[^\]]*\]/g, '') // Reste des Page-Builders
    .replace(/\[separator[^\]]*\]/g, '<hr>')
    .replace(/\[button([^\]]*)\]/g, (m, raw) => {
      const a = decodeEntities(raw);
      const q = `['’‘"″′“”]`;
      const text = (a.match(new RegExp(`text=${q}([^'’‘"″′“”]+)`)) || [])[1];
      const link = (a.match(new RegExp(`link=${q}(https?:[^'’‘"″′“” ]+)`)) || [])[1];
      if (!link) return '';
      return `<p><a href="${link.replace(/&/g, '&amp;')}">${text || link}</a></p>`;
    });
}

// Erster Durchgang: aufräumen und Medien-URLs einsammeln.
function prepare(html) {
  html = shortcodes(html.replace(/<!--[\s\S]*?-->/g, ''));
  const $ = cheerio.load(html, null, false);

  $('script, style, noscript, link, meta').remove();
  $('picture source').remove();
  $('picture').each((_, el) => $(el).replaceWith($(el).contents()));

  $('img').each((_, el) => {
    const img = $(el);
    const src = img.attr('data-src') || img.attr('data-lazy-src') || img.attr('src') || '';
    const u = normalize(src);
    if (!u || /amazon-adsystem|assoc-amazon|feeds\.feedburner|lazy_placeholder/.test(u.href)) {
      img.remove();
      return;
    }
    img.attr('data-key', wantMedia(src));
  });

  $('video, audio').each((_, el) => {
    const m = $(el);
    const src = m.attr('src') || m.find('source').attr('src') || m.find('a').attr('href');
    if (!src) { m.remove(); return; }
    const key = wantMedia(src.replace(/\?_=\d+$/, ''));
    const tag = el.tagName.toLowerCase();
    m.replaceWith(`<${tag} controls preload="metadata" data-key="${key}"></${tag}>`);
  });

  $('a[href]').each((_, el) => {
    const a = $(el);
    const u = normalize(a.attr('href'));
    if (!u) return;
    // Links auf die Großansicht eines Bildes braucht die statische Seite nicht.
    if (isUpload(u) && IMAGE_EXT.test(u.pathname)) {
      a.replaceWith(a.contents());
      return;
    }
    if (isUpload(u) && FILE_EXT.test(u.pathname)) a.attr('data-key', wantMedia(u.href));
  });

  return $;
}

// Zweiter Durchgang: Pfade auf lokale Dateien umschreiben.
function finish($) {
  $('[data-key]').each((_, el) => {
    const node = $(el);
    const local = media.get(node.attr('data-key'));
    node.removeAttr('data-key');
    const tag = el.tagName.toLowerCase();
    if (tag === 'a') {
      if (local) node.attr('href', webUrl(local));
      return;
    }
    if (!local) { node.remove(); return; }
    node.attr('src', webUrl(local));
  });

  $('a[href]').each((_, el) => {
    const a = $(el);
    const u = normalize(a.attr('href'));
    if (isOwn(u) && !isUpload(u)) {
      // Alte Kategorie-Links führen direkt zum passenden Themenfilter im Blog.
      const kat = u.pathname.match(/^\/category\/(?:.*\/)?([^/]+)\/?$/);
      const thema = kat && themaBySlug.get(kat[1]);
      a.attr('href', thema ? `/blog/?thema=${thema.slug}` : u.pathname + u.search + u.hash);
    }
    a.removeAttr('target').removeAttr('rel');
  });

  $('iframe').each((_, el) => {
    const f = $(el);
    const src = (f.attr('src') || '').replace('www.youtube.com/embed', 'www.youtube-nocookie.com/embed');
    f.replaceWith(`<iframe src="${src}" title="${f.attr('title') || 'Eingebettetes Video'}" loading="lazy" allowfullscreen></iframe>`);
  });

  $('img').each((_, el) => {
    const keep = ['src', 'alt', 'title'];
    for (const name of Object.keys(el.attribs)) if (!keep.includes(name)) $(el).removeAttr(name);
    if ($(el).attr('alt') === undefined) $(el).attr('alt', '');
  });

  // Der Artikeltitel ist die Hauptüberschrift. Überschriften im Text rücken eine Ebene tiefer.
  if ($('h1').length) {
    $('h1, h2, h3, h4, h5').each((_, el) => { el.tagName = 'h' + Math.min(6, Number(el.tagName[1]) + 1); });
  }

  $('[style]').removeAttr('style');
  $('[class]').removeAttr('class');
  $('[id]').removeAttr('id');
  $('span, font').each((_, el) => $(el).replaceWith($(el).contents()));
  $('div').each((_, el) => $(el).replaceWith($(el).contents()));
  $('p').each((_, el) => {
    const p = $(el);
    if (!p.text().replace(/ /g, '').trim() && !p.find('img, iframe, video, audio').length) p.remove();
  });
  return $.html();
}

// ---------- Markdown ----------

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
  hr: '---',
  keepReplacement: (content, node) => '\n\n' + node.outerHTML.replace(/\n\s*\n+/g, '\n') + '\n\n',
});
turndown.use(gfm);
turndown.keep(['iframe', 'video', 'audio', 'figure', 'dl']);

function toMarkdown(html) {
  return turndown
    .turndown(html)
    .replace(/\u00a0/g, ' ') // geschützte Leerzeichen aus WordPress verhindern sonst den Zeilenumbruch
    .replace(/\bwork with ease\b/gi, 'WORK WITH EASE') // Markenname immer groß, Adressen bleiben unberührt
    .replace(/[ \t]+$/gm, (m) => (m.length >= 2 ? '  ' : '')) // Markdown-Zeilenumbrüche behalten, Rest kürzen
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';
}

const yaml = (v) => JSON.stringify(v);

function plain(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' '))
    .replace(/\[(…|&hellip;|\.\.\.)\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function shorten(text, max = 230) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.\-–]+$/, '') + ' …';
}

// ---------- Ablauf ----------

const posts = await cached('posts.json', () => fetchAll('posts', '&_embed=wp:featuredmedia'));
const categories = await cached('categories.json', () => fetchAll('categories'));
const pages = await cached('pages.json', async () => {
  const out = [];
  for (const slug of ['impressum']) {
    const { data } = await getJSON(`${API}/pages?slug=${slug}`);
    out.push(...data);
  }
  return out;
});
console.log(`${posts.length} Artikel, ${categories.length} Themen, ${pages.length} Seiten`);

// Themen: WordPress-Slugs ohne Nummernpräfix, alter URL-Pfad für Weiterleitungen.
const catById = new Map(categories.map((c) => [c.id, c]));
const used = new Set();
const themen = categories.map((c) => {
  let slug = c.slug.replace(/^\d+-/, '');
  if (used.has(slug)) slug = c.slug;
  used.add(slug);
  const chain = [];
  for (let x = c; x; x = catById.get(x.parent)) chain.unshift(x.slug);
  return { id: c.id, name: decodeEntities(c.name), slug, parent: c.parent, wpPath: chain.join('/') };
});
const themaById = new Map(themen.map((t) => [t.id, t]));
const themaBySlug = new Map();
for (const c of categories) {
  const t = themaById.get(c.id);
  themaBySlug.set(c.slug, t);
  themaBySlug.set(t.slug, t);
}

const prepared = posts.map((p) => {
  const link = new URL(p.link);
  const fm = p._embedded?.['wp:featuredmedia']?.[0];
  const sizes = fm?.media_details?.sizes || {};
  const featured = (sizes.medium_large || sizes.large || sizes.full || {}).source_url || fm?.source_url;
  return { p, link, $: prepare(p.content.rendered), featuredKey: featured ? wantMedia(featured) : null };
});
const preparedPages = pages
  .filter((p) => p.slug === 'impressum')
  .map((p) => ({ p, $: prepare(p.content.rendered) }));

const keys = [...media.keys()];
console.log(`lade ${keys.length} Dateien (vorhandene werden übersprungen) …`);
await pool(keys, 8, download);

// Nur die Markdown-Dateien ersetzen, artikel.11tydata.json bleibt stehen.
await fs.mkdir(POSTS_DIR, { recursive: true });
for (const f of await fs.readdir(POSTS_DIR)) if (f.endsWith('.md')) await fs.rm(path.join(POSTS_DIR, f));

const permalinks = [];
for (const { p, link, $, featuredKey } of prepared) {
  const html = finish($);
  const body = toMarkdown(html);
  let bild = featuredKey ? media.get(featuredKey) : null;
  if (!bild) {
    const first = cheerio.load(html, null, false)('img').attr('src');
    if (first) bild = decodeURI(first);
  }
  const permalink = link.pathname.endsWith('/') ? link.pathname : link.pathname + '/';
  permalinks.push(permalink);
  const front = [
    '---',
    `title: ${yaml(decodeEntities(p.title.rendered))}`,
    `date: ${p.date}`,
    `autor: ${yaml(AUTHORS[p.author] || 'Zeitgewinn Hamburg')}`,
    `themen: ${yaml(p.categories.map((id) => themaById.get(id)?.slug).filter(Boolean))}`,
    bild ? `bild: ${yaml(webUrl(bild))}` : null,
    `auszug: ${yaml(shorten(plain(shortcodes(p.excerpt.rendered))))}`,
    `permalink: ${yaml(permalink)}`,
    `wp_id: ${p.id}`,
    '---',
    '',
  ].filter((l) => l !== null);
  await fs.writeFile(path.join(POSTS_DIR, `${p.slug}.md`), front.join('\n') + body);
}

for (const { p, $ } of preparedPages) {
  const front = ['---', `title: ${yaml(decodeEntities(p.title.rendered))}`, 'layout: seite.njk', `permalink: ${yaml(`/${p.slug}/`)}`, '---', ''];
  await fs.writeFile(path.join(SRC, `${p.slug}.md`), front.join('\n') + toMarkdown(finish($)));
}

await fs.mkdir(path.join(SRC, '_data'), { recursive: true });
await fs.writeFile(path.join(SRC, '_data/kategorien.json'), JSON.stringify(themen, null, 2) + '\n');

const odd = permalinks.filter((p) => !/^\/[^/]+\/$/.test(p));
console.log(`fertig: ${prepared.length} Artikel, ${[...media.values()].filter(Boolean).length} Dateien lokal`);
if (odd.length) console.log('Permalinks mit ungewöhnlicher Form:', odd);
if (failed.length) {
  console.log(`${failed.length} Dateien nicht ladbar, Bilder wurden entfernt, Links zeigen weiter auf das Original:`);
  for (const f of failed) console.log('  ' + f);
}
