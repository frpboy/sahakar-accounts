import { createServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AuditorDashboard() {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // Double check role server-side
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'auditor') {
        return <div className="p-8 text-red-600">Unauthorized: Auditor access only.</div>;
    }

    // Fetch ONLY locked records (RLS will enforce this, but good to filter)
    const { data: lockedRecords } = await supabase
        .from('daily_records')
        .select(`
            *,
            outlets ( name, code )
        `)
        .eq('status', 'locked')
        .order('date', { ascending: false })
        .limit(50);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Auditor Dashboard</h1>
                    <p className="text-sm text-gray-500">
                        Scope: Read-Only Access • Locked Records Only
                    </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
                    <span className="text-yellow-800 text-sm font-medium">
                        🛡️ Audit Mode Active
                    </span>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Ready for Audit (Locked Days)
                    </h3>
                </div>

                {!lockedRecords || lockedRecords.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No locked records found for audit verified.
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outlet</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Expense</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {lockedRecords.map((record: any) => (
                                <tr key={record.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {new Date(record.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {record.outlets?.name} ({record.outlets?.code})
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                                        ₹{record.total_income}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                                        ₹{record.total_expense}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            LOCKED
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
