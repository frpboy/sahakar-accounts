-- Anomalies table for storing detected anomalies
CREATE TABLE anomalies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('amount_variance', 'frequency_spike', 'time_anomaly', 'duplicate_transaction', 'unusual_vendor', 'budget_exceeded', 'negative_balance', 'unauthorized_access')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Anomaly history table for tracking changes
CREATE TABLE anomaly_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    anomaly_id UUID NOT NULL REFERENCES anomalies(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'resolved', 'reopened', 'commented', 'escalated')),
    performed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Export logs table for tracking data exports
CREATE TABLE export_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    export_type VARCHAR(50) NOT NULL CHECK (export_type IN ('anomalies', 'transactions', 'audit_logs', 'financial_summary')),
    format VARCHAR(10) NOT NULL CHECK (format IN ('csv', 'json', 'pdf')),
    filters JSONB DEFAULT '{}',
    record_count INTEGER DEFAULT 0,
    file_size_bytes INTEGER,
    file_path TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_anomalies_outlet_id ON anomalies(outlet_id);
CREATE INDEX idx_anomalies_type ON anomalies(type);
CREATE INDEX idx_anomalies_severity ON anomalies(severity);
CREATE INDEX idx_anomalies_detected_at ON anomalies(detected_at DESC);
CREATE INDEX idx_anomalies_resolved_at ON anomalies(resolved_at);
CREATE INDEX idx_anomalies_composite ON anomalies(outlet_id, type, severity, detected_at DESC);

CREATE INDEX idx_anomaly_history_anomaly_id ON anomaly_history(anomaly_id);
CREATE INDEX idx_anomaly_history_performed_by ON anomaly_history(performed_by);
CREATE INDEX idx_anomaly_history_created_at ON anomaly_history(created_at DESC);

CREATE INDEX idx_export_logs_user_id ON export_logs(user_id);
CREATE INDEX idx_export_logs_export_type ON export_logs(export_type);
CREATE INDEX idx_export_logs_status ON export_logs(status);
CREATE INDEX idx_export_logs_created_at ON export_logs(created_at DESC);

-- RLS Policies for anomalies
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;

-- View policy: outlet members can view their outlet's anomalies
CREATE POLICY "Anomalies viewable by outlet members" ON anomalies
    FOR SELECT TO authenticated USING (
        outlet_id IN (
            SELECT outlet_id FROM users WHERE id = auth.uid()
        ) OR 
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'master_admin', 'ho_accountant', 'auditor')
        )
    );

-- Insert policy: only automated systems and admins can create anomalies
CREATE POLICY "Anomalies insertable by system" ON anomalies
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'master_admin', 'ho_accountant', 'auditor')
        )
    );

-- Update policy: only admins and accountants can update anomalies
CREATE POLICY "Anomalies updatable by authorized roles" ON anomalies
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'master_admin', 'ho_accountant', 'auditor')
        )
    );

-- RLS Policies for anomaly_history
ALTER TABLE anomaly_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anomaly history viewable by outlet members" ON anomaly_history
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM anomalies a 
            WHERE a.id = anomaly_history.anomaly_id 
            AND (
                a.outlet_id IN (SELECT outlet_id FROM users WHERE id = auth.uid()) OR
                EXISTS (
                    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'master_admin', 'ho_accountant', 'auditor')
                )
            )
        )
    );

CREATE POLICY "Anomaly history insertable by authorized roles" ON anomaly_history
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'master_admin', 'ho_accountant', 'auditor')
        )
    );

-- RLS Policies for export_logs
ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Export logs viewable by owner" ON export_logs
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Export logs insertable by authenticated users" ON export_logs
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Export logs updatable by owner" ON export_logs
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Enable realtime for anomalies
ALTER PUBLICATION supabase_realtime ADD TABLE anomalies;
ALTER PUBLICATION supabase_realtime ADD TABLE anomaly_history;

-- Grant necessary permissions
GRANT SELECT ON anomalies TO authenticated;
GRANT INSERT ON anomalies TO authenticated;
GRANT UPDATE ON anomalies TO authenticated;

GRANT SELECT ON anomaly_history TO authenticated;
GRANT INSERT ON anomaly_history TO authenticated;

GRANT SELECT ON export_logs TO authenticated;
GRANT INSERT ON export_logs TO authenticated;
GRANT UPDATE ON export_logs TO authenticated;