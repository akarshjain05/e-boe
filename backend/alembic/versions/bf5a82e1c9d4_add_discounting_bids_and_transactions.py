"""Add discounting bids and transactions

Revision ID: bf5a82e1c9d4
Revises: af753798f338
Create Date: 2026-07-19 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'bf5a82e1c9d4'
down_revision: Union[str, None] = 'af753798f338'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # We must explicitly add the new fk column to discounting_requests to allow selected_bid
    # But wait, discounting_requests already had selected_bid_id referencing boe_bids. 
    # We need to drop that constraint before dropping boe_bids.
    op.drop_constraint('fk_discounting_requests_selected_bid_id_boe_bids', 'discounting_requests', type_='foreignkey')
    
    op.drop_table('boe_bids')

    op.create_table(
        'discounting_bids',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('discounting_request_id', sa.UUID(), nullable=False),
        sa.Column('financier_company_id', sa.UUID(), nullable=False),
        sa.Column('discount_rate_bps', sa.Integer(), nullable=False),
        sa.Column('platform_fee_bps', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('computed_discount_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('computed_net_payable', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('bid_submitted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        
        sa.ForeignKeyConstraint(['discounting_request_id'], ['discounting_requests.id'], ),
        sa.ForeignKeyConstraint(['financier_company_id'], ['companies.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'discounting_transactions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('discounting_request_id', sa.UUID(), nullable=False),
        sa.Column('bid_id', sa.UUID(), nullable=False),
        sa.Column('financier_company_id', sa.UUID(), nullable=False),
        sa.Column('seller_company_id', sa.UUID(), nullable=False),
        sa.Column('disbursement_reference', sa.String(length=100), nullable=False),
        sa.Column('disbursed_amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('disbursed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('maturity_amount_due', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('maturity_settlement_status', sa.String(length=50), nullable=False),
        sa.Column('settled_amount', sa.Numeric(precision=15, scale=2), nullable=False, server_default='0'),
        sa.Column('settled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('recourse_type', sa.String(length=50), nullable=False, server_default='without_recourse'),
        
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        
        sa.ForeignKeyConstraint(['discounting_request_id'], ['discounting_requests.id'], ),
        sa.ForeignKeyConstraint(['bid_id'], ['discounting_bids.id'], ),
        sa.ForeignKeyConstraint(['financier_company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['seller_company_id'], ['companies.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_foreign_key('discounting_requests_selected_bid_id_fkey', 'discounting_requests', 'discounting_bids', ['selected_bid_id'], ['id'])


def downgrade() -> None:
    pass
