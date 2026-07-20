#!/usr/bin/env bash
# Start Azimut Clinic Telegram bot (long polling).
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

if [[ ! -f .env ]]; then
  echo "No .env — copy .env.example to .env and set TELEGRAM_BOT_TOKEN from @BotFather"
  exit 1
fi

# shellcheck disable=SC1091
set -a
# Load .env for child process (bot.js also loads it)
# shellcheck source=/dev/null
source <(grep -v '^\s*#' .env | grep -v '^\s*$' | sed 's/\r$//')
set +a

LOG="${BOT_LOG_FILE:-/tmp/azimut-clinic-bot.log}"
PID_FILE="${BOT_PID_FILE:-/tmp/azimut-clinic-bot.pid}"

if [[ -f "$PID_FILE" ]]; then
  old="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "${old}" ]] && kill -0 "$old" 2>/dev/null; then
    echo "Bot already running pid=$old (log: $LOG)"
    exit 0
  fi
fi

# Drop webhook so getUpdates long-polling works
if [[ -n "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  curl -fsS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook" >/dev/null || true
fi

nohup node bot.js >>"$LOG" 2>&1 &
echo $! >"$PID_FILE"
echo "Started @azimut_clinic_bot pid=$(cat "$PID_FILE") log=$LOG"
echo "Test: open https://t.me/azimut_clinic_bot and send /start"
