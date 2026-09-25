"""Порядок выкатки бэкенда: миграция раньше нового контейнера (К-12).

Записка в комментарии не краснеет, а этот тест — краснеет. Миграция 006
расширяет схему, не ломая старый контейнер, но общее правило всё равно одно:
новый код не должен подниматься раньше миграции, иначе он читает колонки,
которых ещё нет.
"""
from pathlib import Path

import yaml

WORKFLOW = Path(__file__).resolve().parents[2] / ".github" / "workflows" / "deploy.yml"
COMPOSE = "docker compose -f docker-compose.prod.yml"


def _steps() -> list[dict]:
    workflow = yaml.safe_load(WORKFLOW.read_text(encoding="utf-8"))
    return workflow["jobs"]["build-and-deploy"]["steps"]


def _scripts() -> str:
    """Все ssh-скрипты выкатки подряд — в порядке шагов."""
    return "\n".join(step.get("with", {}).get("script", "") for step in _steps())


def test_migration_runs_before_the_new_backend_starts():
    script = _scripts()
    build = script.index(f"{COMPOSE} build backend")
    migrate = script.index(f"{COMPOSE} run --rm backend python db_upgrade.py")
    start = script.index(f"{COMPOSE} up -d --no-build backend")
    assert build < migrate < start


def test_backend_is_never_rebuilt_into_running_state_before_migrations():
    """`up -d --build backend` поднимал бы новый код до миграции."""
    assert "up -d --build" not in _scripts()


def test_schema_is_prepared_exactly_once():
    """Дубль — шаг `exec ... alembic upgrade head` по живому контейнеру — убран."""
    script = _scripts()
    assert script.count("db_upgrade.py") == 1
    assert "alembic upgrade head" not in script
