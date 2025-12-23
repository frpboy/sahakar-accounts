-- ============================================================================
-- AUTO-SYNC GOOGLE SHEETS ON RECORD LOCK
-- ============================================================================
-- This creates a database trigger that automatically syncs locked records
-- to Google Sheets when a daily record status changes to 'locked'
-- ============================================================================

-- Create function to call webhook
CREATE OR REPLACE FUNCTION trigger_google_sheets_sync()
RETURNS TRIGGER AS $$
DECLARE
    webhook_url TEXT;
BEGIN
    -- Only trigger if status changed to 'locked'
    IF NEW.status = 'locked' AND (OLD.status IS DISTINCT FROM 'locked') THEN
        
        -- Get the webhook URL from environment (set in Supabase dashboard)
        -- You'll need to set this in Supabase Settings → Database → Extensions → pg_net
        webhook_url := current_setting('app.settings.sync_webhook_url', TRUE);
        
        -- Call the sync API endpoint (requires pg_net extension or use pg_cron)
        -- For now, we'll log the event and you can set up a cron job to check for new locked records
        
        RAISE NOTICE 'Record locked: % - Triggering Google Sheets sync', NEW.id;
        
        -- Option 1: Use pg_net (if available)
        -- PERFORM net.http_post(
        --     url := webhook_url || '/api/sync/google-sheets',
        --     headers := '{"Content-Type": "application/json"}'::jsonb,
        --     body := jsonb_build_object('record_id', NEW.id)
        -- );
        
        -- Option 2: Update a flag for cron job to process
        NEW.synced_to_sheet := FALSE;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on daily_records table
DROP TRIGGER IF EXISTS auto_sync_on_lock ON daily_records;

CREATE TRIGGER auto_sync_on_lock
    BEFORE UPDATE ON daily_records
    FOR EACH ROW
    EXECUTE FUNCTION trigger_google_sheets_sync();

-- ============================================================================
-- ALTERNATIVE: SCHEDULED SYNC JOB
-- ============================================================================
-- If you prefer a scheduled approach instead of real-time

-- Create function to sync pending records
CREATE OR REPLACE FUNCTION sync_pending_locked_records()
RETURNS void AS $$
DECLARE
    record_count INTEGER;
BEGIN
    -- Count records that need syncing
    SELECT COUNT(*) INTO record_count
    FROM daily_records
    WHERE status = 'locked' 
    AND (synced_to_sheet = FALSE OR synced_to_sheet IS NULL);
    
    IF record_count > 0 THEN
        RAISE NOTICE 'Found % locked records pending sync', record_count;
        
        -- You would call your API here
        -- For now, just mark them as needing attention
        -- The actual sync will happen via the API endpoint
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule this to run every hour using pg_cron (if available):
-- SELECT cron.schedule(
--     'sync-locked-records',
--     '0 * * * *',  -- Every hour
--     $$SELECT sync_pending_locked_records()$$
-- );

-- ============================================================================
-- MANUAL TRIGGER ALTERNATIVE
-- ============================================================================
-- If you don't have pg_net or pg_cron, use a simple flag system

-- The trigger above already sets synced_to_sheet = FALSE
-- Your sync API can query for these records:

-- SELECT * FROM daily_records 
-- WHERE status = 'locked' 
-- AND (synced_to_sheet = FALSE OR synced_to_sheet IS NULL);

-- Then mark them as synced after successful sync:
-- UPDATE daily_records SET synced_to_sheet = TRUE WHERE id = ...

-- ============================================================================
-- TESTING
-- ============================================================================
-- Test the trigger:
-- UPDATE daily_records SET status = 'locked' WHERE id = '...';
-- Check the logs for the NOTICE message

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. For real-time webhooks, you need pg_net extension enabled in Supabase
-- 2. For scheduled jobs, you need pg_cron extension
-- 3. The fallback is to query for unsynced locked records via API
-- 4. Current implementation: Trigger sets synced_to_sheet = FALSE,
--    and your sync API should check for these records
-- ============================================================================
