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

    // List of test users for dropdown (Active accounts only - updated 2026-01-01)
    const testUsers = [
        { label: 'Superadmin (Global)', email: 'frpboy12@gmail.com', role: 'Superadmin' },
        { label: 'HO Accountant', email: 'paymentstarterxpmna@gmail.com', role: 'HO Accountant' },
        { label: 'Auditor', email: 'auditor.test@sahakar.com', role: 'Auditor' },
        { label: '--- Active Outlets ---', email: '', role: '', disabled: true },
        { label: 'Tirur - Manager', email: 'manager.hp.tirur@sahakar.com', role: 'Manager' },
        { label: 'Tirur - Staff', email: 'staff.hp.tirur@sahakar.com', role: 'Staff' },
        { label: 'Makkaraparamba - Manager', email: 'manager.hp.makkara@sahakar.com', role: 'Manager' },
        { label: 'Makkaraparamba - Staff', email: 'staff.hp.makkara@sahakar.com', role: 'Staff' },
        { label: 'Melattur - Manager', email: 'manager.hp.melattur@sahakar.com', role: 'Manager' },
        { label: 'Melattur - Staff', email: 'staff.hp.melattur@sahakar.com', role: 'Staff' },
        { label: 'Karinkallathani - Manager', email: 'manager.hp.karinkall@sahakar.com', role: 'Manager' },
        { label: 'Karinkallathani - Staff', email: 'staff.hp.karinkall@sahakar.com', role: 'Staff' },
    ];


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
                    {/* Quick Fill Dropdown */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                        <label className="block text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                            <Beaker className="w-4 h-4" /> Quick Fill Credentials
                        </label>
                        <select
                            className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            onChange={(e) => {
                                const user = testUsers.find(u => u.email === e.target.value);
                                if (user) {
                                    setEmail(user.email);
                                    setPassword('Zabnix@2025');
                                }
                            }}
                            defaultValue=""
                        >
                            <option value="" disabled>Select a user to prefill...</option>
                            {testUsers.map((u, i) => (
                                <option key={i} value={u.email} disabled={u.disabled} className={u.disabled ? 'font-bold bg-gray-100 text-gray-500' : ''}>
                                    {u.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-blue-600 mt-2">
                            Selecting a user will auto-fill email & password.
                        </p>
                    </div>

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
