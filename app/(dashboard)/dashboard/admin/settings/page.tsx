'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { User, Shield, Info, Database } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const supabase = createClientBrowser();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [form, setForm] = useState({
        name: user?.profile?.name || '',
        phone: (user?.profile as any)?.phone || '', // Type assertion for phone
    });

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setMessage('');

        try {
            // Update the profile JSON column in users table
            // We preserve existing profile data and merge new values
            const updatedProfile = {
                ...user.profile,
                name: form.name,
                phone: form.phone
            };

            const { error } = await supabase
                .from('users')
                .update({ profile: updatedProfile })
                .eq('id', user.id);

            if (error) throw error;

            setMessage('Allowed changes saved successfully. Reloading...');

            // Force reload to refresh AuthContext since we don't have a refresh method exposed
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (err: any) {
            setMessage('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <TopBar title="System Settings" />

            <div className="p-6 max-w-4xl mx-auto w-full space-y-6">

                {/* Profile Settings */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" /> My Profile
                    </h2>
                    <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Display Name</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="mt-1 w-full border rounded-md p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <input
                                type="text"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                className="mt-1 w-full border rounded-md p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email (Read Only)</label>
                            <input
                                type="text"
                                value={user?.email || ''}
                                disabled
                                className="mt-1 w-full border rounded-md p-2 bg-gray-100 text-gray-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Role</label>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-bold uppercase">
                                    {user?.profile?.role}
                                </span>
                            </div>
                        </div>

                        {message && (
                            <p className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                                {message}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Profile'}
                        </button>
                    </form>
                </div>

                {/* System Info */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5" /> System Information
                    </h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500">App Version</p>
                            <p className="font-medium">v1.2.0 (Sahakar Core)</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Environment</p>
                            <p className="font-medium capitalize">{process.env.NODE_ENV}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Database Status</p>
                            <p className="font-medium text-green-600 flex items-center gap-1">
                                <Database className="w-3 h-3" /> Connected
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500">Support</p>
                            <p className="font-medium">support@sahakar.com</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
