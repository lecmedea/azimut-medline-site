# Telegram-бот Азимут Клиник

## Production 24/7 — Yandex Cloud

Бот задеплоен на **Yandex Compute Cloud** (каталог `cloud-direktorpromo`):

| Параметр | Значение |
|----------|----------|
| VM | `azimut-telegram-bot` |
| Зона | `ru-central1-b` |
| Публичный IP | `111.88.156.11` |
| Unit | `systemd: azimut-telegram-bot.service` |
| Код | `/opt/azimut-bot/bot.js` |

```bash
# SSH (ключ ~/.ssh/azimut-yc)
ssh -i ~/.ssh/azimut-yc ubuntu@111.88.156.11

# статус / логи
sudo systemctl status azimut-telegram-bot
sudo journalctl -u azimut-telegram-bot -f
```

Обновление кода с Mac:

```bash
cd telegram-bot
tar czf /tmp/azimut-bot.tgz bot.js package.json Dockerfile assets .env
scp -i ~/.ssh/azimut-yc /tmp/azimut-bot.tgz ubuntu@111.88.156.11:/tmp/
ssh -i ~/.ssh/azimut-yc ubuntu@111.88.156.11 \
  'sudo tar xzf /tmp/azimut-bot.tgz -C /opt/azimut-bot && sudo systemctl restart azimut-telegram-bot'
```

**Важно:** не запускайте второй экземпляр (локальный LaunchAgent) — Telegram `getUpdates` конфликтует.

## Локальный LaunchAgent (только для разработки)

```bash
# НЕ включайте, пока крутится cloud-VM
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ru.azimutclinic.telegram-bot.plist
tail -f /tmp/azimut-clinic-bot.log
```

## Альтернативы

Render / Railway / Fly.io — тот же `Dockerfile` в этой папке.

## Локально вручную

```bash
cd telegram-bot
bash start-bot.sh
```
