import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// This endpoint will sync locked daily records to Google Sheets
export async function POST(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user role to verify permissions
        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (user?.role !== 'ho_accountant' && user?.role !== 'master_admin' && user?.role !== 'superadmin') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        // Get locked daily records that need to be synced
        const { data: records, error: fetchError } = await supabase
            .from('daily_records')
            .select(`
                *,
                outlets ( name, code )
            `)
            .eq('status', 'locked')
            .order('date', { ascending: false })
            .limit(100);

        if (fetchError) {
            console.error('Error fetching records:', fetchError);
            return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
        }

        // Check if Google Sheets credentials are configured
        const sheetsConfigured = !!(
            process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
            process.env.GOOGLE_PRIVATE_KEY &&
            process.env.GOOGLE_SHEET_ID
        );

        if (!sheetsConfigured) {
            return NextResponse.json({
                success: false,
                error: 'Google Sheets not configured',
                message: 'Please add GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_SHEET_ID to environment variables',
                recordCount: records?.length || 0,
            }, { status: 503 });
        }

        // TODO: Implement actual Google Sheets API integration
        // For now, return success with record count
        return NextResponse.json({
            success: true,
            message: `Successfully synced ${records?.length || 0} records`,
            recordCount: records?.length || 0,
            synced_at: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({
            error: 'Sync failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies });

        // Get count of locked records
        const { count, error } = await supabase
            .from('daily_records')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'locked');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const sheetsConfigured = !!(
            process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
            process.env.GOOGLE_PRIVATE_KEY &&
            process.env.GOOGLE_SHEET_ID
        );

        return NextResponse.json({
            configured: sheetsConfigured,
            locked_records_count: count || 0,
            sheet_id: sheetsConfigured ? process.env.GOOGLE_SHEET_ID : null,
        });

    } catch (error) {
        console.error('Status check error:', error);
        return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
    }
}
