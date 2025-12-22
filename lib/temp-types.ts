// Temporary type definitions for build
// TODO: Replace with proper database.types.ts from Supabase

export type DailyRecord = {
    id: string;
    outlet_id: string;
    date: string;
    status: 'draft' | 'submitted' | 'locked';
    opening_cash: number;
    opening_upi: number;
    closing_cash: number;
    closing_upi: number;
    total_income: number;
    total_expense: number;
    locked_at?: string;
    locked_by?: string;
    created_at: string;
    updated_at: string;
};

export type Transaction = {
    id: string;
    daily_record_id: string;
    type: 'income' | 'expense';
    category: string;
    payment_mode: 'cash' | 'upi';
    amount: number;
    description?: string;
    created_at: string;
    updated_at: string;
};
