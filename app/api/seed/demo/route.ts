export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createRouteClient } from '@/lib/supabase-server';

type SeedResult = {
    outletsCreated: number;
    usersUpserted: number;
};

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

export async function POST(req: NextRequest) {
    try {
        const isDev = process.env.NODE_ENV === 'development';
        const devBypass = isDev && req.headers.get('x-seed-dev') === '1';

        let session: any = null;
        let role: string | undefined = undefined;

        if (!devBypass) {
            const sessionClient = createRouteClient();
            const { data } = await sessionClient.auth.getSession();
            session = data.session;
            if (!session) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            role = (session.user as any).user_metadata?.role as string | undefined;
            
            // Hardcoded bootstrap for superadmin if metadata is missing
            if (!role && session.user.email === 'frpboy12@gmail.com') {
                role = 'superadmin';
            }

            if (role !== 'superadmin') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        const admin = createAdminClient();

        // Ensure demo outlet exists
        const { data: existingOutlet } = await admin
            .from('outlets')
            .select('id,code')
            .eq('code', 'OUT-001')
            .single();

        let outletId = existingOutlet?.id as string | undefined;
        let outletsCreated = 0;
        const force = req.headers.get('x-seed-force') === '1';
        if (!outletId && !force) {
            const { data: newOutlet, error: outletErr } = await admin
                .from('outlets')
                .insert({
                    name: 'Main Outlet',
                    code: 'OUT-001',
                    location: 'HQ',
                    is_active: true,
                } as unknown as never)
                .select()
                .single();
            if (outletErr) {
                return NextResponse.json({ error: outletErr.message }, { status: 500 });
            }
            outletId = newOutlet.id as string;
            outletsCreated = 1;
        } else if (force) {
            // Recreate demo outlet
            if (outletId) {
                await admin.from('outlets').delete().eq('id', outletId);
            }
            const { data: newOutlet, error: outletErr } = await admin
                .from('outlets')
                .insert({
                    name: 'Main Outlet',
                    code: 'OUT-001',
                    location: 'HQ',
                    is_active: true,
                } as unknown as never)
                .select()
                .single();
            if (outletErr) {
                return NextResponse.json({ error: outletErr.message }, { status: 500 });
            }
            outletId = newOutlet.id as string;
            outletsCreated = 1;
        }

        const demos = [
            { email: 'frpboy12@gmail.com', name: 'K4NN4N', role: 'superadmin', outlet_id: null },
            { email: 'paymentstarlexpmna@gmail.com', name: 'HO Accountant', role: 'ho_accountant', outlet_id: null },
            { email: 'manager.test@sahakar.com', name: 'Outlet Manager', role: 'outlet_manager', outlet_id: outletId },
            { email: 'staff.test@sahakar.com', name: 'Outlet Staff', role: 'outlet_staff', outlet_id: outletId },
            { email: 'auditor.test@sahakar.com', name: 'Auditor', role: 'auditor', outlet_id: null },
        ] as const;

        // Build email → id map from existing auth users
        const { data: usersPage, error: listErr } = await admin.auth.admin.listUsers();
        if (listErr) {
            return NextResponse.json({ error: listErr.message }, { status: 500 });
        }

        const emailToId = new Map<string, string>();
        for (const u of usersPage.users ?? []) {
            if (u.email) {
                emailToId.set(u.email, u.id);
            }
        }

        let usersUpserted = 0;
        for (const d of demos) {
            let authId = emailToId.get(d.email);
            if (!authId) {
                const { data: created, error: createErr } = await admin.auth.admin.createUser({
                    email: d.email,
                    password: 'Zabnix@2025',
                    email_confirm: true,
                });
                if (createErr) {
                    return NextResponse.json({ error: createErr.message }, { status: 500 });
                }
                authId = created.user.id;
            }

            const { data: profileRow } = await admin
                .from('users')
                .select('id')
                .eq('id', authId)
                .single();

            if (!profileRow) {
                const { error: insertErr } = await admin
                    .from('users')
                    .insert({
                        id: authId,
                        email: d.email,
                        name: d.name,
                        role: d.role,
                        outlet_id: d.outlet_id,
                    } as unknown as never);
                if (insertErr) {
                    return NextResponse.json({ error: insertErr.message }, { status: 500 });
                }
                usersUpserted++;
            } else {
                // Ensure role and outlet assignment are correct for demo users
                const { error: updateErr } = await admin
                    .from('users')
                    .update({ role: d.role, outlet_id: d.outlet_id })
                    .eq('id', authId);
                if (updateErr) {
                    return NextResponse.json({ error: updateErr.message }, { status: 500 });
                }
            }
        }

        const result: SeedResult = { outletsCreated, usersUpserted };

        // Audit: seed_demo_data
        await admin
            .from('audit_logs')
            .insert({
                user_id: devBypass ? null : session.user.id,
                action: 'seed_demo_data',
                entity: 'system',
                entity_id: null,
                old_data: null,
                new_data: { outletsCreated, usersUpserted } as any,
                severity: 'normal',
            } as any);

        return NextResponse.json(result, { status: 201 });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
