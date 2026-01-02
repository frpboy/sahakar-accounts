import React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Lock, Edit2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { canEditTransaction } from '@/lib/ledger-logic';

export function LedgerTable({ entries, role, isDayLocked, onRowClick }: any) {
    if (!entries.length) {
        return <div className="p-8 text-center text-gray-500">No records found for this period.</div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 uppercase text-xs font-semibold">
                    <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Account / Particulars</th>
                        <th className="px-4 py-3">Ref</th>
                        <th className="px-4 py-3 text-right">Debit</th>
                        <th className="px-4 py-3 text-right">Credit</th>
                        <th className="px-4 py-3 text-right">Balance</th>
                        <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {entries.map((t: any) => {
                        const { allowed, reason } = canEditTransaction(t.created_at, role);
                        const isLocked = !allowed || isDayLocked;

                        // Simple logic for Dr/Cr representation
                        const isIncome = t.type === 'income';
                        const debit = isIncome ? 0 : t.amount;
                        const credit = isIncome ? t.amount : 0;

                        return (
                            <tr
                                key={t.id}
                                onClick={() => onRowClick(t)}
                                className={cn(
                                    "hover:bg-blue-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors",
                                    isLocked && "bg-gray-50/50 text-gray-500"
                                )}
                            >
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="font-mono">{format(new Date(t.created_at), 'dd MMM')}</div>
                                    <div className="text-xs opacity-50">{format(new Date(t.created_at), 'HH:mm')}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900 dark:text-white">{t.description || t.category}</div>
                                    <div className="text-xs opacity-50 capitalize">{t.category.replace('_', ' ')}</div>
                                </td>
                                <td className="px-4 py-3 font-mono text-xs">
                                    {t.id.substring(0, 6)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-red-600">
                                    {debit > 0 ? `₹${Number(debit).toLocaleString()}` : '-'}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-green-600">
                                    {credit > 0 ? `₹${Number(credit).toLocaleString()}` : '-'}
                                </td>
                                <td className="px-4 py-3 text-right font-mono text-gray-600">
                                    {/* Running Balance Not Yet Calculated per row */}
                                    -
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {isLocked ? (
                                        <div title={isDayLocked ? "Day Locked" : reason}>
                                            <Lock className="w-3 h-3 mx-auto opacity-50" />
                                        </div>
                                    ) : (
                                        <Edit2 className="w-3 h-3 mx-auto text-blue-500 opacity-0 group-hover:opacity-100" />
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
