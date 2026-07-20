"""add_discounting_permissions

Revision ID: 0bff1297b5ca
Revises: bf5a82e1c9d4
Create Date: 2026-07-20 09:44:04.690919

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0bff1297b5ca'
down_revision: Union[str, None] = 'bf5a82e1c9d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


import uuid
from datetime import datetime

def upgrade() -> None:
    # Insert permissions
    op.execute(
        """
        INSERT INTO permissions (id, name, resource, action, description, created_at, updated_at)
        VALUES 
        ('""" + str(uuid.uuid4()) + """', 'discounting.manage', 'discounting', 'manage', 'Can manage discounting requests', NOW(), NOW()),
        ('""" + str(uuid.uuid4()) + """', 'discounting.bid', 'discounting', 'bid', 'Can submit bids as a financier', NOW(), NOW())
        ON CONFLICT (name) DO NOTHING;
        """
    )
    
    # We should also attach discounting.manage to default roles like Admin or Manager
    op.execute(
        """
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id
        FROM roles r, permissions p
        WHERE p.name = 'discounting.manage' 
          AND r.name IN ('Company Admin', 'Manager')
        ON CONFLICT DO NOTHING;
        """
    )
    
    # And discounting.bid to Financier Role if we have one
    op.execute(
        """
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT r.id, p.id
        FROM roles r, permissions p
        WHERE p.name = 'discounting.bid' 
          AND r.name IN ('Financier')
        ON CONFLICT DO NOTHING;
        """
    )


def downgrade() -> None:
    op.execute("DELETE FROM permissions WHERE name IN ('discounting.manage', 'discounting.bid')")
