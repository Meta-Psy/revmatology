#!/bin/bash
set -e

echo "=== Деплой rheumassociation.uz ==="

# 1. Сборка фронтенда
echo ""
echo "[1/3] Сборка фронтенда..."
docker run --rm \
  -v "$(pwd)/frontend:/app" \
  -w /app \
  node:20-alpine \
  sh -c "npm ci && npm run build"

echo "Фронтенд собран в frontend/dist/"

# 2. Сборка и запуск контейнеров
echo ""
echo "[2/3] Сборка и запуск контейнеров..."
docker compose -f docker-compose.prod.yml up -d --build

# 3. Проверка
echo ""
echo "[3/3] Проверка..."
sleep 3
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=== Деплой завершен ==="
echo "Сайт: http://rheumassociation.uz"
