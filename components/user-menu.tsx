'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@/lib/db';

export function UserMenu({ user }: { user: User }) {
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                <p className="text-xs text-gray-500">
                    {user.role.replace('_', ' ').toUpperCase()}
                </p>
            </div>
            <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
                Logout
            </button>
        </div>
    );
}
