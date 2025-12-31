import { createAdminClient, createServerSupabase } from '@/lib/supabase-server';
import { AuthErrorState } from '@/components/auth-error-state';
import { PageAuditLogger } from '@/components/page-audit-logger';
import { Sidebar } from '@/components/layout/sidebar';
import { AppProvider } from '@/components/providers/app-provider';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createServerSupabase();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        console.error('[DashboardLayout] Auth error:', authError);
        return <AuthErrorState message="Authentication required. Please log in again." />;
    }

    return (
        <AppProvider>
            <div className="flex h-screen bg-gray-50 overflow-hidden">
                {/* Sidebar */}
                <Sidebar className="w-64 flex-shrink-0 hidden lg:flex" />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    <main className="flex-1 overflow-y-auto focus:outline-none">
                        <PageAuditLogger path="/dashboard" />
                        {children}
                    </main>
                </div>
            </div>
        </AppProvider>
    );
}
