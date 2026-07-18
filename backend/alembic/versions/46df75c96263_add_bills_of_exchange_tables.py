"""Add bills_of_exchange tables

Revision ID: 46df75c96263
Revises: 98c15071513b
Create Date: 2026-07-18 16:22:19.200854

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '46df75c96263'
down_revision: Union[str, None] = '98c15071513b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'bills_of_exchange',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('customer_id', sa.UUID(), nullable=False),
        sa.Column('drawer_name', sa.String(length=255), nullable=False),
        sa.Column('drawer_address', sa.Text(), nullable=True),
        sa.Column('drawer_phone', sa.String(length=50), nullable=True),
        sa.Column('drawer_email', sa.String(length=255), nullable=True),
        sa.Column('drawee_name', sa.String(length=255), nullable=False),
        sa.Column('drawee_address', sa.Text(), nullable=True),
        sa.Column('drawee_phone', sa.String(length=50), nullable=True),
        sa.Column('drawee_email', sa.String(length=255), nullable=True),
        sa.Column('amount', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('issue_date', sa.Date(), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('place_of_issue', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('boe_pdf_url', sa.String(length=255), nullable=True),
        sa.Column('accepted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.UUID(), nullable=True),
        sa.Column('updated_by', sa.UUID(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'bills_of_exchange_invoices',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('bill_of_exchange_id', sa.UUID(), nullable=False),
        sa.Column('bill_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_by', sa.UUID(), nullable=True),
        sa.Column('updated_by', sa.UUID(), nullable=True),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.ForeignKeyConstraint(['bill_id'], ['bills.id'], ),
        sa.ForeignKeyConstraint(['bill_of_exchange_id'], ['bills_of_exchange.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade() -> None:
    op.drop_table('bills_of_exchange_invoices')
    op.drop_table('bills_of_exchange')
