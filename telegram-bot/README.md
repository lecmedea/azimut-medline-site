# Telegram-бот Азимут Клиник

## Постоянная работа (Mac)

LaunchAgent уже настроен:

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ru.azimutclinic.telegram-bot.plist
# логи:
tail -f /tmp/azimut-clinic-bot.log
```

Бот поднимается при входе в macOS и перезапускается при падении (`KeepAlive`).
Нужен включённый Mac (или всегда-онлайн VPS).

## Облако 24/7 (рекомендуется, если Mac выключается)

1. Создайте **Background Worker** на [Render.com](https://render.com) (free plan).
2. Root Directory: `telegram-bot`
3. Dockerfile: `telegram-bot/Dockerfile` (есть `render.yaml`).
4. Env vars: `TELEGRAM_BOT_TOKEN`, `DEEPSEEK_API_KEY`, `CLINIC_SITE_URL=https://azimutclinic.ru/`

Либо Railway / Fly.io — тот же Docker image.

## Локально вручную

```bash
cd telegram-bot
bash start-bot.sh
```
