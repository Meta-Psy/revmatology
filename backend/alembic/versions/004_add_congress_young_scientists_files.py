"""Add young_scientists_file_ru/uz/en to congresses (PDF положения конкурса молодых учёных)

Revision ID: 004
Revises: 003
Create Date: 2026-09-14

"""
from typing import Sequence, Union

from alembic import context, op
import sqlalchemy as sa

revision: str = '004'
down_revision: Union[str, None] = '003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE = 'congresses'
COLUMNS = ('young_scientists_file_ru', 'young_scientists_file_uz', 'young_scientists_file_en')


def _existing_columns() -> set:
    """Колонки таблицы в живой БД.

    На свежей установке main.py создаёт таблицу через create_all уже с новыми
    колонками — тогда их повторное добавление упало бы. В офлайн-режиме
    (`alembic upgrade --sql`) соединения нет, инспектировать нечего.
    """
    if context.is_offline_mode():
        return set()
    return {col['name'] for col in sa.inspect(op.get_bind()).get_columns(TABLE)}


def upgrade() -> None:
    existing = _existing_columns()
    for name in COLUMNS:
        if name not in existing:
            op.add_column(TABLE, sa.Column(name, sa.String(500), nullable=True))


def downgrade() -> None:
    for name in reversed(COLUMNS):
        op.drop_column(TABLE, name)
