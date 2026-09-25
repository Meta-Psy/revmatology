"""Add certificate_recipients.email and certificate_templates.issue_mode (К-12)

Revision ID: 006
Revises: 005
Create Date: 2026-09-24

Шаг «расширить» из выкатки в два шага. Миграция только добавляет: старая
колонка certificate_templates.is_open остаётся в БД, данные из неё
переезжают в issue_mode. Так работающий старый контейнер переживает
применение миграции — он читает is_open, и она на месте, — а новый код о ней
уже не знает и вставляет строки без неё (отсюда умолчание false).
Убирает колонку следующая миграция (007), отдельной выкаткой после успешной.
Порядок шагов на сервере — в .github/workflows/deploy.yml.

"""
from typing import Sequence, Union

from alembic import context, op
import sqlalchemy as sa

revision: str = '006'
down_revision: Union[str, None] = '005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

CHECK_NAME = 'ck_certificate_templates_issue_mode'
CHECK_SQL = "issue_mode IN ('auto', 'open', 'closed')"
EMAIL_INDEX = 'ix_certificate_recipients_email'
TEMPLATES = 'certificate_templates'


def _has_column(table: str, column: str, offline: bool) -> bool:
    """Есть ли колонка в живой БД.

    На свежей установке main.py создаёт таблицы через create_all уже в новом
    виде — тогда повторное добавление упало бы. В офлайн-режиме
    (`alembic upgrade --sql`) соединения нет: считаем состояние прода, то есть
    старые колонки на месте, новых нет.
    """
    if offline:
        return column in ('is_open',)
    return column in {col['name'] for col in sa.inspect(op.get_bind()).get_columns(table)}


def _has_check(table: str, name: str) -> bool:
    return name in {c['name'] for c in sa.inspect(op.get_bind()).get_check_constraints(table)}


def _sqlite() -> bool:
    """SQLite не умеет ни ALTER TABLE ADD CONSTRAINT, ни ALTER COLUMN.

    Прод — PostgreSQL; на SQLite (только разработка) CHECK остаётся в модели и
    попадает в БД при create_all, а правка и удаление колонок идут через
    batch_alter_table: он пересоздаёт таблицу целиком.
    """
    return not context.is_offline_mode() and op.get_bind().dialect.name == 'sqlite'


def upgrade() -> None:
    offline = context.is_offline_mode()

    if not _has_column('certificate_recipients', 'email', offline):
        op.add_column('certificate_recipients', sa.Column('email', sa.String(255), nullable=True))
        op.create_index(EMAIL_INDEX, 'certificate_recipients', ['email'])

    if not _has_column(TEMPLATES, 'issue_mode', offline):
        op.add_column(TEMPLATES,
                      sa.Column('issue_mode', sa.String(10), nullable=False, server_default='auto'))
        if not _sqlite():
            op.create_check_constraint(CHECK_NAME, TEMPLATES, CHECK_SQL)

    if _has_column(TEMPLATES, 'is_open', offline):
        # открытая вручную выдача остаётся открытой, остальное — на автомат
        op.execute("UPDATE certificate_templates SET issue_mode = 'open' WHERE is_open")
        # колонка NOT NULL без умолчания: новый код вставляет строки без неё,
        # и без DEFAULT первая же новая настройка сертификатов упала бы
        if _sqlite():
            with op.batch_alter_table(TEMPLATES) as batch:
                batch.alter_column('is_open', existing_type=sa.Boolean(),
                                   existing_nullable=False, server_default=sa.false())
        else:
            op.alter_column(TEMPLATES, 'is_open', existing_type=sa.Boolean(),
                            existing_nullable=False, server_default=sa.false())


def downgrade() -> None:
    offline = context.is_offline_mode()

    if not _has_column(TEMPLATES, 'is_open', offline):
        # свежая установка: колонки никогда не было, create_all работал по модели
        op.add_column(TEMPLATES,
                      sa.Column('is_open', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.execute("UPDATE certificate_templates SET is_open = true WHERE issue_mode = 'open'")

    if _sqlite():
        # CHECK ссылается на issue_mode: SQLite не даст удалить колонку, пока он
        # есть, а на базе от миграции его нет вовсе — отсюда проверка
        drop_check = _has_check(TEMPLATES, CHECK_NAME)
        with op.batch_alter_table(TEMPLATES) as batch:
            if drop_check:
                batch.drop_constraint(CHECK_NAME, type_='check')
            batch.drop_column('issue_mode')
    else:
        op.drop_constraint(CHECK_NAME, TEMPLATES, type_='check')
        op.drop_column(TEMPLATES, 'issue_mode')

    op.drop_index(EMAIL_INDEX, table_name='certificate_recipients')
    op.drop_column('certificate_recipients', 'email')
