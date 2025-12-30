'use client';

import { useEffect } from 'react';

export function PageAuditLogger({ path }: { path: string }) {
  useEffect(() => {
    (async () => {
      try {
        await fetch('/api/audit/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'view_page', entity: 'page', entity_id: path }),
        });
      } catch {}
    })();
  }, [path]);
  return null;
}
