import { SupabaseClient } from '@supabase/supabase-js';

export type AnomalyType = 'post_lock_edit' | 'high_credit_day' | 'zero_cash_day' | 'sudden_drop';

export interface Anomaly {
    id: string;
    type: AnomalyType;
    severity: 'high' | 'medium' | 'low';
    date: string;
    description: string;
    metrics?: any;
}

export async function detectAnomalies(supabase: SupabaseClient, outletId: string): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    const today = new Date().toISOString().split('T')[0];

    try {
        // 1. Check for Post-Lock Edits (High Severity)
        // Transactions created AFTER the day was locked
        const { data: lockedDays } = await supabase
            .from('daily_records')
            .select('date, updated_at')
            .eq('outlet_id', outletId)
            .eq('status', 'locked')
            .order('date', { ascending: false })
            .limit(30);

        if (lockedDays && lockedDays.length > 0) {
            for (const day of lockedDays) {
                // Find transactions for this date that were created AFTER the lock time (with 1 min buffer)
                const lockTime = new Date(day.updated_at);
                const bufferTime = new Date(lockTime.getTime() + 60000).toISOString();

                const { count } = await supabase
                    .from('transactions')
                    .select('*', { count: 'exact', head: true })
                    .eq('outlet_id', outletId)
                    .gte('created_at', day.date + 'T00:00:00')
                    .lte('created_at', day.date + 'T23:59:59')
                    .gt('created_at', bufferTime);

                if (count && count > 0) {
                    anomalies.push({
                        id: `lock-${day.date}`,
                        type: 'post_lock_edit',
                        severity: 'high',
                        date: day.date,
                        description: `${count} transactions created after day lock`,
                        metrics: { count }
                    });
                }
            }
        }

        // 2. Check for Zero-Cash Days (Medium Severity)
        // Days with sales but NO cash payments
        const { data: recentTxns } = await supabase
            .from('transactions')
            .select('created_at, payment_modes, amount')
            .eq('outlet_id', outletId)
            .eq('transaction_type', 'income')
            .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()) // Last 30 days
            .order('created_at', { ascending: false });

        if (recentTxns) {
            const days = new Set(recentTxns.map(t => t.created_at.split('T')[0]));
            days.forEach(date => {
                const dayTxns = recentTxns.filter(t => t.created_at.startsWith(date));
                const totalAmount = dayTxns.reduce((sum, t) => sum + (t.amount || 0), 0);

                if (totalAmount > 0) {
                    const hasCash = dayTxns.some(t => t.payment_modes?.toLowerCase().includes('cash'));
                    if (!hasCash) {
                        anomalies.push({
                            id: `zero-cash-${date}`,
                            type: 'zero_cash_day',
                            severity: 'medium',
                            date: date,
                            description: `No cash transactions recorded (Total Sales: ₹${totalAmount})`,
                            metrics: { totalAmount }
                        });
                    }
                }
            });
        }

        // 3. High Credit Days (Medium Severity)
        // Days where Credit > 50% of total sales
        if (recentTxns) {
            const days = new Set(recentTxns.map(t => t.created_at.split('T')[0]));
            days.forEach(date => {
                const dayTxns = recentTxns.filter(t => t.created_at.startsWith(date));
                const totalSales = dayTxns.reduce((sum, t) => sum + (t.amount || 0), 0);

                if (totalSales > 1000) { // Only check significant days
                    const creditSales = dayTxns
                        .filter(t => t.payment_modes?.toLowerCase().includes('credit'))
                        .reduce((sum, t) => sum + (t.amount || 0), 0); // Simplified: assumes full amt is credit if mixed mode not parsed deeply here

                    if (creditSales > (totalSales * 0.5)) {
                        anomalies.push({
                            id: `high-credit-${date}`,
                            type: 'high_credit_day',
                            severity: 'medium',
                            date: date,
                            description: `High Credit volume (${Math.round((creditSales / totalSales) * 100)}% of sales)`,
                            metrics: { creditSales, totalSales }
                        });
                    }
                }
            });
        }

    } catch (e) {
        console.error('Anomaly detection error:', e);
    }

    return anomalies.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
