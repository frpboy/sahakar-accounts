// @ts-nocheck
import { supabase } from './supabase';
import type { Database } from './database.types';

export type User = Database['public']['Tables']['users']['Row'];
export type Outlet = Database['public']['Tables']['outlets']['Row'];
export type DailyRecord = Database['public']['Tables']['daily_records']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];

export async function getCurrentUser(): Promise<User | null> {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) return null;

    const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

    return data;
}

export async function getUserOutlets(userId: string): Promise<Outlet[]> {
    const user = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

    if (!user.data) return [];

    // Master admin and HO accountant can see all outlets
    if (user.data.role === 'master_admin' || user.data.role === 'ho_accountant') {
        const { data } = await supabase
            .from('outlets')
            .select('*')
            .eq('is_active', true)
            .order('name');
        return data || [];
    }

    // Other users can only see outlets they have access to
    const { data } = await supabase
        .from('user_outlet_access')
        .select(`
      outlets (*)
    `)
        .eq('user_id', userId);

    return data?.map(d => d.outlets).filter(Boolean) as Outlet[] || [];
}

export async function getDailyRecord(outletId: string, date: string): Promise<DailyRecord | null> {
    const { data } = await supabase
        .from('daily_records')
        .select('*')
        .eq('outlet_id', outletId)
        .eq('date', date)
        .single();

    return data;
}

export async function getTransactions(dailyRecordId: string): Promise<Transaction[]> {
    const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('daily_record_id', dailyRecordId)
        .order('created_at');

    return data || [];
}

export async function getCategories(organizationId: string): Promise<Category[]> {
    const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name');

    return data || [];
}
