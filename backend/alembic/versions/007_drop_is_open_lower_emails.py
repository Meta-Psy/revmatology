"""Drop certificate_templates.is_open, lowercase user emails, index lower(email) (К-13)

Revision ID: 007
Revises: 006
Create Date: 2026-09-25

Шаг «сузить» из выкатки в два шага (§8 design-doc К-12): 006 добавила
issue_mode, но колонку is_open оставила — иначе работающий старый контейнер
упал бы на своих же запросах посреди миграции. Выкатка 006 на проде прошла,
новый код о is_open не знает с К-12, поэтому здесь колонка снимается.

Заодно две правки по почтам пользователей:

* хранимая почта приводится к нижнему регистру — регистрация и вход держат
  один вид (`functions/crud.normalize_email`), но записи, заведённые до К-12,
  остались как введены. Приводятся только бесконфликтные: `users.email`
  уникален, а в живой базе есть пары «одна почта в разном регистре», и сливать
  учётные записи — не дело миграции (решение Alex 2026-09-25);
* индекс по `lower(email)` — вход ищет ровно по этому выражению, без индекса
  это seq scan по всей таблице. Не уникальный: из-за тех же пар уникальный
  индекс просто не создался бы.

"""
from typing import Sequence, Union

from alembic import context, op
import sqlalchemy as sa

revision: str = '007'
down_revision: Union[str, None] = '006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TEMPLATES = 'certificate_templates'
LOWER_INDEX = 'ix_users_email_lower'

# Приводим только те строки, для которых нижний регистр не занят другой
# записью. Сравниваются нижние регистры обеих сторон, а не lower() с почтой
# как есть: пара бывает и из двух записей не в нижнем регистре
# («Both@Mail.uz» и «both@Mail.UZ»), и тогда мягкое условие оказалось бы верным
# для обеих сразу — один UPDATE, две одинаковые почты, нарушение уникальности.
LOWERCASE_EMAILS = """
UPDATE users SET email = lower(email)
WHERE email <> lower(email)
  AND NOT EXISTS (
      SELECT 1 FROM users AS other
      WHERE other.id <> users.id AND lower(other.email) = lower(users.email)
  )
"""

# Голым SQL, а не op.create_index: индекс по выражению, и IF NOT EXISTS
# понимают оба диалекта — на свежей установке его уже создал create_all по
# модели (Index в User.__table_args__).
CREATE_LOWER_INDEX = f"CREATE INDEX IF NOT EXISTS {LOWER_INDEX} ON users (lower(email))"
DROP_LOWER_INDEX = f"DROP INDEX IF EXISTS {LOWER_INDEX}"


def _has_is_open(offline_answer: bool) -> bool:
    """Есть ли колонка is_open в живой БД.

    На свежей установке схему построил create_all по модели, где is_open нет
    вовсе, — снимать нечего, а добавлять при откате есть что. В офлайн-режиме
    (`alembic upgrade --sql`) соединения нет: считаем состояние прода на этом
    шаге, а оно зависит от направления — до апгрейда колонка есть, после нет.
    """
    if context.is_offline_mode():
        return offline_answer
    return 'is_open' in {col['name'] for col in sa.inspect(op.get_bind()).get_columns(TEMPLATES)}


def _sqlite() -> bool:
    """SQLite не умеет DROP COLUMN в ALTER TABLE — только пересоздание таблицы.

    Прод — PostgreSQL; на SQLite (тесты и разработка) колонка снимается через
    batch_alter_table.
    """
    return not context.is_offline_mode() and op.get_bind().dialect.name == 'sqlite'


def upgrade() -> None:
    op.execute(LOWERCASE_EMAILS)
    op.execute(CREATE_LOWER_INDEX)

    if _has_is_open(offline_answer=True):
        if _sqlite():
            with op.batch_alter_table(TEMPLATES) as batch:
                batch.drop_column('is_open')
        else:
            op.drop_column(TEMPLATES, 'is_open')


def downgrade() -> None:
    if not _has_is_open(offline_answer=False):
        op.add_column(TEMPLATES,
                      sa.Column('is_open', sa.Boolean(), nullable=False, server_default=sa.false()))
    # обратный ход 006: открытая выдача возвращается в старый флаг
    op.execute("UPDATE certificate_templates SET is_open = true WHERE issue_mode = 'open'")

    # регистр почт откатом не восстановить — чиним только схему
    op.execute(DROP_LOWER_INDEX)
