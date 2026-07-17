import glob

files = glob.glob('backend/app/models/*.py')
for f in files:
    with open(f, 'r') as file:
        content = file.read()
    
    if 'JSONB' in content:
        content = content.replace(
            'from sqlalchemy.dialects.postgresql import JSONB',
            'from sqlalchemy.dialects.postgresql import JSONB\nfrom sqlalchemy.types import JSON'
        )
        content = content.replace('mapped_column(JSONB', 'mapped_column(JSON().with_variant(JSONB, "postgresql")')
        content = content.replace('mapped_column(JSONB,', 'mapped_column(JSON().with_variant(JSONB, "postgresql"),')
        
        # fix the double comma issue in case it matched the second replace after the first
        content = content.replace('JSON().with_variant(JSONB, "postgresql")()', 'JSON().with_variant(JSONB, "postgresql")')
        
        with open(f, 'w') as file:
            file.write(content)
