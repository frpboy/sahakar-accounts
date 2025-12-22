'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getRoleDashboard } from '@/components/protected-route';

function LoginForm() {
    const router = useRouter();
    const { signIn, user } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(email, password);

            // Wait a bit for the auth context to update
            setTimeout(() => {
                if (user?.profile?.role) {
                    router.push(getRoleDashboard(user.profile.role));
                } else {
                    router.push('/dashboard');
                }
                router.refresh();
            }, 500);
        } catch (err: any) {
            setError(err.message || 'Failed to login. Please check your credentials.');
            setLoading(false);
        }
    };

    return (
        <div className="bg-white shadow-xl rounded-lg px-8 py-10 max-w-md w-full">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900">Sahakar Accounts</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Hyperpharmacy Accounting System
                </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="you@example.com"
                        autoComplete="email"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="••••••••"
                        autoComplete="current-password"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
                <p>Need help? Contact your administrator</p>
            </div>
        </div>
    );
}


export default function LoginPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Simple redirect if already logged in
    if (!loading && user?.profile?.role) {
        router.push(getRoleDashboard(user.profile.role));
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <LoginForm />
        </div>
    );
}
