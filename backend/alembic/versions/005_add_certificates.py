"""Add certificate_templates and certificate_recipients (именные сертификаты конгресса, К-11)

Revision ID: 005
Revises: 004
Create Date: 2026-09-22

"""
from typing import Sequence, Union

from alembic import context, op
import sqlalchemy as sa

revision: str = '005'
down_revision: Union[str, None] = '004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _existing_tables() -> set:
    """Таблицы в живой БД.

    На свежей установке main.py создаёт таблицы через create_all — тогда
    повторное создание упало бы. В офлайн-режиме соединения нет.
    """
    if context.is_offline_mode():
        return set()
    return set(sa.inspect(op.get_bind()).get_table_names())


def upgrade() -> None:
    existing = _existing_tables()
    if 'certificate_templates' not in existing:
        op.create_table(
            'certificate_templates',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('congress_id', sa.Integer(), sa.ForeignKey('congresses.id', ondelete='CASCADE'), nullable=False),
            sa.Column('pdf', sa.LargeBinary(), nullable=True),
            sa.Column('pdf_filename', sa.String(255), nullable=True),
            sa.Column('box_x_mm', sa.Float(), nullable=False),
            sa.Column('box_y_mm', sa.Float(), nullable=False),
            sa.Column('box_w_mm', sa.Float(), nullable=False),
            sa.Column('box_h_mm', sa.Float(), nullable=False),
            sa.Column('font_max_pt', sa.Float(), nullable=False),
            sa.Column('font_min_pt', sa.Float(), nullable=False),
            sa.Column('text_color', sa.String(7), nullable=False),
            sa.Column('is_open', sa.Boolean(), nullable=False),
            sa.Column('number_box_x_mm', sa.Float(), nullable=True),
            sa.Column('number_box_y_mm', sa.Float(), nullable=True),
            sa.Column('number_box_w_mm', sa.Float(), nullable=True),
            sa.Column('number_box_h_mm', sa.Float(), nullable=True),
            sa.Column('number_font_pt', sa.Float(), nullable=False),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.UniqueConstraint('congress_id'),
        )
        op.create_index('ix_certificate_templates_id', 'certificate_templates', ['id'])
    if 'certificate_recipients' not in existing:
        op.create_table(
            'certificate_recipients',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('congress_id', sa.Integer(), sa.ForeignKey('congresses.id', ondelete='CASCADE'), nullable=False),
            sa.Column('full_name', sa.String(300), nullable=False),
            sa.Column('name_key', sa.String(300), nullable=False),
            sa.Column('phone_digits', sa.String(20), nullable=True),
            sa.Column('download_count', sa.Integer(), nullable=False),
            sa.Column('number', sa.Integer(), nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.UniqueConstraint('congress_id', 'number', name='uq_certificate_recipients_congress_number'),
        )
        op.create_index('ix_certificate_recipients_id', 'certificate_recipients', ['id'])
        op.create_index('ix_certificate_recipients_congress_id', 'certificate_recipients', ['congress_id'])
        op.create_index('ix_certificate_recipients_name_key', 'certificate_recipients', ['name_key'])


def downgrade() -> None:
    op.drop_table('certificate_recipients')
    op.drop_table('certificate_templates')
