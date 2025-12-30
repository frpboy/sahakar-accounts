'use client';

import { useAuth } from '@/lib/auth-context';
import { usePresence } from '@/hooks/use-realtime';

export function PresenceIndicator({ outletId }: { outletId: string | null }) {
  const { user } = useAuth();
  const room = outletId ? `outlet:${outletId}` : 'global';
  const { members } = usePresence(room);
  return (
    <div className="flex items-center gap-2 text-xs text-gray-600">
      <span className="px-2 py-1 rounded-full bg-gray-100">Online: {members.length}</span>
      <div className="flex flex-wrap gap-1">
        {members.slice(0, 6).map((m: any, i: number) => (
          <span key={i} className="px-2 py-1 rounded bg-blue-50 text-blue-800">
            {m.name || m.email || 'User'} • {m.role || ''}
          </span>
        ))}
      </div>
    </div>
  );
}

