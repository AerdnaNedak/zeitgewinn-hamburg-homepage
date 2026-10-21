#!/usr/bin/env bash
# Baut die Seite neu, committet Quelle und Publikation und pusht nach GitHub.
# GitHub Pages liefert danach automatisch die neue Fassung aus.
#
#   npm run veroeffentlichen                     Commit-Nachricht mit Datum
#   npm run veroeffentlichen -- "Was sich ändert" eigene Commit-Nachricht

set -euo pipefail
cd "$(dirname "$0")/.."            # production/
REPO="$(git rev-parse --show-toplevel)"

branch="$(git -C "$REPO" branch --show-current)"
if [ "$branch" != "main" ]; then
  echo "Abbruch: veröffentlicht wird nur von main, aktuell ist $branch ausgecheckt." >&2
  exit 1
fi

# Zuerst übernehmen, was direkt bei GitHub geändert wurde, zum Beispiel die Datei CNAME
# aus den Pages-Einstellungen. Sonst würde GitHub den Push am Ende ablehnen.
# Noch nicht committete Änderungen legt Git dafür kurz beiseite und setzt sie danach wieder ein.
echo "Hole Änderungen von GitHub …"
if ! git -C "$REPO" pull -q --rebase --autostash origin main; then
  echo "Abbruch: Die Änderungen von GitHub passen nicht automatisch zum lokalen Stand." >&2
  echo "Bitte den Konflikt lösen oder mit 'git rebase --abort' zurück zum vorherigen Stand." >&2
  exit 1
fi

echo "Baue die Seite …"
npm run --silent build >/dev/null

git -C "$REPO" add -A
if ! git -C "$REPO" diff --cached --quiet; then
  echo "Geänderte Dateien:"
  git -C "$REPO" diff --cached --stat | tail -1
  nachricht="${1:-Seite aktualisiert am $(date '+%d.%m.%Y %H:%M')}"
  git -C "$REPO" commit -q -m "$nachricht"
fi

git -C "$REPO" fetch -q origin main
if [ -z "$(git -C "$REPO" log --oneline origin/main..main)" ]; then
  echo "Keine Änderungen, nichts zu veröffentlichen."
  exit 0
fi
git -C "$REPO" push -q origin main
echo "Veröffentlicht: $(git -C "$REPO" log --oneline -1)"
echo "GitHub Pages braucht danach ein bis zwei Minuten, bis die neue Fassung online ist."
