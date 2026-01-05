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
                    payment_modes: string
                    amount: number
                    description: string | null
                    created_by: string | null
                    created_at: string
                    updated_at: string
                    idempotency_key: string | null
                    internal_entry_id: string | null
                    outlet_id: string | null
                    entry_number: string | null
                    customer_phone: string | null
                    source_type: 'sale' | 'purchase' | 'return' | 'manual' | 'adjustment' | 'system' | null
                    source_id: string | null
                    ledger_date: string
                    is_manual: boolean
                    is_reversal: boolean
                    parent_transaction_id: string | null
                    ledger_account_id: string
                    customer_id: string | null
                    supplier_name: string | null
                    erp_id: string | null
                    external_bill_number: string | null
                    other_charges: number | null
                    bank_tx_id: string | null
                    remarks: string | null
                    refill_days: number | null
                    is_verified: boolean
                }
                Insert: {
                    id?: string
                    daily_record_id?: string | null
                    type: 'income' | 'expense'
                    category: string
                    payment_modes: string
                    amount: number
                    description?: string | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                    idempotency_key?: string | null
                    internal_entry_id?: string | null
                    outlet_id?: string | null
                    entry_number?: string | null
                    customer_phone?: string | null
                    source_type?: 'sale' | 'purchase' | 'return' | 'manual' | 'adjustment' | 'system' | null
                    source_id?: string | null
                    ledger_date?: string
                    is_manual?: boolean
                    is_reversal?: boolean
                    parent_transaction_id?: string | null
                    ledger_account_id: string
                    customer_id?: string | null
                    supplier_name?: string | null
                    erp_id?: string | null
                    external_bill_number?: string | null
                    other_charges?: number | null
                    bank_tx_id?: string | null
                    remarks?: string | null
                    refill_days?: number | null
                    is_verified?: boolean
                }
                Update: {
                    daily_record_id?: string | null
                    type?: 'income' | 'expense'
                    category?: string
                    payment_modes?: string
                    amount?: number
                    description?: string | null
                    created_by?: string | null
                    updated_at?: string
                    idempotency_key?: string | null
                    internal_entry_id?: string | null
                    outlet_id?: string | null
                    entry_number?: string | null
                    customer_phone?: string | null
                    source_type?: 'sale' | 'purchase' | 'return' | 'manual' | 'adjustment' | 'system' | null
                    source_id?: string | null
                    ledger_date?: string
                    is_manual?: boolean
                    is_reversal?: boolean
                    parent_transaction_id?: string | null
                    ledger_account_id?: string
                    customer_id?: string | null
                    supplier_name?: string | null
                    erp_id?: string | null
                    external_bill_number?: string | null
                    other_charges?: number | null
                    bank_tx_id?: string | null
                    remarks?: string | null
                    refill_days?: number | null
                    is_verified?: boolean
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
                    },
                    {
                        foreignKeyName: "transactions_outlet_id_fkey"
                        columns: ["outlet_id"]
                        isOneToOne: false
                        referencedRelation: "outlets"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "transactions_parent_transaction_id_fkey"
                        columns: ["parent_transaction_id"]
                        isOneToOne: false
                        referencedRelation: "transactions"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "transactions_ledger_account_id_fkey"
                        columns: ["ledger_account_id"]
                        isOneToOne: false
                        referencedRelation: "ledger_accounts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "transactions_customer_id_fkey"
                        columns: ["customer_id"]
                        isOneToOne: false
                        referencedRelation: "customers"
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
            customers: {
                Row: {
                    id: string
                    outlet_id: string
                    name: string
                    phone: string | null
                    email: string | null
                    address: string | null
                    notes: string | null
                    credit_limit: number
                    outstanding_balance: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                    created_by: string | null
                    referred_by: string | null
                    internal_customer_id: string | null
                    customer_code: string | null
                    referred_by_user_id: string | null
                    assigned_to_user_id: string | null
                    visit_count: number
                    total_spend: number
                }
                Insert: {
                    id?: string
                    outlet_id: string
                    name: string
                    phone?: string | null
                    email?: string | null
                    address?: string | null
                    notes?: string | null
                    credit_limit?: number
                    outstanding_balance?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                    created_by?: string | null
                    referred_by?: string | null
                    internal_customer_id?: string | null
                    customer_code?: string | null
                    referred_by_user_id?: string | null
                    assigned_to_user_id?: string | null
                    visit_count?: number
                    total_spend?: number
                }
                Update: {
                    outlet_id?: string
                    name?: string
                    phone?: string | null
                    email?: string | null
                    address?: string | null
                    notes?: string | null
                    credit_limit?: number
                    outstanding_balance?: number
                    is_active?: boolean
                    updated_at?: string
                    created_by?: string | null
                    referred_by?: string | null
                    internal_customer_id?: string | null
                    customer_code?: string | null
                    referred_by_user_id?: string | null
                    assigned_to_user_id?: string | null
                    visit_count?: number
                    total_spend?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "customers_outlet_id_fkey"
                        columns: ["outlet_id"]
                        isOneToOne: false
                        referencedRelation: "outlets"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "customers_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
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
            ledger_accounts: {
                Row: {
                    id: string
                    code: string
                    name: string
                    type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
                    parent_id: string | null
                    status: 'active' | 'disabled'
                    is_system: boolean
                    is_locked: boolean
                    created_at: string
                    updated_at: string
                    outlet_id: string | null
                    level: number
                    is_leaf: boolean
                }
                Insert: {
                    id?: string
                    code: string
                    name: string
                    type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
                    parent_id?: string | null
                    status?: 'active' | 'disabled'
                    is_system?: boolean
                    is_locked?: boolean
                    created_at?: string
                    updated_at?: string
                    outlet_id?: string | null
                    level?: number
                    is_leaf?: boolean
                }
                Update: {
                    code?: string
                    name?: string
                    type?: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
                    parent_id?: string | null
                    status?: 'active' | 'disabled'
                    is_system?: boolean
                    is_locked?: boolean
                    updated_at?: string
                    outlet_id?: string | null
                    level?: number
                    is_leaf?: boolean
                }
                Relationships: [
                    {
                        foreignKeyName: "ledger_accounts_parent_id_fkey"
                        columns: ["parent_id"]
                        isOneToOne: false
                        referencedRelation: "ledger_accounts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "ledger_accounts_outlet_id_fkey"
                        columns: ["outlet_id"]
                        isOneToOne: false
                        referencedRelation: "outlets"
                        referencedColumns: ["id"]
                    }
                ]
            }
            day_locks: {
                Row: {
                    id: string
                    outlet_id: string
                    locked_date: string
                    status: 'locked' | 'unlocked'
                    reason: string | null
                    locked_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    outlet_id: string
                    locked_date: string
                    status?: 'locked' | 'unlocked'
                    reason?: string | null
                    locked_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    outlet_id?: string
                    locked_date?: string
                    status?: 'locked' | 'unlocked'
                    reason?: string | null
                    locked_by?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "day_locks_outlet_id_fkey"
                        columns: ["outlet_id"]
                        isOneToOne: false
                        referencedRelation: "outlets"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "day_locks_locked_by_fkey"
                        columns: ["locked_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
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
                    name: string
                    role: 'master_admin' | 'ho_accountant' | 'outlet_manager' | 'outlet_staff' | 'auditor' | 'superadmin'
                    outlet_id: string | null
                    created_at: string
                    access_start_date: string | null
                    access_end_date: string | null
                    auditor_access_granted_at: string | null
                    auditor_access_expires_at: string | null
                    auditor_access_granted_by: string | null
                    full_name: string | null
                    profile: Json | null
                }
                Insert: {
                    id?: string
                    email: string
                    name: string
                    role: 'master_admin' | 'ho_accountant' | 'outlet_manager' | 'outlet_staff' | 'auditor' | 'superadmin'
                    outlet_id?: string | null
                    created_at?: string
                    access_start_date?: string | null
                    access_end_date?: string | null
                    auditor_access_granted_at?: string | null
                    auditor_access_expires_at?: string | null
                    auditor_access_granted_by?: string | null
                    full_name?: string | null
                    profile?: Json | null
                }
                Update: {
                    email?: string
                    name?: string
                    role?: 'master_admin' | 'ho_accountant' | 'outlet_manager' | 'outlet_staff' | 'auditor' | 'superadmin'
                    outlet_id?: string | null
                    access_start_date?: string | null
                    access_end_date?: string | null
                    auditor_access_granted_at?: string | null
                    auditor_access_expires_at?: string | null
                    auditor_access_granted_by?: string | null
                    full_name?: string | null
                    profile?: Json | null
                }
                Relationships: [
                    {
                        foreignKeyName: "users_outlet_id_fkey"
                        columns: ["outlet_id"]
                        isOneToOne: false
                        referencedRelation: "outlets"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "users_auditor_access_granted_by_fkey"
                        columns: ["auditor_access_granted_by"]
                        isOneToOne: false
                        referencedRelation: "users"
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
            },
            suppliers: {
                Row: {
                    id: string
                    outlet_id: string
                    name: string
                    phone: string | null
                    email: string | null
                    gstin: string | null
                    address: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    outlet_id: string
                    name: string
                    phone?: string | null
                    email?: string | null
                    gstin?: string | null
                    address?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    outlet_id?: string
                    name?: string
                    phone?: string | null
                    email?: string | null
                    gstin?: string | null
                    address?: string | null
                    is_active?: boolean
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "suppliers_outlet_id_fkey"
                        columns: ["outlet_id"]
                        isOneToOne: false
                        referencedRelation: "outlets"
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