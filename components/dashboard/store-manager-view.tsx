'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { MetricCard } from '@/components/dashboard/metrics/metric-card';
import { SalesTrendChart } from '@/components/dashboard/charts/sales-trend-chart';
import { PaymentModePie } from '@/components/dashboard/charts/payment-mode-pie';
import { RecentTransactions } from '@/components/dashboard/widgets/recent-transactions';
import { QuickActions } from '@/components/dashboard/widgets/quick-actions';
import { TopStaff } from '@/components/dashboard/widgets/top-staff';
import {
    IndianRupee,
    Users,
    TrendingUp,
    CreditCard,
    Calendar,
    Download,
    Lock,
    Unlock,
    RefreshCw,
    FileSpreadsheet,
    FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportUtils } from '@/lib/export-utils';

export function StoreManagerDashboard() {
    const supabase = useMemo(() => createClientBrowser(), []);
    const { user } = useAuth();

    // Stats states
    const [todayRevenue, setTodayRevenue] = useState(0);
    const [yesterdayRevenue, setYesterdayRevenue] = useState(0);
    const [pendingCredits, setPendingCredits] = useState(0);
    const [creditCustomerCount, setCreditCustomerCount] = useState(0);
    const [monthlyRevenue, setMonthlyRevenue] = useState(0);
    const [staffTransactions, setStaffTransactions] = useState<any[]>([]);

    // Charts states
    const [salesTrendData, setSalesTrendData] = useState<any[]>([]);
    const [paymentModeData, setPaymentModeData] = useState<any[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

    // UI states
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [dayLocked, setDayLocked] = useState(false);

    useEffect(() => {
        loadDashboardData();
        const interval = setInterval(loadDashboardData, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const loadDashboardData = async (silent = false) => {
        if (!user?.profile?.outlet_id) {
            setLoading(false);
            return;
        }

        if (!silent) setLoading(true);
        else setIsRefreshing(true);

        const outletId = user.profile.outlet_id;
        const today = new Date().toISOString().split('T')[0];
        const yesterdayDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const monthStart = new Date().toISOString().substring(0, 7) + '-01';

        try {
            const sb = supabase as any;

            // 1. Today's Revenue
            const { data: todaySales } = await sb
                .from('transactions')
                .select('amount')
                .eq('outlet_id', outletId)
                .eq('type', 'income')
                .eq('category', 'sales')
                .gte('created_at', today);

            const todayTotal = todaySales?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;
            setTodayRevenue(todayTotal);

            // 2. Yesterday's Revenue
            const { data: yesterdaySales } = await sb
                .from('transactions')
                .select('amount')
                .eq('outlet_id', outletId)
                .eq('type', 'income')
                .eq('category', 'sales')
                .gte('created_at', yesterdayDate)
                .lt('created_at', today);

            const yesterdayTotal = yesterdaySales?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;
            setYesterdayRevenue(yesterdayTotal);

            // 3. Pending Credits
            const { data: credits } = await sb
                .from('transactions')
                .select('amount')
                .eq('outlet_id', outletId)
                .eq('type', 'income')
                .eq('category', 'credit_received')
                .eq('payment_mode', 'Credit');

            const totalCredits = credits?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;
            setPendingCredits(totalCredits);
            setCreditCustomerCount(credits?.length || 0);

            // 4. Monthly Revenue
            const { data: monthSales } = await sb
                .from('transactions')
                .select('amount')
                .eq('outlet_id', outletId)
                .eq('type', 'income')
                .eq('category', 'sales')
                .gte('created_at', monthStart);

            const monthTotal = monthSales?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;
            setMonthlyRevenue(monthTotal);

            // 5. Staff Performance
            const { data: staffData } = await sb
                .from('transactions')
                .select('created_by, amount, users(name, email)')
                .eq('outlet_id', outletId)
                .eq('type', 'income')
                .gte('created_at', today);

            const staffMap = new Map();
            staffData?.forEach((t: any) => {
                const userId = t.created_by;
                if (!staffMap.has(userId)) {
                    staffMap.set(userId, {
                        name: t.users?.name || t.users?.email || 'Unknown',
                        count: 0,
                        total: 0
                    });
                }
                const staff = staffMap.get(userId);
                staff.count++;
                staff.total += Number(t.amount);
            });
            setStaffTransactions(Array.from(staffMap.values()));

            // 6. Sales Trend (7 Days)
            const trendData = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(Date.now() - i * 86400000);
                const dStr = date.toISOString().split('T')[0];
                const nextDStr = new Date(date.getTime() + 86400000).toISOString().split('T')[0];

                const { data: dSales } = await sb
                    .from('transactions')
                    .select('amount')
                    .eq('outlet_id', outletId)
                    .eq('type', 'income')
                    .eq('category', 'sales')
                    .gte('created_at', dStr)
                    .lt('created_at', nextDStr);

                const dTotal = dSales?.reduce((sum: number, t: any) => sum + Number(t.amount), 0) || 0;
                trendData.push({ date: dStr, sales: dTotal });
            }
            setSalesTrendData(trendData);

            // 7. Payment Mode Distribution
            const { data: payments } = await sb
                .from('transactions')
                .select('payment_mode, amount')
                .eq('outlet_id', outletId)
                .eq('type', 'income')
                .gte('created_at', monthStart);

            const modeMap = { Cash: 0, UPI: 0, Card: 0, Credit: 0 };
            payments?.forEach((p: any) => {
                const mode = p.payment_mode || 'Cash';
                if (modeMap.hasOwnProperty(mode)) {
                    modeMap[mode as keyof typeof modeMap] += Number(p.amount);
                }
            });
            const mData = Object.entries(modeMap)
                .filter(([_, value]) => value > 0)
                .map(([name, value]) => ({ name, value }));
            setPaymentModeData(mData);

            // 8. Recent Transactions
            const { data: recent } = await sb
                .from('transactions')
                .select('id, created_at, description, amount, type, category')
                .eq('outlet_id', outletId)
                .order('created_at', { ascending: false })
                .limit(10);
            setRecentTransactions(recent || []);

            // 9. Day Lock Status
            const { data: dailyRec } = await sb
                .from('daily_records')
                .select('status')
                .eq('outlet_id', outletId)
                .eq('date', today)
                .single();
            setDayLocked(dailyRec?.status === 'locked');

        } catch (err) {
            console.error('Error loading dashboard:', err);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleLockDay = async () => {
        if (!user?.profile?.outlet_id) return;

        const today = new Date().toISOString().split('T')[0];
        const action = dayLocked ? 'unlock' : 'lock';

        const confirmed = confirm(
            `Are you sure you want to ${action} today's business day?\n\n` +
            `This will ${action === 'lock' ? 'prevent' : 'allow'} further transactions for ${today}.`
        );

        if (!confirmed) return;

        try {
            const newStatus = dayLocked ? 'open' : 'locked';
            const { error } = await (supabase as any)
                .from('daily_records')
                .upsert({
                    outlet_id: user.profile.outlet_id,
                    date: today,
                    status: newStatus,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'outlet_id,date'
                });

            if (error) throw error;

            setDayLocked(!dayLocked);
            alert(`✅ Day ${action}ed successfully!`);
            loadDashboardData(true);
        } catch (error) {
            console.error('Error toggling day lock:', error);
            alert(`❌ Failed to ${action} day.`);
        }
    };

    const handleExportExcel = () => {
        const data = recentTransactions.map(t => ({
            'Date': new Date(t.created_at).toLocaleDateString(),
            'Category': t.category,
            'Description': t.description || '-',
            'Amount': t.amount,
            'Type': t.type
        }));

        exportUtils.toExcel(data, {
            filename: `Recent_Sales_${user?.profile?.outlet_id}_${new Date().toISOString().split('T')[0]}`,
            title: 'Outlet Recent Transactions'
        });
    };

    const handleExportPDF = () => {
        const data = recentTransactions.map(t => [
            new Date(t.created_at).toLocaleTimeString(),
            t.category,
            t.amount,
            t.type
        ]);

        exportUtils.toPDF(
            ['Time', 'Category', 'Amount', 'Type'],
            data,
            {
                filename: `Recent_Sales_${user?.profile?.outlet_id}_${new Date().toISOString().split('T')[0]}`,
                title: 'Sahakar Accounts - Management Export',
                subtitle: `Outlet: ${(user?.profile as any)?.outlet_name || user?.profile?.outlet_id || 'Main'} | Revenue: Rs. ${todayRevenue.toLocaleString()}`
            }
        );
    };

    if (loading) {
        return <div className="p-6 text-center">Loading Manager Dashboard...</div>;
    }

    // Calc revenue trend
    const revenueGap = todayRevenue - yesterdayRevenue;
    const revenueTrend = yesterdayRevenue > 0
        ? (revenueGap / yesterdayRevenue) * 100
        : (todayRevenue > 0 ? 100 : 0);

    return (
        <div className="p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Manager Dashboard</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Real-time overview for your outlet</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => loadDashboardData(true)}
                        disabled={isRefreshing}
                        className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
                    </button>

                    <button
                        onClick={handleLockDay}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border transition-all shadow-sm",
                            dayLocked
                                ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40"
                                : "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50 hover:bg-green-100 dark:hover:bg-green-900/40"
                        )}
                    >
                        {dayLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        {dayLocked ? "Unlock Day" : "Lock Day"}
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-green-300 dark:border-green-800 text-green-700 dark:text-green-400 text-xs font-bold rounded-md hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors shadow-sm"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Excel
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-bold rounded-md hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors shadow-sm"
                        >
                            <FileText className="w-4 h-4" />
                            PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                <MetricCard
                    title="Today's Revenue"
                    value={`₹${todayRevenue.toLocaleString()}`}
                    icon={<IndianRupee className="w-5 h-5 text-green-600" />}
                    trend={revenueTrend > 0 ? 'up' : revenueTrend < 0 ? 'down' : 'neutral'}
                    trendValue={`${Math.abs(Math.round(revenueTrend))}%`}
                    subtitle="vs. yesterday"
                />
                <MetricCard
                    title="Pending Credits"
                    value={`₹${pendingCredits.toLocaleString()}`}
                    icon={<CreditCard className="w-5 h-5 text-orange-600" />}
                    subtitle={`${creditCustomerCount} customers`}
                />
                <MetricCard
                    title="Staff Productivity"
                    value={staffTransactions.length.toString()}
                    icon={<Users className="w-5 h-5 text-blue-600" />}
                    subtitle="users active today"
                />
                <MetricCard
                    title="Monthly Progress"
                    value={`₹${monthlyRevenue.toLocaleString()}`}
                    icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
                    subtitle="MTD Revenue"
                />
            </div>

            {/* Charts & Widgets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Charts Area */}
                <div className="lg:col-span-8 space-y-6">
                    <SalesTrendChart
                        data={salesTrendData}
                        title="Sales Performance (Last 7 Days)"
                    />
                    <RecentTransactions transactions={recentTransactions} />
                </div>

                {/* Sidebar Widgets Area */}
                <div className="lg:col-span-4 space-y-6">
                    <QuickActions />
                    <PaymentModePie data={paymentModeData} />
                    <TopStaff data={staffTransactions} />
                </div>
            </div>
        </div>
    );
}
