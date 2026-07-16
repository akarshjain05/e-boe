"""fix_outstanding_balances

Revision ID: d9a20e585829
Revises: a1b2c3d4e5f6
Create Date: 2026-07-16 15:44:05.287741

"""
from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'd9a20e585829'
down_revision: str | None = 'a1b2c3d4e5f6'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Update customer outstanding_balance based on accepted receivable bills
    op.execute("""
        UPDATE customers
        SET outstanding_balance = cb.total_outstanding
        FROM (
            SELECT c.id, COALESCE(SUM(b.outstanding_amount), 0) as total_outstanding
            FROM customers c
            LEFT JOIN bills b ON c.id = b.customer_id
                AND b.bill_type = 'receivable'
                AND b.status IN ('accepted', 'partially_paid', 'overdue')
                AND b.is_deleted = false
            GROUP BY c.id
        ) cb
        WHERE customers.id = cb.id;
    """)

    # Update creditor outstanding_balance based on accepted payable bills
    op.execute("""
        UPDATE creditors
        SET outstanding_balance = cb.total_outstanding
        FROM (
            SELECT cr.id, COALESCE(SUM(b.outstanding_amount), 0) as total_outstanding
            FROM creditors cr
            LEFT JOIN bills b ON cr.id = b.creditor_id
                AND b.bill_type = 'payable'
                AND b.status IN ('accepted', 'partially_paid', 'overdue')
                AND b.is_deleted = false
            GROUP BY cr.id
        ) cb
        WHERE creditors.id = cb.id;
    """)


def downgrade() -> None:
    pass
