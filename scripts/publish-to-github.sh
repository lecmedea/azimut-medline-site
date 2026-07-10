#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="/Users/polzovatel/Downloads/gh_2.94.0_macOS_amd64/bin:${PATH:-/usr/bin:/bin}"

if [[ ! -f assets/fonts/montserrat/Montserrat-Light.ttf ]]; then
  mkdir -p assets/fonts/montserrat
  cp "/Users/polzovatel/Downloads/ofont.ru_Montserrat.ttf" assets/fonts/montserrat/Montserrat-Light.ttf \
    || cp "/Users/polzovatel/Library/Mobile Documents/com~apple~CloudDocs/ofont.ru_Montserrat.ttf" assets/fonts/montserrat/Montserrat-Light.ttf
fi

git add -A
git status --short
git commit -m "Montserrat Light на всех страницах, полировка футера, публикация правок Codex" || true
git pull --rebase origin main
git push origin main
git rev-parse --short HEAD
echo "Published to https://github.com/lecmedea/azimut-medline-site"