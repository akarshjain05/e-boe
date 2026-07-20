"""Add link to notifications and make user_id optional

Revision ID: be897eac254d
Revises: 0bff1297b5ca
Create Date: 2026-07-20 11:01:31.669687

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'be897eac254d'
down_revision: Union[str, None] = '0bff1297b5ca'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('notifications', sa.Column('link', sa.String(length=255), nullable=True))
    op.alter_column('notifications', 'user_id',
               existing_type=sa.UUID(),
               nullable=True)

def downgrade() -> None:
    op.alter_column('notifications', 'user_id',
               existing_type=sa.UUID(),
               nullable=False)
    op.drop_column('notifications', 'link')
