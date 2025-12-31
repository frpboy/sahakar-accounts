'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Crown, Briefcase, BarChart3, User, Shield, Beaker } from 'lucide-react';

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
            console.log('[LoginForm] Sign in successful, auth state will trigger redirect');
            // Don't redirect here - let the auth state listener handle it
        } catch (err: unknown) {
            console.error('[LoginForm] Sign in error:', err);
            setError(err instanceof Error ? err.message : 'Failed to sign in');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md w-full space-y-8">
            <div>
                <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sahakar Accounts</h1>
                <p className="mt-2 text-center text-sm text-gray-600">Sign in to your account</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm text-gray-600 mb-2">Email address</label>
                        <input
                            id="email"
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm text-gray-600 mb-2">Password</label>
                        <input
                            id="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="••••••••"
                        />
                    </div>
                </div>
                
                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </div>

                {/* Fallback link for resilience */}
                {loading && (
                    <p className="text-center text-sm text-gray-600 mt-4">
                        If you are not redirected automatically,{' '}
                        <a href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
                            click here
                        </a>
                    </p>
                )}
            </form>

            {/* Demo Accounts */}
            <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center flex items-center justify-center gap-2">
                    <Beaker className="w-4 h-4" /> Demo Accounts
                </h3>
                <div className="space-y-2">
                    {[
                        { email: 'frpboy12@gmail.com', role: 'Superadmin', Icon: Crown, accent: false },
                        { email: 'paymentstarterxpmna@gmail.com', role: 'HO Accountant', Icon: Briefcase, accent: true },
                        { email: 'manager.test@sahakar.com', role: 'Manager', Icon: BarChart3, accent: false },
                        { email: 'staff.test@sahakar.com', role: 'Staff', Icon: User, accent: false },
                        { email: 'auditor.test@sahakar.com', role: 'Auditor', Icon: Shield, accent: false },
                    ].map((account) => (
                        <button
                            key={account.email}
                            onClick={() => {
                                setEmail(account.email);
                                setPassword('Zabnix@2025');
                            }}
                            className={`w-full text-left p-3 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors ${account.accent ? 'border-l-4 border-l-green-200 bg-green-50' : ''}`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <account.Icon className="w-4 h-4 text-gray-600" />
                                    <div>
                                        <p className="text-xs font-medium text-gray-700">{account.role}</p>
                                        <p className="text-sm text-gray-800">{account.email}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500">Click to fill</span>
                            </div>
                        </button>
                    ))}
                </div>
                <p className="text-xs text-center text-gray-500 mt-4">
                    All accounts uses password : <code className="bg-gray-100 px-2 py-1 rounded">Zabnix@2025</code>
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Auth-state-based redirect (the correct pattern)
    useEffect(() => {
        if (!loading && user) {
            console.log('[LoginPage] User authenticated, redirecting to dashboard');
            router.replace('/dashboard');
        }
    }, [loading, user, router]);

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
                    <p className="text-sm text-gray-600 mt-4">
                        If you are not redirected automatically,{' '}
                        <a href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium underline">
                            click here
                        </a>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
            <LoginForm />
        </div>
    );
}
