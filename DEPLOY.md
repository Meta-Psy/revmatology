# Деплой rheumassociation.uz

**Сервер:** 138.68.59.141
**Домен:** rheumassociation.uz
**Стек:** React (Vite) + FastAPI + PostgreSQL + Nginx + Docker

---

## Этап 1. Подготовка сервера

### 1.1 Подключиться к серверу

```bash
ssh -i путь/к/ключу root@138.68.59.141
```

### 1.2 Обновить систему

```bash
apt update && apt upgrade -y
```

### 1.3 Создать пользователя deploy (не работать под root)

```bash
adduser deploy
usermod -aG sudo deploy

# Скопировать SSH-ключ
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### 1.4 Настроить файрвол

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### 1.5 Защитить SSH

Отредактировать `/etc/ssh/sshd_config`:

```
PasswordAuthentication no
PermitRootLogin no
```

Затем:

```bash
systemctl restart sshd
```

> После этого проверьте, что вы можете войти как `deploy` в **новом** терминале, прежде чем закрывать текущую сессию root!

### 1.6 Установить Docker

```bash
apt install -y docker.io docker-compose-v2
systemctl enable docker
usermod -aG docker sardor
```

Перезайти как deploy:

```bash
ssh -i путь/к/ключу deploy@138.68.59.141
```

---

## Этап 2. Настройка DNS (на ahost.uz)

В панели управления доменом `rheumassociation.uz` добавить A-записи:

| Тип | Имя  | Значение        |
|-----|------|-----------------|
| A   | @    | 138.68.59.141   |
| A   | www  | 138.68.59.141   |

Проверить распространение DNS:

```bash
ping rheumassociation.uz
nslookup rheumassociation.uz
```

---

## Этап 3. Загрузить проект на сервер

### Вариант A: Через Git (рекомендуется)

На сервере:

```bash
mkdir -p ~/apps && cd ~/apps
git clone <URL_ВАШЕГО_РЕПОЗИТОРИЯ> revmatology
cd revmatology
```

### Вариант B: Через SCP (если нет удаленного репозитория)

С вашего компьютера (Windows):

```powershell
scp -i путь\к\ключу -r C:\Users\Alex\revmatology deploy@138.68.59.141:~/apps/revmatology
```

---

## Этап 4. Создать .env на сервере

```bash
cd ~/apps/revmatology

# Сгенерировать безопасный пароль БД и секретный ключ
export DB_PASS=$(openssl rand -hex 16)
export SECRET=$(openssl rand -hex 32)
echo "DB_PASS: $DB_PASS"
echo "SECRET: $SECRET"
```

Создать файл `.env` в корне проекта:

```bash
nano ~/apps/revmatology/.env
```

Содержимое:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<СГЕНЕРИРОВАННЫЙ_DB_PASS>
POSTGRES_DB=rheumatology_uz
DATABASE_URL=postgresql+asyncpg://postgres:<СГЕНЕРИРОВАННЫЙ_DB_PASS>@db:5432/rheumatology_uz
SECRET_KEY=<СГЕНЕРИРОВАННЫЙ_SECRET>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DOMAIN=rheumassociation.uz
```

---

## Этап 5. Первый запуск (без SSL)

```bash
cd ~/apps/revmatology
docker compose -f docker-compose.prod.yml up -d --build
```

Проверить что всё работает:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

Сайт должен открываться по `http://rheumassociation.uz` (или по IP: `http://138.68.59.141`).

---

## Этап 6. Получить SSL-сертификат

После того как DNS заработал и сайт доступен по HTTP:

```bash
cd ~/apps/revmatology

# Получить сертификат
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d rheumassociation.uz -d www.rheumassociation.uz \
  --email ваш@email.com \
  --agree-tos --no-eff-email
```

Затем раскомментировать HTTPS-блок в `nginx/nginx.conf` (помечен комментариями) и перезапустить:

```bash
docker compose -f docker-compose.prod.yml restart nginx
```

### Автопродление сертификата

Добавить в crontab:

```bash
crontab -e
```

```
0 3 * * * cd ~/apps/revmatology && docker compose -f docker-compose.prod.yml run --rm certbot renew && docker compose -f docker-compose.prod.yml restart nginx
```

---

## Полезные команды

```bash
# Статус контейнеров
docker compose -f docker-compose.prod.yml ps

# Логи всех сервисов
docker compose -f docker-compose.prod.yml logs -f

# Логи конкретного сервиса
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f nginx

# Перезапуск
docker compose -f docker-compose.prod.yml restart

# Полная пересборка
docker compose -f docker-compose.prod.yml up -d --build

# Остановка
docker compose -f docker-compose.prod.yml down

# Зайти в контейнер бэкенда
docker compose -f docker-compose.prod.yml exec backend bash

# Применить миграции Alembic
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

---

## Структура файлов деплоя

```
revmatology/
├── docker-compose.prod.yml    # Продакшен-оркестрация
├── nginx/
│   └── nginx.conf             # Конфиг Nginx (проксирование + SSL)
├── frontend/
│   └── Dockerfile.prod        # Сборка React + Nginx для отдачи статики
├── backend/
│   └── Dockerfile             # FastAPI (без --reload в проде)
├── .env                       # Секреты (НЕ коммитить!)
└── DEPLOY.md                  # Эта инструкция
```
