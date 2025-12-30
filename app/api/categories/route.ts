export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/database.types';

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

export async function GET() {
    try {
        const supabase = createRouteClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('type, name');

        if (error) {
            console.error('Error fetching categories:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: unknown) {
        console.error('Error in GET /api/categories:', { message: getErrorMessage(error) });
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
