'use client';

import { useEffect, useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-client';

type Status = 'offline' | 'connecting' | 'online' | 'error';

export function useRealtimeUsers(onChange: () => void) {
  const [status, setStatus] = useState<Status>('connecting');
  const channelRef = useRef<ReturnType<typeof supabaseBrowser.channel> | null>(null);
  useEffect(() => {
    const ch = supabaseBrowser
      .channel('rt-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => onChange())
      .subscribe((s) => {
        setStatus(s === 'SUBSCRIBED' ? 'online' : s === 'CHANNEL_ERROR' ? 'error' : 'connecting');
      });
    channelRef.current = ch;
    return () => { if (channelRef.current) supabaseBrowser.removeChannel(channelRef.current); };
  }, [onChange]);
  return { status };
}

export function useRealtimeOutlets(onChange: () => void) {
  const [status, setStatus] = useState<Status>('connecting');
  const channelRef = useRef<ReturnType<typeof supabaseBrowser.channel> | null>(null);
  useEffect(() => {
    const ch = supabaseBrowser
      .channel('rt-outlets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'outlets' }, () => onChange())
      .subscribe((s) => {
        setStatus(s === 'SUBSCRIBED' ? 'online' : s === 'CHANNEL_ERROR' ? 'error' : 'connecting');
      });
    channelRef.current = ch;
    return () => { if (channelRef.current) supabaseBrowser.removeChannel(channelRef.current); };
  }, [onChange]);
  return { status };
}

export function useRealtimeApprovals(onChange: () => void) {
  const [status, setStatus] = useState<Status>('connecting');
  const channelRef = useRef<ReturnType<typeof supabaseBrowser.channel> | null>(null);
  useEffect(() => {
    const ch = supabaseBrowser
      .channel('rt-approvals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'role_approvals' }, () => onChange())
      .subscribe((s) => {
        setStatus(s === 'SUBSCRIBED' ? 'online' : s === 'CHANNEL_ERROR' ? 'error' : 'connecting');
      });
    channelRef.current = ch;
    return () => { if (channelRef.current) supabaseBrowser.removeChannel(channelRef.current); };
  }, [onChange]);
  return { status };
}

export function useRealtimeDailyRecords(outletId: string | null, onChange: () => void) {
  const [status, setStatus] = useState<Status>('connecting');
  const channelRef = useRef<ReturnType<typeof supabaseBrowser.channel> | null>(null);
  useEffect(() => {
    if (!outletId) return;
    const ch = supabaseBrowser
      .channel(`rt-daily-${outletId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_records', filter: `outlet_id=eq.${outletId}` }, () => onChange())
      .subscribe((s) => {
        setStatus(s === 'SUBSCRIBED' ? 'online' : s === 'CHANNEL_ERROR' ? 'error' : 'connecting');
      });
    channelRef.current = ch;
    return () => { if (channelRef.current) supabaseBrowser.removeChannel(channelRef.current); };
  }, [outletId, onChange]);
  return { status };
}

export function useRealtimeTransactions(dailyRecordId: string | null, onChange: () => void) {
  const [status, setStatus] = useState<Status>('connecting');
  const channelRef = useRef<ReturnType<typeof supabaseBrowser.channel> | null>(null);
  useEffect(() => {
    if (!dailyRecordId) return;
    const ch = supabaseBrowser
      .channel(`rt-trans-${dailyRecordId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `daily_record_id=eq.${dailyRecordId}` }, () => onChange())
      .subscribe((s) => {
        setStatus(s === 'SUBSCRIBED' ? 'online' : s === 'CHANNEL_ERROR' ? 'error' : 'connecting');
      });
    channelRef.current = ch;
    return () => { if (channelRef.current) supabaseBrowser.removeChannel(channelRef.current); };
  }, [dailyRecordId, onChange]);
  return { status };
}

export function usePresence(room: string) {
  const [members, setMembers] = useState<any[]>([]);
  const channelRef = useRef<ReturnType<typeof supabaseBrowser.channel> | null>(null);
  useEffect(() => {
    const ch = supabaseBrowser.channel(`presence:${room}`, { config: { presence: { key: room } } });
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState();
      const flattened = Object.values(state).flat();
      setMembers(flattened as any[]);
    });
    ch.subscribe();
    ch.track({ online: true });
    channelRef.current = ch;
    return () => { if (channelRef.current) supabaseBrowser.removeChannel(channelRef.current); };
  }, [room]);
  return { members };
}

