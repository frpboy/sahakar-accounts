'use client';

import React from 'react';
import { X, Calendar, Hash, Tag, CreditCard, User, Building2, Lock, Unlock, Printer, Download, Trash2, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TransactionDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: any;
}

export function TransactionDrawer({ isOpen, onClose, transaction }: TransactionDrawerProps) {
    if (!isOpen || !transaction) return null;

    const isLocked = transaction.daily_records?.status === 'locked';

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
                className={cn(
                    "absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* Panel */}
            <div className={cn(
                "absolute inset-y-0 right-0 max-w-lg w-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Transaction Details</h2>
                        <p className="text-xs text-gray-500 font-mono">{transaction.internal_entry_id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Status Banner */}
                    <div className={cn(
                        "p-4 rounded-xl border flex items-center justify-between",
                        isLocked ? "bg-red-50 border-red-100 text-red-700" : "bg-green-50 border-green-100 text-green-700"
                    )}>
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "p-2 rounded-lg",
                                isLocked ? "bg-red-100" : "bg-green-100"
                            )}>
                                {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="font-bold text-sm uppercase tracking-wider">
                                    {isLocked ? "Audit Locked" : "Open for Editing"}
                                </p>
                                <p className="text-[10px] opacity-80">
                                    {isLocked ? "Record cannot be modified without higher approval." : "This record is still in an open business day."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Summary Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Category</label>
                            <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-bold text-gray-900 uppercase">
                                    {transaction.category?.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Amount</label>
                            <div className="text-xl font-black text-gray-900">
                                ₹{parseFloat(transaction.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>

                    {/* Deep Details */}
                    <div className="space-y-6 bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-inner">
                        <section className="space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Primary Info</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <DetailItem
                                    icon={<Calendar className="w-4 h-4" />}
                                    label="Date & Time"
                                    value={`${format(new Date(transaction.created_at), 'PPP')} at ${format(new Date(transaction.created_at), 'hh:mm a')}`}
                                />
                                <DetailItem
                                    icon={<Hash className="w-4 h-4" />}
                                    label="ERP Reference"
                                    value={transaction.entry_number || '---'}
                                />
                                <DetailItem
                                    icon={<Building2 className="w-4 h-4" />}
                                    label="Description"
                                    value={transaction.description}
                                />
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Payment Breakdown</h3>
                            <div className="flex flex-wrap gap-2">
                                {transaction.payment_modes?.split(',').map((mode: string) => (
                                    <span key={mode} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border text-xs font-bold text-gray-700 shadow-sm">
                                        <CreditCard className="w-3 h-3 text-gray-400" />
                                        {mode.trim()}
                                    </span>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Audit Context</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <DetailItem
                                    icon={<User className="w-4 h-4" />}
                                    label="Processed By"
                                    value={transaction.users?.full_name || transaction.users?.name || 'System'}
                                />
                                <DetailItem
                                    icon={<Clock className="w-4 h-4" />}
                                    label="System ID"
                                    value={transaction.id}
                                />
                            </div>
                        </section>
                    </div>

                    {/* Immutable Confirmation */}
                    {isLocked && (
                        <div className="p-4 bg-gray-900 rounded-xl text-white">
                            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">Audit Guarantee</p>
                            <p className="text-xs leading-relaxed text-gray-300">
                                This record is historically immutable. All balances have been verified and settled.
                                <br /><span className="text-blue-400 font-bold mt-2 block italic">Sahakar Integrity Verified ✓</span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t bg-gray-50 flex gap-3">
                    <button
                        onClick={() => window.print()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all print:hidden"
                    >
                        <Printer className="w-4 h-4" />
                        Print Receipt
                    </button>

                    <button
                        onClick={async () => {
                            if (confirm('Are you sure you want to delete this transaction? This cannot be undone.')) {
                                try {
                                    const res = await fetch(`/api/transactions/${transaction.id}`, {
                                        method: 'DELETE',
                                    });
                                    if (!res.ok) {
                                        const err = await res.json();
                                        alert(`Failed to delete: ${err.error}`);
                                        return;
                                    }
                                    alert('✅ Transaction deleted successfully');
                                    onClose();
                                    // Trigger refresh if possible, or user manually refreshes
                                    window.location.reload();
                                } catch (error) {
                                    alert('Error deleting transaction');
                                }
                            }
                        }}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-100 transition-all"
                        title="Delete Transaction"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex gap-3">
            <div className="mt-0.5 text-gray-400">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
                <p className="text-sm font-medium text-gray-900">{value}</p>
            </div>
        </div>
    );
}
