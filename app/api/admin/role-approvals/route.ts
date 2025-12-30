export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createRouteClient } from '@/lib/supabase-server';

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

export async function POST(request: NextRequest) {
    try {
        const sessionClient = createRouteClient();
        const { data: { session } } = await sessionClient.auth.getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const admin = createAdminClient();
        const body = await request.json() as { approvalId?: string; approve?: boolean };
        const approvalId = body.approvalId;
        const approve = body.approve !== false; // default approve

        if (!approvalId) return NextResponse.json({ error: 'approvalId required' }, { status: 400 });

        // Load approval
        const { data: approval, error: loadErr } = await (admin as any)
            .from('role_approvals')
            .select('*')
            .eq('id', approvalId)
            .single();
        if (loadErr || !approval) return NextResponse.json({ error: loadErr?.message || 'Not found' }, { status: 404 });

        // Approver must be admin and different from requester
        const { data: approver } = await sessionClient
            .from('users')
            .select('id,role')
            .eq('id', session.user.id)
            .single();

        const role = (approver as any)?.role || (session.user as any).user_metadata?.role;
        if (!['superadmin', 'master_admin'].includes(role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        if (approval.requested_by === session.user.id) {
            return NextResponse.json({ error: 'Requester cannot approve own request' }, { status: 403 });
        }
        if (approval.status !== 'pending') {
            return NextResponse.json({ error: 'Approval already processed' }, { status: 400 });
        }

        if (!approve) {
            await (admin as any)
                .from('role_approvals')
                .update({ status: 'rejected', approved_by: session.user.id, approved_at: new Date().toISOString() })
                .eq('id', approvalId);

            // Audit reject
            const { data: targetUser } = await admin
                .from('users')
                .select('id,email')
                .eq('id', approval.target_user_id)
                .single();
            await admin
                .from('audit_logs')
                .insert({
                    user_id: session.user.id,
                    action: 'reject_superadmin',
                    entity: 'users',
                    entity_id: approval.target_user_id,
                    old_data: { role: approval.old_role },
                    new_data: { role: approval.old_role },
                    severity: 'warning',
                    reason: approval.reason || null,
                } as any);

            return NextResponse.json({ status: 'rejected' });
        }

        // Approve: set role on target user
        const { error: updErr } = await admin
            .from('users')
            .update({ role: 'superadmin' } as any)
            .eq('id', approval.target_user_id);
        if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

        await (admin as any)
            .from('role_approvals')
            .update({ status: 'approved', approved_by: session.user.id, approved_at: new Date().toISOString() })
            .eq('id', approvalId);

        // Audit approve
        const { data: targetUser } = await admin
            .from('users')
            .select('id,email')
            .eq('id', approval.target_user_id)
            .single();
        await admin
            .from('audit_logs')
            .insert({
                user_id: session.user.id,
                action: 'approve_superadmin',
                entity: 'users',
                entity_id: approval.target_user_id,
                old_data: { role: approval.old_role },
                new_data: { role: 'superadmin' },
                severity: 'warning',
                reason: approval.reason || null,
            } as any);

        return NextResponse.json({ status: 'approved' });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const sessionClient = createRouteClient();
        const { data: { session } } = await sessionClient.auth.getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: approver } = await sessionClient
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
        const role = (approver as any)?.role || (session.user as any).user_metadata?.role;
        if (!['superadmin', 'master_admin'].includes(role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const admin = createAdminClient();
        const { data, error } = await (admin as any)
            .from('role_approvals')
            .select('*')
            .eq('status', 'pending')
            .order('requested_at', { ascending: false });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data || []);
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
