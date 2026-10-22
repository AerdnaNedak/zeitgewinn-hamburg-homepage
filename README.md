# zeitgewinn-hamburg.de

Dieses Repository enthält die Homepage für die Domain **zeitgewinn-hamburg.de**.

Die Seite ist statisch und wird über GitHub Pages aus der Wurzel dieses Repos ausgeliefert.
Sie besteht aus der Startseite mit dem Umzugshinweis auf work-with-ease.com, dem Blog-Archiv
mit allen Artikeln aus WordPress sowie Impressum und Datenschutzerklärung.

## Aufbau

- **Wurzel des Repos**: die Publikation. Alles hier außer `README.md`, `CNAME`, `.nojekyll`,
  `.gitignore` und `production/` wird erzeugt und nicht von Hand bearbeitet.
  `CNAME` enthält die eigene Domain und wird von GitHub verwaltet.
- **production/**: das Material für die Publikation.
  - `src/artikel/` ein Artikel pro Markdown-Datei
  - `src/impressum.md`, `src/datenschutzerklaerung.md` von Hand gepflegt, der Import überschreibt sie nicht
  - `src/index.njk`, `src/blog.njk`, `src/404.njk` und `src/_includes/` die Vorlagen
  - `src/assets/` Stylesheet, Schriften, Logo, Foto
  - `src/wp-content/uploads/` Bilder und Downloads, Pfade wie im alten WordPress
  - `scripts/` Import, Aufräumen vor dem Build, lokale Vorschau

## Befehle

Alle Befehle laufen im Ordner `production/`, einmalig vorher `npm install`.

```bash
npm run build
```

Erzeugt die Seite neu in die Wurzel des Repos.

```bash
python3 scripts/vorschau.py
```

Zeigt die erzeugte Seite unter http://localhost:8411 so an, wie GitHub Pages sie ausliefert.

```bash
npm run veroeffentlichen -- "Was sich geändert hat"
```

Übernimmt zuerst Änderungen, die direkt bei GitHub gemacht wurden, etwa die Datei `CNAME`.
Danach baut es die Seite, committet Quelle und Publikation zusammen und pusht nach GitHub.
GitHub Pages liefert die neue Fassung ein bis zwei Minuten später aus.
Ohne eigene Nachricht wird das Datum als Commit-Nachricht verwendet.

```bash
npm run import
```

Liest die Artikel erneut aus den zwischengespeicherten WordPress-Daten in `production/raw/`.
Mit `npm run import -- --refresh` werden die Daten neu von zeitgewinn-hamburg.de geladen.
Das funktioniert nur, solange WordPress noch läuft. Ein Import überschreibt die Markdown-Dateien.

## Alte Adressen

Die Artikel liegen unter denselben Adressen wie in WordPress. Zwölf gezielt ausgewählte
Adressen führen sofort zu den entsprechenden aktuellen Seiten bei WORK WITH EASE.
Die Zuordnungen stehen zentral in `production/redirects.json`. Der Build ersetzt die
Ausgabe von vier umgezogenen Artikeln und ergänzt acht bisher fehlende Pfade; sämtliche
Artikelquellen und die übrigen Archivseiten bleiben erhalten.

GitHub Pages kann hier keine eigenen HTTP-301-Regeln ausführen. Deshalb enthalten diese
zwölf HTML-Seiten einen sofortigen Meta-Refresh, den kanonischen Ziel-Link und einen
sichtbaren Link. JavaScript erhält zusätzlich URL-Parameter und alte Fragmente; ein im
Mapping festgelegtes Fragment wie `#format-beratung` hat Vorrang. Ohne JavaScript führt
der Meta-Refresh zum festgelegten Ziel. Es werden keine HTTP-301-Statuscodes behauptet.
`npm test` in `production/` baut die Seite und prüft alle zwölf erzeugten Weiterleitungen,
URL-Verhalten, Mapping-Gültigkeit und den Erhalt der Artikel im Archiv.

Alle anderen alten Adressen
landen auf der Seite `404.html`. Sie leitet alte Kategorien auf den passenden Themenfilter im Blog
weiter, alte Blog-Unterseiten auf den Blog und alles Übrige auf die Startseite.
