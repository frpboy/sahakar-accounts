'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('[LoginForm] Attempting sign in for:', email);
            await signIn(email, password);
            console.log('[LoginForm] Sign in successful, middleware will handle redirect');
        } catch (err: any) {
            console.error('[LoginForm] Sign in error:', err);
            setError(err.message || 'Failed to sign in');
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Sahakar Accounts
                </h1>
                <p className="text-gray-600">Sign in to your account</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="you@example.com"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">🧪 Demo Accounts</h3>
                <div className="space-y-2">
                    {[
                        { email: 'frpboy12@gmail.com', role: '👑 Superadmin', color: 'bg-purple-50 border-purple-200 text-purple-900' },
                        { email: 'paymentstarlexpmna@gmail.com', role: '💼 HO Accountant', color: 'bg-green-50 border-green-200 text-green-900' },
                        { email: 'manager.test@sahakar.com', role: '📊 Manager', color: 'bg-blue-50 border-blue-200 text-blue-900' },
                        { email: 'staff.test@sahakar.com', role: '👤 Staff', color: 'bg-orange-50 border-orange-200 text-orange-900' },
                        { email: 'auditor.test@sahakar.com', role: '🛡️ Auditor', color: 'bg-gray-50 border-gray-200 text-gray-900' },
                    ].map((account) => (
                        <button
                            key={account.email}
                            onClick={() => {
                                setEmail(account.email);
                                setPassword('Zabnix@2025');
                            }}
                            className={`w-full text-left p-3 border rounded-lg hover:shadow-md transition-all ${account.color}`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium opacity-75">{account.role}</p>
                                    <p className="text-sm font-mono">{account.email}</p>
                                </div>
                                <span className="text-xs opacity-50">Click to fill</span>
                            </div>
                        </button>
                    ))}
                </div>
                <p className="text-xs text-center text-gray-500 mt-4">
                    All accounts use password: <code className="bg-gray-100 px-2 py-1 rounded">Zabnix@2025</code>
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    const { user, loading } = useAuth();

    // Redirection is handled by server-side middleware for stability.
    // This client component only shows the UI.

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-700 font-medium">Redirecting to dashboard...</p>
                    <p className="text-xs text-gray-400 mt-2">Authenticated as {user.email}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <LoginForm />
        </div>
    );
}
