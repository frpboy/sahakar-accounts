import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Save, AlertTriangle, History, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Updated Contract
// LedgerDrawerProps {
//   entry: LedgerEntry
//   role: UserRole
//   canEdit: boolean
//   lockReason?: string
//   actionType: 'edit' | 'reverse' | 'view_only'
//   open: boolean
//   onClose: () => void
//   onSave: (data: { reason: string, type: 'reversal' | 'adjustment' }) => void
// }

export function LedgerDrawer({ entry, role, canEdit, lockReason, actionType, open, onClose, onSave }: any) {
    if (!entry) return null;

    const [reason, setReason] = React.useState('');

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-bold">Ledger Entry #{entry.id.substring(0, 6)}</SheetTitle>
                        {canEdit ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                {actionType === 'reverse' ? 'Correction Enabled' : 'Editable'}
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

                    {/* Reversal / Adjustment Section */}
                    {canEdit && (
                        <div className="space-y-4 border-t pt-4 bg-amber-50/50 p-4 rounded border-amber-100">
                            <h4 className="text-sm font-semibold uppercase text-amber-700 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Post Correction (Reversal)
                            </h4>
                            <p className="text-xs text-amber-600">
                                This entry is finalized. To correct it, you must post a **Reversal Entry**.
                                This will nullify the financial impact while preserving the audit trail.
                            </p>

                            <div className="space-y-2">
                                <Label>Reason for Reversal (Mandatory)</Label>
                                <Textarea
                                    placeholder="E.g., Wrong amount entered, Duplicate entry..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="bg-white"
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
                        <Button
                            variant="destructive"
                            onClick={() => onSave({ reason, type: 'reversal' })}
                            disabled={!reason || reason.length < 5}
                            className="w-full sm:w-auto"
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Post Reversal Entry
                        </Button>
                    ) : (
                        <Button variant="secondary" onClick={onClose}>Close Viewer</Button>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
