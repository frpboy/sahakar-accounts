'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Plus, Search, FolderTree, Lock, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ChartOfAccountsPage() {
    const { user } = useAuth();
    const supabase = useMemo(() => createClientBrowser(), []);
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const loadAccounts = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('ledger_accounts')
                .select('*')
                .order('code');

            if (error) throw error;
            setAccounts(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    const buildTree = (parentId: string | null = null, level = 0): any[] => {
        return accounts
            .filter(a => a.parent_id === parentId)
            .map(a => ({
                ...a,
                level,
                children: buildTree(a.id, level + 1)
            }));
    };

    const accountTree = useMemo(() => buildTree(null), [accounts]);

    const AccountRow = ({ account }: { account: any }) => {
        const isLeaf = account.children.length === 0;
        const isAdmin = user?.profile.role === 'master_admin' || user?.profile.role === 'superadmin';

        return (
            <div className="flex flex-col">
                <div className={cn(
                    "flex items-center justify-between p-3 rounded-xl mb-1 transition-all",
                    account.level === 0 ? "bg-gray-100 dark:bg-gray-700/50 font-bold" :
                        account.level === 1 ? "bg-gray-50 dark:bg-gray-800/30 font-semibold ml-6" : "bg-white dark:bg-gray-800 ml-12 border",
                    !isLeaf && "text-blue-700 dark:text-blue-400"
                )}>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono bg-white dark:bg-gray-950 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-800">
                            {account.code}
                        </span>
                        <span>{account.name}</span>
                        {account.is_system && <Lock className="w-3 h-3 text-gray-400" />}
                    </div>

                    <div className="flex items-center gap-4">
                        <span className={cn(
                            "text-[10px] uppercase font-bold px-2 py-0.5 rounded",
                            account.type === 'Asset' ? "bg-green-100 text-green-700" :
                                account.type === 'Liability' ? "bg-red-100 text-red-700" :
                                    account.type === 'Income' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                        )}>
                            {account.type}
                        </span>

                        {isAdmin && !account.is_system && (
                            <Button size="sm" variant="ghost" className="h-8 text-xs">Edit</Button>
                        )}
                        {isLeaf && (
                            <span className="text-[10px] text-gray-400 font-medium italic">Leaf / Postable</span>
                        )}
                    </div>
                </div>
                {account.children.map((child: any) => (
                    <AccountRow key={child.id} account={child} />
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <TopBar title="Chart of Accounts (Governance)" />

            <div className="p-6 overflow-auto">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold">Ledger Hierarchy</h1>
                            <p className="text-sm text-gray-500">Only Admin can modify system accounts. Leaf accounts are postable.</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Find account..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button className="bg-blue-600">
                                <Plus className="w-4 h-4 mr-2" /> Add Ledger
                            </Button>
                        </div>
                    </div>

                    <Card className="rounded-2xl border-none shadow-xl shadow-blue-500/5">
                        <CardHeader className="border-b bg-white dark:bg-gray-800 rounded-t-2xl">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                                <FolderTree className="w-4 h-4" />
                                Account Registry
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {loading ? (
                                <div className="p-20 text-center animate-pulse">Building Hierarchy Tree...</div>
                            ) : (
                                accountTree.map(root => (
                                    <AccountRow key={root.id} account={root} />
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-800 flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-amber-600 mt-1" />
                        <div>
                            <h3 className="font-bold text-amber-900 dark:text-amber-100">Governance Rule: Posterior Ledgering Only</h3>
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                Transactions can only be posted to "Leaf" accounts (e.g., Cash in Hand). Root accounts (e.g., Assets) are for aggregation and reporting only. This ensures Trial Balance integrity.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
