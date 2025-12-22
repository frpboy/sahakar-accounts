import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const supabase = createAdminClient();

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
    } catch (error: any) {
        console.error('Error in GET /api/categories:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
