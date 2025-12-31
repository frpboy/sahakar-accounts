import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const input = fs.readFileSync(path.join(__dirname, '../temp_input.txt'), 'utf8');

// The input format is SQL INSERT statement: ('UUID', 'Name', ...), ('UUID', ...
// We need to extract the UUIDs from this format.
// Regex to find: ('UUID',
const uuidRegex = /\('([0-9a-fA-F-]{36})'/g;
const ids = [];
let match;

while ((match = uuidRegex.exec(input)) !== null) {
    ids.push(match[1]);
}

console.log(`Found ${ids.length} IDs to delete.`);

// Generate SQL
const sql = `
DO $$
DECLARE
    target_ids UUID[] := ARRAY[
        '${ids.join("',\n        '")}'
    ]::UUID[];
BEGIN
    -- 1. Detach users first (set outlet_id to NULL)
    UPDATE users 
    SET outlet_id = NULL 
    WHERE outlet_id = ANY(target_ids);

    -- 2. Delete transactions (linked via daily_records)
    DELETE FROM transactions 
    WHERE daily_record_id IN (
        SELECT id FROM daily_records WHERE outlet_id = ANY(target_ids)
    );

    -- 3. Delete daily_records
    DELETE FROM daily_records 
    WHERE outlet_id = ANY(target_ids);

    -- 4. Delete monthly_closure_snapshots
    DELETE FROM monthly_closure_snapshots 
    WHERE outlet_id = ANY(target_ids);

    -- 5. Delete monthly_closures
    DELETE FROM monthly_closures 
    WHERE outlet_id = ANY(target_ids);

    -- 6. Finally delete outlets
    DELETE FROM outlets 
    WHERE id = ANY(target_ids);
    
    RAISE NOTICE 'Deleted % outlets and related data', array_length(target_ids, 1);
END $$;
`;

fs.writeFileSync(path.join(__dirname, '../supabase/migrations/20251231_cleanup_outlets.sql'), sql);
console.log('Migration file created.');
