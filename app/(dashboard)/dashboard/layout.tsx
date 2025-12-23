import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase-server';
import { DashboardNav } from '@/components/dashboard-nav';
import { UserMenu } from '@/components/user-menu';
import type { UserProfile } from '@/lib/auth-context';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createServerClient();

    console.log('[DashboardLayout] Fetching user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
        console.error('[DashboardLayout] Auth error:', authError);
    }

    if (!user) {
        console.log('[DashboardLayout] No user found, redirecting to login');
        redirect('/login');
    }

    console.log('[DashboardLayout] User found:', user.email, 'Fetching profile...');

    const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    if (dbError) {
        console.error('[DashboardLayout] Database error fetching profile:', dbError);
    }

    if (!userData) {
        console.log('[DashboardLayout] No profile found for user, redirecting to login');
        redirect('/login');
    }

    console.log('[DashboardLayout] Profile loaded successfully for:', (userData as any)?.email);

    const typedUserData = userData as UserProfile & { id: string; email: string };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-xl font-bold text-gray-900">
                                Sahakar Accounts
                            </h1>
                        </div>
                        <UserMenu user={typedUserData} />
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-white border-r min-h-[calc(100vh-4rem)] hidden lg:block">
                    <DashboardNav role={typedUserData.role} />
                </aside>

                {/* Main content */}
                <main className="flex-1 p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
