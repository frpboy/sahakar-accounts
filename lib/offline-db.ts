import Dexie, { Table } from 'dexie';

export interface DraftTransaction {
    id?: number;
    outlet_id: string;
    transaction_type: 'income' | 'expense';
    category: string;
    entry_number: string;
    description: string;
    amount: number;
    payment_modes: string;
    customer_phone?: string;
    created_at: string;
    created_by?: string;
    synced: boolean;
}

export class OfflineDB extends Dexie {
    drafts!: Table<DraftTransaction, number>;

    constructor() {
        super('SahakarAccountsDB');
        this.version(1).stores({
            drafts: '++id, outlet_id, created_at, created_by, synced'
        });
    }
}

export const db = new OfflineDB();
