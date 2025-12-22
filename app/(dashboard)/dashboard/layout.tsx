import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import { DashboardNav } from '@/components/dashboard-nav';
import { UserMenu } from '@/components/user-menu';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!userData) {
        redirect('/login');
    }

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
                        <UserMenu user={userData} />
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-white border-r min-h-[calc(100vh-4rem)] hidden lg:block">
                    <DashboardNav role={userData.role} />
                </aside>

                {/* Main content */}
                <main className="flex-1 p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
