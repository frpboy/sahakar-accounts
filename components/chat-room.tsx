'use client';

import { useEffect, useState } from 'react';
import { useRealtimeTransactions } from '@/hooks/use-realtime';

export function ChatRoom({ outletId }: { outletId: string | null }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!outletId) return;
    (async () => {
      const res = await fetch(`/api/chat/outlet?outletId=${outletId}`);
      if (res.ok) setMessages(await res.json());
    })();
  }, [outletId]);

  const refresh = async () => {
    if (!outletId) return;
    const res = await fetch(`/api/chat/outlet?outletId=${outletId}`);
    if (res.ok) setMessages(await res.json());
  };

  // Reuse a realtime hook by listening to any outlet changes via chats table (simple refresh strategy)
  // In production, add a dedicated useRealtimeChats with table filter
  const { status } = useRealtimeTransactions(null as any, () => refresh());

  return (
    <div className="bg-white rounded-lg border p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900">Outlet Chat</h3>
        <span className="text-xs text-gray-600">Live: {status}</span>
      </div>
      <div className="h-40 overflow-y-auto border rounded p-2 bg-gray-50">
        {messages.map((m) => (
          <div key={m.id} className="text-xs text-gray-800 mb-1">
            <span className="font-semibold">{m.role || 'user'}</span>: {m.content}
            <span className="text-gray-500 ml-2">{new Date(m.created_at).toLocaleString('en-IN')}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 px-2 py-1 border rounded" placeholder="Type a message" />
        <button
          onClick={async () => {
            if (!input.trim()) return;
            const res = await fetch('/api/chat/outlet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: input.trim() }) });
            if (res.ok) {
              setInput('');
              refresh();
            }
          }}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >Send</button>
      </div>
    </div>
  );
}

