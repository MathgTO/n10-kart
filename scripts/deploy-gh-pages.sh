#!/usr/bin/env bash
# Rebuild and publish dist/ to the gh-pages branch (GitHub Pages staging).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run build
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
cp -a dist/. "$TMP/"
touch "$TMP/.nojekyll"
cd "$TMP"
git init -b gh-pages
git config user.email "mathgto@users.noreply.github.com"
git config user.name "MathgTO"
git add -A
git commit -m "Deploy N10 staging $(date -u +%Y-%m-%dT%H:%MZ)"
git remote add origin https://github.com/MathgTO/n10-kart.git
git push -f origin gh-pages
echo "Published → https://mathgto.github.io/n10-kart/"
