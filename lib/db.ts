// IndexedDB Database Setup for Sahakar Accounts
// Provides offline-first caching and fast data access
import Dexie, { Table } from 'dexie';

// Define TypeScript interfaces for cached data
export interface CachedDailyRecord {
    id: string;
    outlet_id: string;
    date: string;
    opening_cash: number;
    opening_upi: number;
    closing_cash: number;
    closing_upi: number;
    total_income: number;
    total_expense: number;
    status: 'draft' | 'submitted' | 'locked';
    cached_at: number; // Timestamp
}

export interface CachedTransaction {
    id: string;
    daily_record_id: string;
    type: 'income' | 'expense';
    category: string;
    payment_mode: 'cash' | 'upi';
    amount: number;
    description?: string;
    date: string;
    cached_at: number;
}

export interface CachedOutlet {
    id: string;
    name: string;
    code: string;
    address?: string;
    phone?: string;
    cached_at: number;
}

export interface CachedUser {
    id: string;
    email: string;
    name?: string;
    full_name?: string;
    role: string;
    outlet_id?: string;
    cached_at: number;
}

// Dexie Database Class
class SahakarDB extends Dexie {
    daily_records!: Table<CachedDailyRecord>;
    transactions!: Table<CachedTransaction>;
    outlets!: Table<CachedOutlet>;
    users!: Table<CachedUser>;

    constructor() {
        super('SahakarAccountsDB');

        this.version(1).stores({
            daily_records: 'id, outlet_id, date, status, cached_at',
            transactions: 'id, daily_record_id, type, date, cached_at',
            outlets: 'id, code, cached_at',
            users: 'id, email, role, cached_at',
        });
    }
}

// Create database instance
export const db = new SahakarDB();

// Cache Management Functions

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const cacheHelpers = {
    // Check if cache is still fresh
    isFresh: (cachedAt: number): boolean => {
        return Date.now() - cachedAt < CACHE_DURATION;
    },

    // Daily Records
    getDailyRecord: async (id: string): Promise<CachedDailyRecord | undefined> => {
        const record = await db.daily_records.get(id);
        if (record && cacheHelpers.isFresh(record.cached_at)) {
            return record;
        }
        return undefined;
    },

    cacheDailyRecord: async (record: Omit<CachedDailyRecord, 'cached_at'>): Promise<void> => {
        await db.daily_records.put({
            ...record,
            cached_at: Date.now(),
        });
    },

    getDailyRecordsByOutlet: async (outletId: string): Promise<CachedDailyRecord[]> => {
        const records = await db.daily_records
            .where('outlet_id')
            .equals(outletId)
            .toArray();

        return records.filter(r => cacheHelpers.isFresh(r.cached_at));
    },

    // Transactions
    getTransaction: async (id: string): Promise<CachedTransaction | undefined> => {
        const transaction = await db.transactions.get(id);
        if (transaction && cacheHelpers.isFresh(transaction.cached_at)) {
            return transaction;
        }
        return undefined;
    },

    cacheTransaction: async (transaction: Omit<CachedTransaction, 'cached_at'>): Promise<void> => {
        await db.transactions.put({
            ...transaction,
            cached_at: Date.now(),
        });
    },

    getTransactionsByDailyRecord: async (dailyRecordId: string): Promise<CachedTransaction[]> => {
        const transactions = await db.transactions
            .where('daily_record_id')
            .equals(dailyRecordId)
            .toArray();

        return transactions.filter(t => cacheHelpers.isFresh(t.cached_at));
    },

    // Outlets
    getOutlet: async (id: string): Promise<CachedOutlet | undefined> => {
        const outlet = await db.outlets.get(id);
        if (outlet && cacheHelpers.isFresh(outlet.cached_at)) {
            return outlet;
        }
        return undefined;
    },

    cacheOutlet: async (outlet: Omit<CachedOutlet, 'cached_at'>): Promise<void> => {
        await db.outlets.put({
            ...outlet,
            cached_at: Date.now(),
        });
    },

    getAllOutlets: async (): Promise<CachedOutlet[]> => {
        const outlets = await db.outlets.toArray();
        return outlets.filter(o => cacheHelpers.isFresh(o.cached_at));
    },

    // Users
    getUser: async (id: string): Promise<CachedUser | undefined> => {
        const user = await db.users.get(id);
        if (user && cacheHelpers.isFresh(user.cached_at)) {
            return user;
        }
        return undefined;
    },

    cacheUser: async (user: Omit<CachedUser, 'cached_at'>): Promise<void> => {
        await db.users.put({
            ...user,
            cached_at: Date.now(),
        });
    },

    // Clear stale cache
    clearStaleCache: async (): Promise<void> => {
        const now = Date.now();

        await db.daily_records.where('cached_at').below(now - CACHE_DURATION).delete();
        await db.transactions.where('cached_at').below(now - CACHE_DURATION).delete();
        await db.outlets.where('cached_at').below(now - CACHE_DURATION).delete();
        await db.users.where('cached_at').below(now - CACHE_DURATION).delete();
    },

    // Clear all cache
    clearAllCache: async (): Promise<void> => {
        await db.daily_records.clear();
        await db.transactions.clear();
        await db.outlets.clear();
        await db.users.clear();
    },
};

// Auto-cleanup on page load
if (typeof window !== 'undefined') {
    cacheHelpers.clearStaleCache();
}
