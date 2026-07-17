"""Add hsn_sac_codes table

Revision ID: 98c15071513b
Revises: 01a106cf9979
Create Date: 2026-07-17 21:23:40.155657

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '98c15071513b'
down_revision: Union[str, None] = '01a106cf9979'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'hsn_sac_codes',
        sa.Column('hsn_cd', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('hsn_cd')
    )
    op.create_index(op.f('ix_hsn_sac_codes_hsn_cd'), 'hsn_sac_codes', ['hsn_cd'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_hsn_sac_codes_hsn_cd'), table_name='hsn_sac_codes')
    op.drop_table('hsn_sac_codes')
