-- Anomaly hardening: ownership, linkage, resolution evidence, dedup/grouping, indexes

-- Link anomalies to business days
ALTER TABLE anomalies
  ADD COLUMN IF NOT EXISTS business_day_id UUID REFERENCES business_days(id) ON DELETE SET NULL;

-- Ownership / assignment model
ALTER TABLE anomalies
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved','waived'));

-- Resolution evidence
ALTER TABLE anomalies
  ADD COLUMN IF NOT EXISTS resolution_attachment_url TEXT;

-- Noise reduction: grouping and throttling support
ALTER TABLE anomalies
  ADD COLUMN IF NOT EXISTS fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS occurrences_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS first_detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Unique fingerprint to deduplicate similar anomalies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uq_anomalies_fingerprint'
  ) THEN
    CREATE UNIQUE INDEX uq_anomalies_fingerprint ON anomalies((fingerprint)) WHERE fingerprint IS NOT NULL;
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_anomalies_business_day_id ON anomalies(business_day_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_assigned_to ON anomalies(assigned_to);
CREATE INDEX IF NOT EXISTS idx_anomalies_status ON anomalies(status);
CREATE INDEX IF NOT EXISTS idx_anomalies_last_detected_at ON anomalies(last_detected_at DESC);

-- History enhancement: optional attachment on actions (if not present)
ALTER TABLE anomaly_history
  ADD COLUMN IF NOT EXISTS attachment_url TEXT;

