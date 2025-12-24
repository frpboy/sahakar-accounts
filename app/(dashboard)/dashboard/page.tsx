import { createServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Note: Middleware already protects this route
    // If user is null here, middleware failed - but we shouldn't double-redirect
    if (!user) {
        console.error('[DashboardPage] No User found - middleware should have caught this');
        return (
            <div className="p-6">
                <p className="text-red-600">Authentication error. Please refresh the page.</p>
            </div>
        );
    }

    // Fetch user profile with outlet_id
    const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single() as { data: any, error: any }; // Type cast for build fix

    let outlets: any[] = [];

    if (userProfile) {
        if (['master_admin', 'ho_accountant', 'superadmin'].includes(userProfile.role)) {
            const { data } = await supabase
                .from('outlets')
                .select('*')
                // .eq('is_active', true) // Schema mismatch fix
                .order('name');
            outlets = data || [];
        } else if (userProfile.outlet_id) {
            const { data } = await supabase
                .from('outlets')
                .select('*')
                .eq('id', userProfile.outlet_id); // Fetch assigned outlet
            outlets = data || [];
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">
                    Welcome back, {userProfile?.full_name || userProfile?.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Role: {userProfile?.role?.replace('_', ' ').toUpperCase()}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Total Outlets Card */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Outlets</p>
                            <p className="mt-2 text-3xl font-semibold text-gray-900">
                                {outlets.length}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <svg
                                className="w-6 h-6 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Pending Entries Card */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Pending Entries</p>
                            <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-full">
                            <svg
                                className="w-6 h-6 text-yellow-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Submitted Today Card */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Submitted Today</p>
                            <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <svg
                                className="w-6 h-6 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        Your Outlets
                    </h3>
                </div>
                <div className="p-6">
                    {outlets.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            No outlets assigned yet
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {outlets.map((outlet) => (
                                <div
                                    key={outlet.id}
                                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <h4 className="font-medium text-gray-900">{outlet.name}</h4>
                                    <p className="text-sm text-gray-500 mt-1">{outlet.code}</p>
                                    {outlet.location && (
                                        <p className="text-xs text-gray-400 mt-1">{outlet.location}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
