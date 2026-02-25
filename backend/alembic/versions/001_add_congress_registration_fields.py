"""Add new fields to congress_registrations

Revision ID: 001
Revises: None
Create Date: 2026-02-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('congress_registrations', sa.Column('academic_degree', sa.String(100), nullable=True))
    op.add_column('congress_registrations', sa.Column('academic_title', sa.String(100), nullable=True))
    op.add_column('congress_registrations', sa.Column('institution_address', sa.String(500), nullable=True))
    op.add_column('congress_registrations', sa.Column('participation_form', sa.String(50), nullable=True))
    op.add_column('congress_registrations', sa.Column('report_title', sa.String(500), nullable=True))
    op.add_column('congress_registrations', sa.Column('is_young_scientist', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('congress_registrations', sa.Column('needs_hotel', sa.Boolean(), nullable=True, server_default='false'))


def downgrade() -> None:
    op.drop_column('congress_registrations', 'needs_hotel')
    op.drop_column('congress_registrations', 'is_young_scientist')
    op.drop_column('congress_registrations', 'report_title')
    op.drop_column('congress_registrations', 'participation_form')
    op.drop_column('congress_registrations', 'institution_address')
    op.drop_column('congress_registrations', 'academic_title')
    op.drop_column('congress_registrations', 'academic_degree')
