export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase-server';
import { z } from 'zod';

const LogSchema = z.object({
    export_type: z.enum(['pdf', 'excel']),
    report_type: z.string(),
    file_hash: z.string().length(64),
    record_count: z.number().int().nonnegative(),
    filters: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const response = NextResponse.next();
        const supabase = createMiddlewareClient(request, response);
        let user = null as any;
        try {
            const r = await supabase.auth.getUser();
            user = r.data.user;
        } catch (err: any) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user role for the log
        const { data: userRole } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        const body = await request.json();
        const validation = LogSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const { export_type, report_type, file_hash, record_count, filters } = validation.data;

        const { data, error } = await (supabase as any)
            .from('export_logs')
            .insert({
                user_id: user.id,
                user_role: userRole?.role || 'unknown',
                export_type,
                report_type,
                file_hash,
                record_count,
                filters: filters || {},
                ip_address: request.headers.get('x-forwarded-for') || 'unknown',
                user_agent: request.headers.get('user-agent') || 'unknown'
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, id: data.id });

    } catch (error) {
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
}
