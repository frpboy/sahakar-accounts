export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            organizations: {
                Row: {
                    id: string
                    name: string
                    code: string
                    timezone: string
                    locale: string
                    currency: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    code: string
                    timezone?: string
                    locale?: string
                    currency?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    code?: string
                    timezone?: string
                    locale?: string
                    currency?: string
                    updated_at?: string
                }
            }
            outlets: {
                Row: {
                    id: string
                    organization_id: string
                    name: string
                    code: string
                    location: string | null
                    phone: string | null
                    email: string | null
                    google_sheet_id: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    name: string
                    code: string
                    location?: string | null
                    phone?: string | null
                    email?: string | null
                    google_sheet_id?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    name?: string
                    code?: string
                    location?: string | null
                    phone?: string | null
                    email?: string | null
                    google_sheet_id?: string | null
                    is_active?: boolean
                    updated_at?: string
                }
            }
            users: {
                Row: {
                    id: string
                    organization_id: string
                    email: string
                    full_name: string
                    role: 'master_admin' | 'ho_accountant' | 'outlet_manager' | 'outlet_staff'
                    phone: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    organization_id: string
                    email: string
                    full_name: string
                    role: 'master_admin' | 'ho_accountant' | 'outlet_manager' | 'outlet_staff'
                    phone?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    organization_id?: string
                    email?: string
                    full_name?: string
                    role?: 'master_admin' | 'ho_accountant' | 'outlet_manager' | 'outlet_staff'
                    phone?: string | null
                    is_active?: boolean
                    updated_at?: string
                }
            }
            user_outlet_access: {
                Row: {
                    id: string
                    user_id: string
                    outlet_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    outlet_id: string
                    created_at?: string
                }
                Update: {
                    user_id?: string
                    outlet_id?: string
                }
            }
            daily_records: {
                Row: {
                    id: string
                    outlet_id: string
                    date: string
                    opening_cash: number
                    opening_upi: number
                    closing_cash: number
                    closing_upi: number
                    total_income: number
                    total_expense: number
                    status: 'draft' | 'submitted' | 'locked'
                    submitted_at: string | null
                    submitted_by: string | null
                    locked_at: string | null
                    locked_by: string | null
                    synced_to_sheet: boolean
                    last_synced_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    outlet_id: string
                    date: string
                    opening_cash?: number
                    opening_upi?: number
                    closing_cash?: number
                    closing_upi?: number
                    total_income?: number
                    total_expense?: number
                    status?: 'draft' | 'submitted' | 'locked'
                    submitted_at?: string | null
                    submitted_by?: string | null
                    locked_at?: string | null
                    locked_by?: string | null
                    synced_to_sheet?: boolean
                    last_synced_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    outlet_id?: string
                    date?: string
                    opening_cash?: number
                    opening_upi?: number
                    closing_cash?: number
                    closing_upi?: number
                    total_income?: number
                    total_expense?: number
                    status?: 'draft' | 'submitted' | 'locked'
                    submitted_at?: string | null
                    submitted_by?: string | null
                    locked_at?: string | null
                    locked_by?: string | null
                    synced_to_sheet?: boolean
                    last_synced_at?: string | null
                    updated_at?: string
                }
            }
            transactions: {
                Row: {
                    id: string
                    daily_record_id: string
                    type: 'income' | 'expense'
                    category: string
                    payment_mode: 'cash' | 'upi'
                    amount: number
                    description: string | null
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    daily_record_id: string
                    type: 'income' | 'expense'
                    category: string
                    payment_mode: 'cash' | 'upi'
                    amount: number
                    description?: string | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    daily_record_id?: string
                    type?: 'income' | 'expense'
                    category?: string
                    payment_mode?: 'cash' | 'upi'
                    amount?: number
                    description?: string | null
                    created_by?: string | null
                    updated_at?: string
                }
            }
            categories: {
                Row: {
                    id: string
                    organization_id: string
                    name: string
                    type: 'income' | 'expense'
                    code: string
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    name: string
                    type: 'income' | 'expense'
                    code: string
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    organization_id?: string
                    name?: string
                    type?: 'income' | 'expense'
                    code?: string
                    is_active?: boolean
                }
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
    }
}
