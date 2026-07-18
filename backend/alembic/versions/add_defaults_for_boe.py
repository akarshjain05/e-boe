"""add defaults for boe

Revision ID: add_defaults_for_boe
Revises: 46df75c96263
Create Date: 2026-07-18 16:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_defaults_for_boe'
down_revision = '46df75c96263'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.alter_column('bills_of_exchange', 'created_at', server_default=sa.text('now()'))
    op.alter_column('bills_of_exchange', 'updated_at', server_default=sa.text('now()'))
    op.alter_column('bills_of_exchange_invoices', 'created_at', server_default=sa.text('now()'))
    op.alter_column('bills_of_exchange_invoices', 'updated_at', server_default=sa.text('now()'))

def downgrade() -> None:
    op.alter_column('bills_of_exchange', 'created_at', server_default=None)
    op.alter_column('bills_of_exchange', 'updated_at', server_default=None)
    op.alter_column('bills_of_exchange_invoices', 'created_at', server_default=None)
    op.alter_column('bills_of_exchange_invoices', 'updated_at', server_default=None)
