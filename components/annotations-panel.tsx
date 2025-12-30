'use client';

import { useEffect, useState } from 'react';
import { useRealtimeAnnotations } from '@/hooks/use-realtime';

export function AnnotationsPanel({ outletId, pageKey }: { outletId: string | null; pageKey: string }) {
  const [notes, setNotes] = useState<any[]>([]);
  const [text, setText] = useState('');

  const refresh = async () => {
    if (!outletId) return;
    const res = await fetch(`/api/annotations?outletId=${outletId}&pageKey=${pageKey}`);
    if (res.ok) setNotes(await res.json());
  };

  useEffect(() => { refresh(); }, [outletId, pageKey]);
  const { status } = useRealtimeAnnotations(outletId, pageKey, () => refresh());

  return (
    <div className="bg-white rounded-lg border p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900">Annotations</h3>
        <span className="text-xs text-gray-600">Live: {status}</span>
      </div>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {notes.map((n) => (
          <div key={n.id} className="text-xs text-gray-800">
            <span className="text-gray-500 mr-2">{new Date(n.created_at).toLocaleString('en-IN')}</span>
            {n.text}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 px-2 py-1 border rounded" placeholder="Add an annotation" />
        <button
          onClick={async () => {
            if (!text.trim()) return;
            const res = await fetch('/api/annotations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, pageKey }) });
            if (res.ok) {
              setText('');
              refresh();
            }
          }}
          className="px-3 py-1 bg-purple-600 text-white rounded"
        >Add</button>
      </div>
    </div>
  );
}

