# Design: автопродление SSL внутри docker-compose

**Дата:** 2026-06-02
**Автор:** Alex + Claude
**Статус:** approved (подход A)

## Проблема

Сертификат Let's Encrypt для `rheumassociation.uz` истёк 2026-05-18 → браузеры отдавали `ERR_CERT_DATE_INVALID`. Корневая причина — продление держалось на **ручном crontab старого сервера** (`138.68.59.141`). При переезде на новый дроплет (`157.245.165.136`) cron не перенесли, серт дожил остаток срока и протух. Продлён вручную 2026-06-02 (живёт до 2026-08-30), но механизм по-прежнему отсутствует — через ~90 дней повторится.

**Класс проблемы:** механизм продления был уровня хоста и не пережил миграцию инфраструктуры.

## Цель

Сделать продление частью стека `docker-compose.prod.yml`, чтобы `docker compose up -d` на любом сервере автоматически восстанавливал рабочее автопродление. Убрать зависимость от ручных шагов на хосте.

## Рассмотренные варианты

| | A. certbot-сервис в compose | B. systemd-timer на хосте |
|---|---|---|
| Где живёт | внутри стека | на хосте |
| Переживает переезд | да, `up -d` восстанавливает | нет — нужен ручной `systemctl enable` |
| Наблюдаемость | `docker logs` | `journalctl` (богаче) |
| renew частота | каждые 12ч (no-op если рано) | раз в сутки |
| nginx reload | петля раз в 6ч | deploy-hook только при продлении |

**Выбран A.** Решающий довод: сломалось ровно из-за хостового механизма, не пережившего миграцию. B воспроизводит тот же класс хрупкости. A делает `docker compose up -d` единственным источником правды — migration-proof. Это канонический паттерн EFF/Certbot для Docker.

## Дизайн

### 1. `docker-compose.prod.yml`

**certbot** — сейчас сервис без команды (стоит вхолостую). Добавить петлю продления:

```yaml
  certbot:
    image: certbot/certbot
    container_name: rheumatology_certbot
    restart: always
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done'"
    volumes:
      - certbot_data:/etc/letsencrypt
      - certbot_www:/var/www/certbot
    networks:
      - internal
```

**nginx** — добавить reload-петлю (сейчас `command` нет, берётся дефолт образа):

```yaml
    command: "/bin/sh -c 'while :; do sleep 6h & wait $${!}; nginx -s reload; done & nginx -g \"daemon off;\"'"
```

Связь certbot↔nginx только через общие тома `certbot_data`/`certbot_www`: certbot пишет обновлённый серт, nginx раз в 6ч делает `reload` и подхватывает его. Контейнеры не лезут друг в друга.

**Почему `$${!}`:** docker-compose интерполирует `$`, двойной экранирует — в контейнер уходит `$!` (PID фонового `sleep`), `wait` на него даёт мгновенную реакцию на TERM при остановке.

**Почему renew без аргументов работает:** webroot-конфиг (`authenticator=webroot`, `webroot-path=/var/www/certbot`) уже записан в `/etc/letsencrypt/renewal/rheumassociation.uz.conf` при ручном продлении 2026-06-02. nginx уже отдаёт `/.well-known/acme-challenge/` на 80-м порту (nginx.conf не трогаем).

### 2. `DEPLOY.md`

- IP `138.68.59.141` → `157.245.165.136` (везде).
- SSH: юзер `sardor`, ключ `~/.ssh/id_ed_rheum` (убрать путаницу `deploy`/`sardor` из этапа 1.6).
- Этап 6 «Автопродление через crontab» → заменить: продление автоматическое внутри compose, ручной cron не нужен. Оставить команду первичного выпуска (`certonly`) — она нужна на чистом сервере до появления серта.

## Что НЕ делаем (YAGNI)

- Проверку срока серта в CI `deploy.yml` — при рабочей петле избыточно.
- systemd-уровень, мониторинг/алерты на истечение — вне объёма.
- `nginx.conf` не трогаем — webroot-блок уже есть.

## Верификация

1. `docker compose -f docker-compose.prod.yml up -d` — поднять обновлённый стек.
2. `docker compose -f docker-compose.prod.yml run --rm certbot renew --dry-run` — зелёный прогон = механизм рабочий.
3. `docker logs rheumatology_certbot` — видна петля.
4. `docker logs rheumatology_nginx` — nginx стартовал, reload-петля жива.
5. Снаружи: `openssl s_client ... | openssl x509 -noout -dates` — серт валиден (контрольная точка — что не сломали отдачу).

## Откат

Вернуть прежний `docker-compose.prod.yml` (certbot без entrypoint, nginx без command) и `up -d`. Серт в томе `certbot_data` не затрагивается.

## Деплой

Изменения едут штатным CI (`push` в master → `docker compose up -d`). После merge PR петли поднимутся сами. Доп. ручных шагов на сервере не требуется.
