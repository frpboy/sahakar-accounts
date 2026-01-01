'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Store, TrendingUp, Users, Award, Download } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import { useAuth } from '@/lib/auth-context';

type OutletPerf = { name: string; sales: number };
type GrowthPoint = { month: string; total: number };
type Referrer = { name: string; count: number };

export function AdminDashboard() {
    const { user } = useAuth();
    const [outletCount, setOutletCount] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalCustomers, setTotalCustomers] = useState(0);
    const [outletPerformance, setOutletPerformance] = useState<OutletPerf[]>([]);
    const [customerGrowth, setCustomerGrowth] = useState<GrowthPoint[]>([]);
    const [topReferrers, setTopReferrers] = useState<Referrer[]>([]);

    useEffect(() => {
        let mounted = true;
        async function load() {
            const role = user?.profile.role;
            if (!role || !['superadmin', 'master_admin', 'ho_accountant'].includes(role)) {
                setOutletCount(0);
                setTotalRevenue(0);
                setTotalCustomers(0);
                setOutletPerformance([]);
                setCustomerGrowth([]);
                setTopReferrers([]);
                return;
            }
            try {
                const res = await fetch('/api/outlets', { cache: 'no-store' });
                const outlets = res.ok ? await res.json() : [];
                setOutletCount((outlets || []).length);

                const now = new Date();
                const yyyy = now.getFullYear();
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const monthStr = `${yyyy}-${mm}`;

                const perf: OutletPerf[] = [];
                let revenueSum = 0;
                for (const o of (outlets || [])) {
                    const r = await fetch(`/api/reports/cash-flow?outletId=${encodeURIComponent(o.id)}&month=${monthStr}`, { cache: 'no-store' });
                    const cf = r.ok ? await r.json() : [];
                    const outletTotal = (cf || []).reduce((s: number, d: any) => s + Number(d.cash_in || 0) + Number(d.upi_in || 0), 0);
                    perf.push({ name: o.name, sales: outletTotal });
                    revenueSum += outletTotal;
                }
                if (!mounted) return;
                setOutletPerformance(perf);
                setTotalRevenue(revenueSum);

                // Fetch customer growth data
                const growthRes = await fetch('/api/reports/customer-growth?months=6', { cache: 'no-store' });
                if (growthRes.ok) {
                    const growthData = await growthRes.json();
                    const formatted = growthData.labels.map((label: string, idx: number) => ({
                        month: label,
                        total: growthData.values[idx]
                    }));
                    setCustomerGrowth(formatted);
                    setTotalCustomers(growthData.total);
                } else {
                    setCustomerGrowth([]);
                }

                // Fetch top referrers
                const referrersRes = await fetch('/api/reports/top-referrers?limit=5', { cache: 'no-store' });
                if (referrersRes.ok) {
                    const referrersData = await referrersRes.json();
                    setTopReferrers(referrersData.referrers || []);
                } else {
                    setTopReferrers([]);
                }

            } catch {
                if (!mounted) return;
                setOutletCount(0);
                setTotalRevenue(0);
                setTotalCustomers(0);
                setOutletPerformance([]);
                setCustomerGrowth([]);
                setTopReferrers([]);
            }
        }
        load();
        return () => { mounted = false; };
    }, [user]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-500">Total Outlets</span>
                        <Store className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{outletCount}</div>
                    <div className="text-xs text-gray-500 mt-1">Active stores</div>
                </div>
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-500">Total Revenue</span>
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">₹{Math.round(totalRevenue).toLocaleString('en-IN')}</div>
                    <div className="text-xs text-green-600 mt-1">This month</div>
                </div>
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-500">Total Customers</span>
                        <Users className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{totalCustomers.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">Last 6 months</div>
                </div>
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-500">Top Performer</span>
                        <Award className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">—</div>
                    <div className="text-xs text-gray-500 mt-1">This month</div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">Data Export</h3>
                    <p className="text-xs text-gray-500">Export customer and sales data</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center px-3 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <Download className="w-4 h-4 mr-2" /> Export Customers
                    </button>
                    <button className="flex items-center px-3 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <Download className="w-4 h-4 mr-2" /> Export Sales
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Outlet-wise Sales Performance</h3>
                <p className="text-sm text-gray-500 mb-6">This month</p>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={outletPerformance}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₹${Number(value) / 1000}K`} />
                            <Tooltip formatter={(value) => [`₹${Math.round(Number(value))}`, 'Sales']} cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={60} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Customer Growth Trend</h3>
                    <p className="text-sm text-gray-500 mb-6">Last 6 months</p>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={customerGrowth}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#10B981"
                                    strokeWidth={2}
                                    dot={{ r: 4, fill: "#10B981", strokeWidth: 2, stroke: "#fff" }}
                                    name="New Customers"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Top Referrers</h3>
                            <p className="text-sm text-gray-500">All-time leaderboard</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {topReferrers.length === 0 ? (
                            <div className="text-sm text-gray-500 text-center py-8">No referral data yet</div>
                        ) : (
                            topReferrers.map((referrer, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-blue-50 text-blue-700'
                                            }`}>
                                            {idx + 1}
                                        </div>
                                        <span className="font-medium text-gray-900">{referrer.name}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-blue-600">{referrer.count} referrals</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
