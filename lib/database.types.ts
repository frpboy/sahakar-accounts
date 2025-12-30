export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            audit_logs: {
                Row: {
                    id: string
                    user_id: string | null
                    action: string | null
                    entity: string | null
                    entity_id: string | null
                    old_data: Json | null
                    new_data: Json | null
                    created_at: string | null
                    reason: string | null
                    ip_address: string | null
                    user_agent: string | null
                    severity: 'normal' | 'warning' | 'critical' | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    action?: string | null
                    entity?: string | null
                    entity_id?: string | null
                    old_data?: Json | null
                    new_data?: Json | null
                    created_at?: string | null
                    reason?: string | null
                    ip_address?: string | null
                    user_agent?: string | null
                    severity?: 'normal' | 'warning' | 'critical' | null
                }
                Update: {
                    user_id?: string | null
                    action?: string | null
                    entity?: string | null
                    entity_id?: string | null
                    old_data?: Json | null
                    new_data?: Json | null
                    created_at?: string | null
                    reason?: string | null
                    ip_address?: string | null
                    user_agent?: string | null
                    severity?: 'normal' | 'warning' | 'critical' | null
                }
                Relationships: []
            }
            auditor_access_log: {
                Row: {
                    id: string
                    auditor_id: string
                    outlet_id: string | null
                    action:
                        | 'view_dashboard'
                        | 'view_record'
                        | 'view_transaction'
                        | 'export_excel'
                        | 'export_pdf'
                        | 'filter_data'
                    entity_type: string | null
                    entity_id: string | null
                    accessed_at: string
                    ip_address: string | null
                    user_agent: string | null
                }
                Insert: {
                    id?: string
                    auditor_id: string
                    outlet_id?: string | null
                    action:
                        | 'view_dashboard'
                        | 'view_record'
                        | 'view_transaction'
                        | 'export_excel'
                        | 'export_pdf'
                        | 'filter_data'
                    entity_type?: string | null
                    entity_id?: string | null
                    accessed_at?: string
                    ip_address?: string | null
                    user_agent?: string | null
                }
                Update: {
                    auditor_id?: string
                    outlet_id?: string | null
                    action?:
                        | 'view_dashboard'
                        | 'view_record'
                        | 'view_transaction'
                        | 'export_excel'
                        | 'export_pdf'
                        | 'filter_data'
                    entity_type?: string | null
                    entity_id?: string | null
                    accessed_at?: string
                    ip_address?: string | null
                    user_agent?: string | null
                }
                Relationships: []
            }
            auditor_outlets: {
                Row: {
                    id: string
                    user_id: string | null
                    outlet_id: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    outlet_id?: string | null
                }
                Update: {
                    user_id?: string | null
                    outlet_id?: string | null
                }
                Relationships: []
            }
            business_days: {
                Row: {
                    id: string
                    outlet_id: string | null
                    date: string
                    opening_cash: number
                    opening_upi: number
                    closing_cash: number | null
                    closing_upi: number | null
                    status: string | null
                    submitted_by: string | null
                    submitted_at: string | null
                    locked_by: string | null
                    locked_at: string | null
                }
                Insert: {
                    id?: string
                    outlet_id: string | null
                    date: string
                    opening_cash: number
                    opening_upi: number
                    closing_cash?: number | null
                    closing_upi?: number | null
                    status?: string | null
                    submitted_by?: string | null
                    submitted_at?: string | null
                    locked_by?: string | null
                    locked_at?: string | null
                }
                Update: {
                    outlet_id?: string | null
                    date?: string
                    opening_cash?: number
                    opening_upi?: number
                    closing_cash?: number | null
                    closing_upi?: number | null
                    status?: string | null
                    submitted_by?: string | null
                    submitted_at?: string | null
                    locked_by?: string | null
                    locked_at?: string | null
                }
                Relationships: []
            }
            daily_records: {
                Row: {
                    id: string
                    outlet_id: string
                    date: string
                    particulars: string
                    amount: number
                    category: string
                    payment_mode: string | null
                    created_by: string | null
                    submitted_at: string | null
                    submitted_by: string | null
                    locked_at: string | null
                    locked_by: string | null
                    created_at: string
                    updated_at: string
                    synced_to_sheets: boolean
                    opening_cash: number | null
                    opening_upi: number | null
                    closing_cash: number | null
                    closing_upi: number | null
                    total_income: number | null
                    total_expense: number | null
                    status: 'draft' | 'submitted' | 'locked' | string | null
                    last_synced_at: string | null
                    sheet_sync_error: string | null
                }
                Insert: {
                    id?: string
                    outlet_id: string
                    date: string
                    particulars: string
                    amount: number
                    category: string
                    payment_mode?: string | null
                    created_by?: string | null
                    submitted_at?: string | null
                    submitted_by?: string | null
                    locked_at?: string | null
                    locked_by?: string | null
                    created_at?: string
                    updated_at?: string
                    synced_to_sheets?: boolean
                    opening_cash?: number | null
                    opening_upi?: number | null
                    closing_cash?: number | null
                    closing_upi?: number | null
                    total_income?: number | null
                    total_expense?: number | null
                    status?: 'draft' | 'submitted' | 'locked' | string | null
                    last_synced_at?: string | null
                    sheet_sync_error?: string | null
                }
                Update: {
                    outlet_id?: string
                    date?: string
                    particulars?: string
                    amount?: number
                    category?: string
                    payment_mode?: string | null
                    created_by?: string | null
                    submitted_at?: string | null
                    submitted_by?: string | null
                    locked_at?: string | null
                    locked_by?: string | null
                    updated_at?: string
                    synced_to_sheets?: boolean
                    opening_cash?: number | null
                    opening_upi?: number | null
                    closing_cash?: number | null
                    closing_upi?: number | null
                    total_income?: number | null
                    total_expense?: number | null
                    status?: 'draft' | 'submitted' | 'locked' | string | null
                    last_synced_at?: string | null
                    sheet_sync_error?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "daily_entries_outlet_id_fkey"
                        columns: ["outlet_id"]
                        isOneToOne: false
                        referencedRelation: "outlets"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "daily_entries_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            transactions: {
                Row: {
                    id: string
                    daily_record_id: string | null
                    type: 'income' | 'expense'
                    category: string
                    payment_mode: 'cash' | 'upi'
                    amount: number
                    description: string | null
                    created_by: string | null
                    created_at: string
                    updated_at: string
                    idempotency_key: string | null
                }
                Insert: {
                    id?: string
                    daily_record_id?: string | null
                    type: 'income' | 'expense'
                    category: string
                    payment_mode: 'cash' | 'upi'
                    amount: number
                    description?: string | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                    idempotency_key?: string | null
                }
                Update: {
                    daily_record_id?: string | null
                    type?: 'income' | 'expense'
                    category?: string
                    payment_mode?: 'cash' | 'upi'
                    amount?: number
                    description?: string | null
                    created_by?: string | null
                    updated_at?: string
                    idempotency_key?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "transactions_daily_record_id_fkey"
                        columns: ["daily_record_id"]
                        isOneToOne: false
                        referencedRelation: "daily_records"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "transactions_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            categories: {
                Row: {
                    id: string
                    code: string
                    name: string
                    type: 'income' | 'expense'
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    code: string
                    name: string
                    type: 'income' | 'expense'
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    code?: string
                    name?: string
                    type?: 'income' | 'expense'
                    is_active?: boolean
                }
                Relationships: []
            }
            monthly_closure_snapshots: {
                Row: {
                    id: string
                    outlet_id: string
                    month_date: string
                    version: number
                    snapshot: Json
                    snapshot_hash: string | null
                    created_at: string
                    created_by: string
                }
                Insert: {
                    id?: string
                    outlet_id: string
                    month_date: string
                    version?: number
                    snapshot: Json
                    snapshot_hash?: string | null
                    created_at?: string
                    created_by: string
                }
                Update: {
                    outlet_id?: string
                    month_date?: string
                    version?: number
                    snapshot?: Json
                    snapshot_hash?: string | null
                    created_at?: string
                    created_by?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "monthly_closure_snapshots_outlet_id_fkey"
                        columns: ["outlet_id"]
                        isOneToOne: false
                        referencedRelation: "outlets"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "monthly_closure_snapshots_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            monthly_closures: {
                Row: {
                    id: string
                    outlet_id: string
                    month_date: string
                    status: 'open' | 'closed' | string
                    closed_at: string | null
                    closed_by: string | null
                    opening_cash: number
                    opening_upi: number
                    closing_cash: number
                    closing_upi: number
                    total_income: number
                    total_expense: number
                    days_count: number
                    reopened_at: string | null
                    reopened_by: string | null
                    reopen_reason: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    outlet_id: string
                    month_date: string
                    status: 'open' | 'closed' | string
                    closed_at?: string | null
                    closed_by?: string | null
                    opening_cash?: number
                    opening_upi?: number
                    closing_cash?: number
                    closing_upi?: number
                    total_income?: number
                    total_expense?: number
                    days_count?: number
                    reopened_at?: string | null
                    reopened_by?: string | null
                    reopen_reason?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    outlet_id?: string
                    month_date?: string
                    status?: 'open' | 'closed' | string
                    closed_at?: string | null
                    closed_by?: string | null
                    opening_cash?: number
                    opening_upi?: number
                    closing_cash?: number
                    closing_upi?: number
                    total_income?: number
                    total_expense?: number
                    days_count?: number
                    reopened_at?: string | null
                    reopened_by?: string | null
                    reopen_reason?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "monthly_closures_outlet_id_fkey"
                        columns: ["outlet_id"]
                        isOneToOne: false
                        referencedRelation: "outlets"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "monthly_closures_closed_by_fkey"
                        columns: ["closed_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "monthly_closures_reopened_by_fkey"
                        columns: ["reopened_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            monthly_summaries: {
                Row: {
                    id: string
                    outlet_id: string
                    month: string
                    total_income: number | null
                    total_expense: number | null
                    total_cash_in: number | null
                    total_cash_out: number | null
                    total_upi_in: number | null
                    total_upi_out: number | null
                    net_profit: number | null
                    opening_balance: number | null
                    closing_balance: number | null
                    days_count: number | null
                    generated_at: string | null
                }
                Insert: {
                    id?: string
                    outlet_id: string
                    month: string
                    total_income?: number | null
                    total_expense?: number | null
                    total_cash_in?: number | null
                    total_cash_out?: number | null
                    total_upi_in?: number | null
                    total_upi_out?: number | null
                    net_profit?: number | null
                    opening_balance?: number | null
                    closing_balance?: number | null
                    days_count?: number | null
                    generated_at?: string | null
                }
                Update: {
                    outlet_id?: string
                    month?: string
                    total_income?: number | null
                    total_expense?: number | null
                    total_cash_in?: number | null
                    total_cash_out?: number | null
                    total_upi_in?: number | null
                    total_upi_out?: number | null
                    net_profit?: number | null
                    opening_balance?: number | null
                    closing_balance?: number | null
                    days_count?: number | null
                    generated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "monthly_summaries_outlet_id_fkey"
                        columns: ["outlet_id"]
                        isOneToOne: false
                        referencedRelation: "outlets"
                        referencedColumns: ["id"]
                    }
                ]
            }
            outlets: {
                Row: {
                    id: string
                    name: string
                    location: string | null
                    created_at: string | null
                    code: string
                    address: string | null
                    phone: string | null
                    email: string | null
                    google_sheet_id: string | null
                    is_active: boolean | null
                    updated_at: string | null
                    type: 'hyper_pharmacy' | 'smart_clinic' | string | null
                }
                Insert: {
                    id?: string
                    name: string
                    location?: string | null
                    created_at?: string | null
                    code: string
                    address?: string | null
                    phone?: string | null
                    email?: string | null
                    google_sheet_id?: string | null
                    is_active?: boolean | null
                    updated_at?: string | null
                    type?: 'hyper_pharmacy' | 'smart_clinic' | string | null
                }
                Update: {
                    name?: string
                    location?: string | null
                    created_at?: string | null
                    code?: string
                    address?: string | null
                    phone?: string | null
                    email?: string | null
                    google_sheet_id?: string | null
                    is_active?: boolean | null
                    updated_at?: string | null
                    type?: 'hyper_pharmacy' | 'smart_clinic' | string | null
                }
                Relationships: []
            }
            roles: {
                Row: {
                    id: string
                    name: string
                }
                Insert: {
                    id?: string
                    name: string
                }
                Update: {
                    name?: string
                }
                Relationships: []
            }
            sheet_sync_log: {
                Row: {
                    id: string
                    daily_record_id: string
                    spreadsheet_id: string | null
                    spreadsheet_url: string | null
                    sync_status: 'success' | 'failed' | 'pending'
                    error_message: string | null
                    synced_at: string | null
                    created_at: string | null
                    synced_by: string | null
                    sync_trigger: 'auto' | 'manual' | 'cron' | 'retry' | null
                }
                Insert: {
                    id?: string
                    daily_record_id: string
                    spreadsheet_id?: string | null
                    spreadsheet_url?: string | null
                    sync_status: 'success' | 'failed' | 'pending'
                    error_message?: string | null
                    synced_at?: string | null
                    created_at?: string | null
                    synced_by?: string | null
                    sync_trigger?: 'auto' | 'manual' | 'cron' | 'retry' | null
                }
                Update: {
                    daily_record_id?: string
                    spreadsheet_id?: string | null
                    spreadsheet_url?: string | null
                    sync_status?: 'success' | 'failed' | 'pending'
                    error_message?: string | null
                    synced_at?: string | null
                    created_at?: string | null
                    synced_by?: string | null
                    sync_trigger?: 'auto' | 'manual' | 'cron' | 'retry' | null
                }
                Relationships: []
            }
            user_outlets: {
                Row: {
                    id: string
                    user_id: string | null
                    outlet_id: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    outlet_id?: string | null
                }
                Update: {
                    user_id?: string | null
                    outlet_id?: string | null
                }
                Relationships: []
            }
            users: {
                Row: {
                    id: string
                    email: string
                    role: string
                    outlet_id: string | null
                    created_at: string
                    updated_at: string
                    profile: Json | null
                }
                Insert: {
                    id?: string
                    email: string
                    role: string
                    outlet_id?: string | null
                    created_at?: string
                    updated_at?: string
                    profile?: Json | null
                }
                Update: {
                    email?: string
                    role?: string
                    outlet_id?: string | null
                    updated_at?: string
                    profile?: Json | null
                }
                Relationships: [
                    {
                        foreignKeyName: "users_outlet_id_fkey"
                        columns: ["outlet_id"]
                        isOneToOne: false
                        referencedRelation: "outlets"
                        referencedColumns: ["id"]
                    }
                ]
            }
            anomalies: {
                Row: {
                    id: string
                    outlet_id: string | null
                    title: string
                    description: string | null
                    severity: 'critical' | 'warning' | 'info'
                    category: string
                    metadata: Json | null
                    detected_at: string
                    resolved_at: string | null
                    resolved_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    outlet_id?: string | null
                    title: string
                    description?: string | null
                    severity: 'critical' | 'warning' | 'info'
                    category: string
                    metadata?: Json | null
                    detected_at?: string
                    resolved_at?: string | null
                    resolved_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    outlet_id?: string | null
                    title?: string
                    description?: string | null
                    severity?: 'critical' | 'warning' | 'info'
                    category?: string
                    metadata?: Json | null
                    detected_at?: string
                    resolved_at?: string | null
                    resolved_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "anomalies_outlet_id_fkey"
                        columns: ["outlet_id"]
                        isOneToOne: false
                        referencedRelation: "outlets"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "anomalies_resolved_by_fkey"
                        columns: ["resolved_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            anomaly_history: {
                Row: {
                    id: string
                    anomaly_id: string
                    status: string
                    data_snapshot: Json | null
                    recorded_at: string
                }
                Insert: {
                    id?: string
                    anomaly_id: string
                    status: string
                    data_snapshot?: Json | null
                    recorded_at?: string
                }
                Update: {
                    anomaly_id?: string
                    status?: string
                    data_snapshot?: Json | null
                    recorded_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "anomaly_history_anomaly_id_fkey"
                        columns: ["anomaly_id"]
                        isOneToOne: false
                        referencedRelation: "anomalies"
                        referencedColumns: ["id"]
                    }
                ]
            }
            export_logs: {
                Row: {
                    id: string
                    user_id: string | null
                    user_role: string | null
                    export_type: 'csv' | 'json' | 'pdf'
                    report_type: string | null
                    file_hash: string | null
                    record_count: number | null
                    filters: Json | null
                    status: 'processing' | 'completed' | 'failed'
                    file_path: string | null
                    created_at: string
                    completed_at: string | null
                    error_message: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    user_role?: string | null
                    export_type: 'csv' | 'json' | 'pdf'
                    report_type?: string | null
                    file_hash?: string | null
                    record_count?: number | null
                    filters?: Json | null
                    status?: 'processing' | 'completed' | 'failed'
                    file_path?: string | null
                    created_at?: string
                    completed_at?: string | null
                    error_message?: string | null
                }
                Update: {
                    user_id?: string | null
                    user_role?: string | null
                    export_type?: 'csv' | 'json' | 'pdf'
                    report_type?: string | null
                    file_hash?: string | null
                    record_count?: number | null
                    filters?: Json | null
                    status?: 'processing' | 'completed' | 'failed'
                    file_path?: string | null
                    created_at?: string
                    completed_at?: string | null
                    error_message?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "export_logs_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {}
        Functions: {}
        Enums: {}
        CompositeTypes: {}
    }
}