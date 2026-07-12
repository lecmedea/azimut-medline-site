#!/bin/bash
# Если «permission denied» — запустите так:
# bash "/Users/polzovatel/Documents/Codex/2026-06-12/polzovatel-grantek-cabel-github/work/azimut-medline-site/scripts/publish-changes.command"
set -euo pipefail
cd "$(dirname "$0")/.."

echo "=== Публикация на GitHub (API) ==="
/usr/bin/python3 scripts/github_push.py

echo ""
echo "=== Копирование фото блога (локально) ==="
/usr/bin/python3 scripts/copy-all-blog-heroes.py || true
JPG_COUNT=$(ls -1 assets/blog/*-hero.jpg 2>/dev/null | wc -l | tr -d ' ')
echo "JPG обложек: ${JPG_COUNT}"

if [ "${JPG_COUNT}" != "0" ] && [ "${JPG_COUNT}" != "43" ]; then
  echo "Дозагрузка JPG на GitHub..."
  /usr/bin/python3 scripts/github_push_blog.py || true
fi

echo ""
echo "=== Проверка деплоя (через 90 сек) ==="
sleep 90
curl -fsS "https://azimutclinic.ru/services.html" | grep -o 'Направления помощи\|SEO-раздел' | head -1 || true

echo ""
echo "Готово. Если видите «Направления помощи» — деплой прошёл."