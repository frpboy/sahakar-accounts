'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface UserMenuProps {
    user: {
        full_name?: string;
        name?: string;
        role: string;
    };
}

export function UserMenu({ user }: UserMenuProps) {
    const router = useRouter();
    const { signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
    };

    const displayName = user.full_name || user.name || 'User';

    return (
        <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{displayName}</p>
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
