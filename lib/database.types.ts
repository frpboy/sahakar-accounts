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
                    outlet_id?: string | null
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
                Relationships: []
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
                Relationships: []
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
                Relationships: []
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
                    name: string
                    role:
                        | 'master_admin'
                        | 'ho_accountant'
                        | 'outlet_manager'
                        | 'outlet_staff'
                        | 'auditor'
                        | 'superadmin'
                        | string
                    outlet_id: string | null
                    created_at: string | null
                    access_start_date: string | null
                    access_end_date: string | null
                    auditor_access_granted_at: string | null
                    auditor_access_expires_at: string | null
                    auditor_access_granted_by: string | null
                }
                Insert: {
                    id: string
                    email: string
                    name: string
                    role:
                        | 'master_admin'
                        | 'ho_accountant'
                        | 'outlet_manager'
                        | 'outlet_staff'
                        | 'auditor'
                        | 'superadmin'
                        | string
                    outlet_id?: string | null
                    created_at?: string | null
                    access_start_date?: string | null
                    access_end_date?: string | null
                    auditor_access_granted_at?: string | null
                    auditor_access_expires_at?: string | null
                    auditor_access_granted_by?: string | null
                }
                Update: {
                    email?: string
                    name?: string
                    role?:
                        | 'master_admin'
                        | 'ho_accountant'
                        | 'outlet_manager'
                        | 'outlet_staff'
                        | 'auditor'
                        | 'superadmin'
                        | string
                    outlet_id?: string | null
                    created_at?: string | null
                    access_start_date?: string | null
                    access_end_date?: string | null
                    auditor_access_granted_at?: string | null
                    auditor_access_expires_at?: string | null
                    auditor_access_granted_by?: string | null
                }
                Relationships: []
            }
            daily_totals: {
                Row: {
                    business_day_id: string
                    income_cash: number | null
                    income_upi: number | null
                    expense_cash: number | null
                    expense_upi: number | null
                }
                Insert: {
                    business_day_id: string
                    income_cash?: number | null
                    income_upi?: number | null
                    expense_cash?: number | null
                    expense_upi?: number | null
                }
                Update: {
                    business_day_id?: string
                    income_cash?: number | null
                    income_upi?: number | null
                    expense_cash?: number | null
                    expense_upi?: number | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
};
