# zeitgewinn-hamburg.de

Dieses Repository enthält die Homepage für die Domain **zeitgewinn-hamburg.de**.

Die Seite ist statisch und wird über GitHub Pages aus der Wurzel dieses Repos ausgeliefert.
Sie besteht aus der Startseite mit dem Umzugshinweis auf work-with-ease.com, dem Blog-Archiv
mit allen Artikeln aus WordPress sowie Impressum und Datenschutzerklärung.

## Aufbau

- **Wurzel des Repos**: die Publikation. Alles hier außer `README.md`, `.nojekyll`, `.gitignore`
  und `production/` wird erzeugt und nicht von Hand bearbeitet.
- **production/**: das Material für die Publikation.
  - `src/artikel/` ein Artikel pro Markdown-Datei
  - `src/impressum.md`, `src/datenschutzerklaerung.md`
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

Baut die Seite, committet Quelle und Publikation zusammen und pusht nach GitHub.
GitHub Pages liefert die neue Fassung ein bis zwei Minuten später aus.
Ohne eigene Nachricht wird das Datum als Commit-Nachricht verwendet.

```bash
npm run import
```

Liest die Artikel erneut aus den zwischengespeicherten WordPress-Daten in `production/raw/`.
Mit `npm run import -- --refresh` werden die Daten neu von zeitgewinn-hamburg.de geladen.
Das funktioniert nur, solange WordPress noch läuft. Ein Import überschreibt die Markdown-Dateien.

## Alte Adressen

Die Artikel liegen unter denselben Adressen wie in WordPress. Alle anderen alten Adressen
landen auf der Seite `404.html`. Sie leitet alte Kategorien auf den passenden Themenfilter im Blog
weiter, alte Blog-Unterseiten auf den Blog und alles Übrige auf die Startseite.
