import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET - Fetch all active categories
export async function GET() {
    try {
        const supabase = createServerClient();

        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('type', { ascending: true })
            .order('name', { ascending: true });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}
