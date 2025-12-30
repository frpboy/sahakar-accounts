'use client';

import { useState } from 'react';
import { X, Save, Building2 } from 'lucide-react';

export function AssignOutletModal({
  isOpen,
  user,
  outlets,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  user: { id: string; name?: string | null; email: string } | null;
  outlets: Array<{ id: string; name: string; code: string }>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [msg, setMsg] = useState('');

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Assign Outlet to {user.name || user.email}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Outlet</label>
            <select
              value={selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select outlet…</option>
              {outlets.map(o => (
                <option key={o.id} value={o.id}>{o.code} — {o.name}</option>
              ))}
            </select>
          </div>

          {msg && (
            <p className="text-sm text-gray-700">{msg}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedOutlet}
              onClick={async () => {
                setMsg('');
                try {
                  const res = await fetch(`/api/users/${user.id}/assign-outlet`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ outlet_id: selectedOutlet }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data?.error || `Failed (${res.status})`);
                  onSuccess();
                  onClose();
                } catch (e) {
                  setMsg((e as Error).message);
                }
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
