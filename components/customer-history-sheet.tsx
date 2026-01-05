import React, { useEffect, useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { User, TrendingUp, TrendingDown, Wallet, ChevronDown, Loader2 } from 'lucide-react';
import { LedgerTable } from '@/components/ledger/ledger-table';

interface CustomerHistorySheetProps {
    customer: any | null;
    open: boolean;
    onClose: () => void;
}

export function CustomerHistorySheet({ customer, open, onClose }: CustomerHistorySheetProps) {
    const { user } = useAuth();
    const supabase = useMemo(() => createClientBrowser(), []);

    // Pagination State
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 20;

    // Stats State
    const [stats, setStats] = useState({
        totalSales: 0,
        totalReturns: 0,
        netSpend: 0
    });
    const [statsLoading, setStatsLoading] = useState(false);

    // 1. Fetch Aggregated Stats (Efficiently)
    useEffect(() => {
        if (!open || !customer || !user?.profile?.outlet_id) return;

        async function fetchStats() {
            setStatsLoading(true);
            try {
                // Fetch ALL relevant rows but ONLY necessary columns for calculation
                // This is much lighter than fetching all columns for 1000s of rows
                const { data } = await (supabase as any)
                    .from('transactions')
                    .select('type, category, amount')
                    .eq('outlet_id', user.profile.outlet_id)
                    .eq('customer_id', customer.id);

                let sales = 0;
                let returns = 0;

                (data || []).forEach((t: any) => {
                    const amt = parseFloat(t.amount) || 0;
                    if (t.type === 'income' && t.category === 'sales') {
                        sales += amt;
                    } else if (t.type === 'expense' && t.category === 'sales_return') {
                        returns += amt;
                    }
                });

                setStats({
                    totalSales: sales,
                    totalReturns: returns,
                    netSpend: sales - returns
                });
            } catch (e) {
                console.error("Stats fetch error", e);
            } finally {
                setStatsLoading(false);
            }
        }
        fetchStats();
    }, [open, customer, user, supabase]);

    // 2. Fetch Transactions (Paginated)
    const loadTransactions = async (pageNum: number, isInitial = false) => {
        if (!customer || !user?.profile?.outlet_id) return;

        if (isInitial) {
            setLoading(true);
            setTransactions([]);
        } else {
            setLoadingMore(true);
        }

        try {
            const from = pageNum * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error } = await (supabase as any)
                .from('transactions')
                .select('*')
                .eq('outlet_id', user.profile.outlet_id)
                .eq('customer_id', customer.id)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            const newTxs = data || [];

            if (isInitial) {
                setTransactions(newTxs);
            } else {
                setTransactions(prev => [...prev, ...newTxs]);
            }

            if (newTxs.length < PAGE_SIZE) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

            setPage(pageNum);

        } catch (e) {
            console.error("Tx load error", e);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Reset and Load Initial on Open
    useEffect(() => {
        if (open && customer) {
            setPage(0);
            setHasMore(true);
            loadTransactions(0, true);
        }
    }, [open, customer]);

    return (
        <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
            <SheetContent side="right" className="w-[90%] sm:max-w-4xl p-0 overflow-hidden flex flex-col bg-gray-50 dark:bg-slate-900 border-l dark:border-slate-800">
                <SheetHeader className="p-6 bg-white dark:bg-slate-900 border-b dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-bold dark:text-white">{customer?.name}</SheetTitle>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                {customer?.phone} • ID: {customer?.internal_customer_id || customer?.customer_code || 'N/A'}
                            </p>
                        </div>
                    </div>
                </SheetHeader>

                <div className="p-6 overflow-y-auto flex-1">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-700 dark:text-green-400">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Purchases</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {statsLoading ? '...' : `₹${stats.totalSales.toLocaleString()}`}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-700 dark:text-orange-400">
                                    <TrendingDown className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Returns</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {statsLoading ? '...' : `₹${stats.totalReturns.toLocaleString()}`}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 shadow-sm bg-gradient-to-br from-blue-50 to-white dark:from-slate-800 dark:to-slate-800">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-700 dark:text-blue-400">
                                    <Wallet className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium text-gray-500 dark:text-slate-400">Net Spend</span>
                            </div>
                            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                {statsLoading ? '...' : `₹${stats.netSpend.toLocaleString()}`}
                            </div>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold mb-4 dark:text-white">Transaction History</h3>

                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
                            <p className="text-gray-500">Loading history...</p>
                        </div>
                    ) : (
                        <div>
                            <LedgerTable
                                entries={transactions}
                                role={user?.profile?.role}
                                isDayLocked={false}
                                onRowClick={() => { }}
                            />

                            {hasMore && (
                                <div className="mt-6 text-center">
                                    <button
                                        onClick={() => loadTransactions(page + 1)}
                                        disabled={loadingMore}
                                        className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                                    >
                                        {loadingMore ? <Loader2 className="animate-spin w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        Load More History
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
