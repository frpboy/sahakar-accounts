import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Save, AlertTriangle, History } from 'lucide-react';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Contract:
// LedgerDrawerProps {
//   entry: LedgerEntry
//   role: UserRole
//   canEdit: boolean
//   lockReason?: string
//   open: boolean
//   onClose: () => void
//   onSave: (data: any) => void
// }

export function LedgerDrawer({ entry, role, canEdit, lockReason, open, onClose, onSave }: any) {
    if (!entry) return null;

    const [adjustment, setAdjustment] = React.useState({ amount: '', reason: '' });

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-bold">Ledger Entry #{entry.id.substring(0, 6)}</SheetTitle>
                        {canEdit ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                Editable
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 gap-1">
                                <Lock className="w-3 h-3" />
                                Locked: {lockReason}
                            </Badge>
                        )}
                    </div>
                    <SheetDescription>
                        Transaction Date: {format(new Date(entry.created_at), 'dd MMM yyyy HH:mm')}
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    {/* Meta Data */}
                    <div className="grid grid-cols-2 gap-4 text-sm p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div>
                            <span className="text-gray-500 block text-xs uppercase">Source</span>
                            <span className="font-medium capitalize">{entry.category.replace('_', ' ')}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-xs uppercase">Type</span>
                            <span className="font-medium capitalize">{entry.type}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-xs uppercase">Created By</span>
                            <span className="font-medium truncate">{entry.users?.name || 'System'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block text-xs uppercase">Payment Mode</span>
                            <span className="font-medium">{entry.payment_mode}</span>
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold uppercase text-gray-500">Financial Impact</h4>
                        <div className="flex justify-between items-center bg-white border p-3 rounded">
                            <span>Debit Account ({entry.type === 'expense' || entry.type === 'income' ? entry.payment_mode : 'Unknown'})</span>
                            <span className="font-mono font-bold text-red-600">
                                {entry.type === 'expense' ? `₹${Number(entry.amount).toLocaleString()}` : '-'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center bg-white border p-3 rounded">
                            <span>Credit Account ({entry.type === 'income' ? 'Sales Revenue' : 'Unknown'})</span>
                            <span className="font-mono font-bold text-green-600">
                                {entry.type === 'income' ? `₹${Number(entry.amount).toLocaleString()}` : '-'}
                            </span>
                        </div>
                    </div>

                    {/* Adjustment Section - Only if Editable */}
                    {canEdit && (
                        <div className="space-y-4 border-t pt-4">
                            <h4 className="text-sm font-semibold uppercase text-gray-500 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                                Correction / Adjustment
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>New Amount</Label>
                                    <Input
                                        type="number"
                                        placeholder={entry.amount}
                                        value={adjustment.amount}
                                        onChange={(e) => setAdjustment(prev => ({ ...prev, amount: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Reason for Change (Mandatory)</Label>
                                <Textarea
                                    placeholder="Required for audit trail..."
                                    value={adjustment.reason}
                                    onChange={(e) => setAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                                />
                            </div>
                        </div>
                    )}

                    {/* Audit Trail Placeholder */}
                    <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold uppercase text-gray-500 mb-2 flex items-center gap-2">
                            <History className="w-4 h-4" />
                            Audit History
                        </h4>
                        <div className="text-xs text-gray-500 space-y-2">
                            <p>• Created by {entry.users?.name} on {format(new Date(entry.created_at), 'dd MMM yyyy HH:mm')}</p>
                            {/* In real app, fetch Audit Log */}
                        </div>
                    </div>
                </div>

                <SheetFooter>
                    {canEdit ? (
                        <Button onClick={() => onSave(adjustment)} disabled={!adjustment.reason}>
                            <Save className="w-4 h-4 mr-2" />
                            Save Adjustment
                        </Button>
                    ) : (
                        <Button variant="secondary" onClick={onClose}>Close Viewer</Button>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
