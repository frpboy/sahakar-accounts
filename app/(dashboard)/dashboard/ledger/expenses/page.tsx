'use client';
import { TopBar } from '@/components/layout/topbar';

export default function ExpensesLedgerPage() {
    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <TopBar title="Expense Ledger" />
            <div className="flex-1 flex items-center justify-center text-gray-400">
                Coming Soon (Phase L-B)
            </div>
        </div>
    );
}
