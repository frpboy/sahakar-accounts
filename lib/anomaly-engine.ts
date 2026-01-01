'use client';

/**
 * Sahakar Accounts Anomaly Detection Engine
 * 
 * Rules:
 * 1. Big Transaction: Amount > ₹1,00,000
 * 2. High Cash Sale: Type=income, Category=sales, Mode=Cash, Amount > ₹50,000
 * 3. Abnormal Returns: Return amount > 50% of any daily revenue (calculated per outlet)
 * 4. Duty Time Violation: Login outside 7 AM - 2 AM window (logged separately)
 */

export interface Anomaly {
    id: string;
    transaction_id?: string;
    entity_type: 'transaction' | 'user' | 'outlet';
    type: 'big_transaction' | 'high_cash_sale' | 'late_login' | 'suspicious_return';
    severity: 'low' | 'medium' | 'high';
    description: string;
    details: any;
    status: 'pending' | 'reviewed' | 'resolved';
    created_at: string;
}

export function detectAnomalies(transaction: any): Partial<Anomaly>[] {
    const anomalies: Partial<Anomaly>[] = [];
    const amount = Number(transaction.amount);

    // Rule 1: Big Transaction
    if (amount > 100000) {
        anomalies.push({
            transaction_id: transaction.id,
            entity_type: 'transaction',
            type: 'big_transaction',
            severity: 'medium',
            description: `Large transaction of ₹${amount.toLocaleString()} detected.`,
            details: { amount },
            status: 'pending'
        });
    }

    // Rule 2: High Cash Sale
    if (transaction.type === 'income' &&
        transaction.category === 'sales' &&
        transaction.payment_mode === 'Cash' &&
        amount > 50000) {
        anomalies.push({
            transaction_id: transaction.id,
            entity_type: 'transaction',
            type: 'high_cash_sale',
            severity: 'high',
            description: `Large cash sale of ₹${amount.toLocaleString()} reported.`,
            details: { amount, mode: 'Cash' },
            status: 'pending'
        });
    }

    return anomalies;
}
