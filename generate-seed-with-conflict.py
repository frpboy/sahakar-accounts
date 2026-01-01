import csv

# Read CSV and generate SQL with ON CONFLICT DO NOTHING
with open('customers_rows.csv', 'r', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    
    with open('supabase/seed.sql', 'w', encoding='utf-8') as sqlfile:
        sqlfile.write("-- Customer data seed file\n")
        sqlfile.write("-- Generated from customers_rows.csv with duplicate handling\n")
        sqlfile.write("-- ON CONFLICT (internal_customer_id) DO NOTHING will skip existing customers with same ID\n\n")
        
        count = 0
        for row in reader:
            count += 1
            
            # Helper to escape single quotes and handle NULLs
            def format_val(val, quote=True):
                if val is None or val.strip().upper() == 'NULL' or val.strip() == '':
                    return 'NULL'
                escaped = val.replace("'", "''")
                if quote:
                    return f"'{escaped}'"
                return escaped

            # Build INSERT statement
            # Columns: outlet_id, name, phone, email, address, notes, credit_limit, outstanding_balance, is_active, created_by, referred_by, internal_customer_id, customer_code
            
            outlet_id = format_val(row.get('outlet_id'))
            name = format_val(row.get('name'))
            phone = format_val(row.get('phone'))
            email = format_val(row.get('email'))
            address = format_val(row.get('address'))
            notes = format_val(row.get('notes'))
            credit_limit = row.get('credit_limit') if row.get('credit_limit') else '0'
            outstanding_balance = row.get('outstanding_balance') if row.get('outstanding_balance') else '0'
            is_active = row.get('is_active').upper() if row.get('is_active') else 'TRUE'
            created_by = format_val(row.get('created_by'))
            referred_by = format_val(row.get('referred_by'))
            internal_id = format_val(row.get('internal_customer_id'))
            customer_code = format_val(row.get('customer_code'))

            sql = f"""INSERT INTO customers (outlet_id, name, phone, email, address, notes, credit_limit, outstanding_balance, is_active, created_by, referred_by, internal_customer_id, customer_code) VALUES ({outlet_id}, {name}, {phone}, {email}, {address}, {notes}, {credit_limit}, {outstanding_balance}, {is_active}, {created_by}, {referred_by}, {internal_id}, {customer_code}) ON CONFLICT (internal_customer_id) DO NOTHING;
"""
            sqlfile.write(sql)
            
            if count % 1000 == 0:
                print(f"Processed {count} rows...")
        
        print(f"✅ Successfully generated {count} INSERT statements in supabase/seed.sql")
        sqlfile.write(f"\n-- Total: {count} customer records\n")
