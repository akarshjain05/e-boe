"""add network drawee to boe

Revision ID: add_network_drawee_boe
Revises: add_defaults_for_boe
Create Date: 2026-07-18 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_network_drawee_boe'
down_revision = 'add_defaults_for_boe'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('bills_of_exchange', sa.Column('network_drawee_company_id', sa.UUID(), nullable=True))
    op.create_foreign_key('fk_boe_network_drawee', 'bills_of_exchange', 'companies', ['network_drawee_company_id'], ['id'])

def downgrade() -> None:
    op.drop_constraint('fk_boe_network_drawee', 'bills_of_exchange', type_='foreignkey')
    op.drop_column('bills_of_exchange', 'network_drawee_company_id')
