import csv
import sys

csv.field_size_limit(sys.maxsize)

# Read CSV
with open('customers_rows.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

# Create supabase directory if it doesn't exist
import os
os.makedirs('supabase', exist_ok=True)

# Write seed.sql
with open('supabase/seed.sql', 'w', encoding='utf-8') as out:
    out.write('-- Customer data seed file\n')
    out.write('-- Generated from customers_rows.csv\n')
    out.write(f'-- Total records: {len(rows)}\n\n')
    
    out.write('-- Truncate existing customer data (optional - remove if you want to keep existing data)\n')
    out.write('-- TRUNCATE TABLE customers CASCADE;\n\n')
    
    out.write('-- Insert customer data\n')
    for i, row in enumerate(rows):
        if i % 100 == 0:
            out.write(f'\n-- Batch {i//100 + 1} (rows {i+1}-{min(i+100, len(rows))})\n')
        
        # Handle NULL values and escape quotes
        outlet_id = row['outlet_id']
        name = row['name'].replace("'", "''")
        phone = row['phone'].replace("'", "''") if row['phone'] else ''
        email = row['email'].replace("'", "''") if row['email'] else ''
        address = row['address'].replace("'", "''").replace('\n', ' ').replace('\r', ' ') if row['address'] else ''
        notes = row['notes'].replace("'", "''") if row['notes'] else ''
        credit_limit = row['credit_limit'] if row['credit_limit'] else '0'
        outstanding = row['outstanding_balance'] if row['outstanding_balance'] else '0'
        is_active = row['is_active'] if row['is_active'] else 'TRUE'
        created_by = row['created_by'] if row['created_by'] else 'NULL'
        
        # Build INSERT statement
        sql = f"INSERT INTO customers (outlet_id, name, phone, email, address, notes, credit_limit, outstanding_balance, is_active, created_by) VALUES ("
        sql += f"'{outlet_id}', "
        sql += f"'{name}', "
        sql += f"'{phone}', "
        sql += f"'{email}', "
        sql += f"'{address}', "
        sql += f"'{notes}', "
        sql += f"{credit_limit}, "
        sql += f"{outstanding}, "
        sql += f"{is_active}, "
        sql += f"'{created_by}'" if created_by != 'NULL' else 'NULL'
        sql += ");\n"
        
        out.write(sql)

print(f'✅ Created supabase/seed.sql with {len(rows)} INSERT statements')
print(f'📁 File location: supabase/seed.sql')
print(f'\nTo apply the seed data, run:')
print(f'  supabase db push --include-seed')
