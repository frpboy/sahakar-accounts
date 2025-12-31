export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-server';
import { format } from 'date-fns';

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

// GET endpoint - fetch export history
export async function GET(request: NextRequest) {
    try {
        const supabase = createRouteClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '10');

        // Get user role
        const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const allowedRoles = ['superadmin', 'master_admin', 'ho_accountant', 'auditor'];
        if (!allowedRoles.includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const admin = createAdminClient();
        const { data, error } = await admin
            .from('export_logs')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ exports: data || [] });

    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}

// POST endpoint - create new export
export async function POST(request: NextRequest) {
    try {
        const supabase = createRouteClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { format: selectedFormat, filters = {} } = body;

        // Validate format
        const validFormats = ['csv', 'json', 'pdf'];
        if (!validFormats.includes(selectedFormat)) {
            return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
        }

        // Get user role and outlet
        const { data: user } = await supabase
            .from('users')
            .select('role, outlet_id')
            .eq('id', session.user.id)
            .single();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const allowedRoles = ['superadmin', 'master_admin', 'ho_accountant', 'auditor'];
        if (!allowedRoles.includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const admin = createAdminClient();

        // Create export log entry
        const { data: exportLog, error: exportError } = await admin
            .from('export_logs')
            .insert({
                user_id: session.user.id,
                export_type: selectedFormat,
                report_type: 'anomalies',
                filters,
                status: 'processing'
            })
            .select()
            .single();

        if (exportError) {
            return NextResponse.json({ error: exportError.message }, { status: 500 });
        }

        // Start async export process
        setTimeout(async () => {
            try {
                await processExport(exportLog.id, selectedFormat, filters, user, admin);
            } catch (error) {
                console.error('Export processing failed:', error);
                await admin
                    .from('export_logs')
                    .update({
                        status: 'failed',
                        error_message: getErrorMessage(error),
                        completed_at: new Date().toISOString()
                    })
                    .eq('id', exportLog.id);
            }
        }, 100);

        return NextResponse.json({ export_id: exportLog.id, status: 'processing' });

    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}

async function processExport(exportId: string, selectedFormat: string, filters: any, user: any, admin: any) {
    // Update status to processing
    await admin
        .from('export_logs')
        .update({ status: 'processing' })
        .eq('id', exportId);

    // Build query based on filters
    let query = admin
        .from('anomalies')
        .select(`
            *,
            outlets(name),
            users(email)
        `);

    // Apply outlet filter for non-superadmins
    if (user.role !== 'superadmin' && user.role !== 'master_admin') {
        if (user.outlet_id) {
            query = query.eq('outlet_id', user.outlet_id);
        }
    }

    // Apply date range filter
    const now = new Date();
    let startDate: Date;
    
    switch (filters.date_range) {
        case '1d':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
        case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case '1y':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    query = query.gte('detected_at', startDate.toISOString());

    // Apply severity filter
    if (filters.severity && filters.severity !== 'all') {
        query = query.eq('severity', filters.severity);
    }

    // Apply outlet filter
    if (filters.outlet_id && (user.role === 'superadmin' || user.role === 'master_admin')) {
        query = query.eq('outlet_id', filters.outlet_id);
    }

    // Order by most recent
    query = query.order('detected_at', { ascending: false });

    const { data: anomalies, error } = await query;

    if (error) {
        throw new Error(`Failed to fetch anomalies: ${error.message}`);
    }

    // Generate export data based on format
    let exportData: string | Buffer;
    let fileName: string;
    let contentType: string;

    switch (selectedFormat) {
        case 'csv':
            exportData = generateCSV(anomalies);
            fileName = `anomalies_${format(new Date(), 'yyyy-MM-dd')}.csv`;
            contentType = 'text/csv';
            break;
        case 'json':
            exportData = JSON.stringify(anomalies, null, 2);
            fileName = `anomalies_${format(new Date(), 'yyyy-MM-dd')}.json`;
            contentType = 'application/json';
            break;
        case 'pdf':
            exportData = await generatePDF(anomalies);
            fileName = `anomalies_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
            contentType = 'application/pdf';
            break;
        default:
            throw new Error('Unsupported format');
    }

    // Store file (in production, you'd use cloud storage like S3)
    const fileSize = Buffer.byteLength(exportData);
    
    // For demo purposes, we'll store the data in the database
    // In production, upload to cloud storage and store the URL
    const { error: updateError } = await admin
        .from('export_logs')
        .update({
            status: 'completed',
            record_count: anomalies.length,
            file_size_bytes: fileSize,
            completed_at: new Date().toISOString()
        })
        .eq('id', exportId);

    if (updateError) {
        throw new Error(`Failed to update export log: ${updateError.message}`);
    }

    // Log the export
    await admin.from('audit_logs').insert({
        user_id: user.id,
        action: 'export_anomalies',
        entity: 'export_logs',
        entity_id: exportId,
        severity: 'normal',
        reason: `Exported ${anomalies.length} anomalies in ${selectedFormat.toUpperCase()} format`
    });
}

function generateCSV(anomalies: any[]): string {
    const headers = ['ID', 'Title', 'Description', 'Severity', 'Type', 'Outlet', 'Detected At', 'Resolved At', 'Resolution Notes'];
    const rows = anomalies.map(anomaly => [
        anomaly.id,
        `"${anomaly.title.replace(/"/g, '""')}"`,
        `"${(anomaly.description || '').replace(/"/g, '""')}"`,
        anomaly.severity,
        anomaly.type,
        anomaly.outlets?.name || 'Unknown',
        format(new Date(anomaly.detected_at), 'yyyy-MM-dd HH:mm:ss'),
        anomaly.resolved_at ? format(new Date(anomaly.resolved_at), 'yyyy-MM-dd HH:mm:ss') : '',
        `"${(anomaly.resolution_notes || '').replace(/"/g, '""')}"`
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

async function generatePDF(anomalies: any[]): Promise<Buffer> {
    // For demo purposes, return a simple text-based PDF content
    // In production, use a proper PDF library like PDFKit or Puppeteer
    const pdfContent = `
ANOMALY REPORT
Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
Total Anomalies: ${anomalies.length}

${anomalies.map(anomaly => `
ID: ${anomaly.id}
Title: ${anomaly.title}
Severity: ${anomaly.severity.toUpperCase()}
Type: ${anomaly.type.replace('_', ' ').toUpperCase()}
Outlet: ${anomaly.outlets?.name || 'Unknown'}
Detected: ${format(new Date(anomaly.detected_at), 'yyyy-MM-dd HH:mm:ss')}
${anomaly.description ? `Description: ${anomaly.description}` : ''}
${anomaly.resolved_at ? `Resolved: ${format(new Date(anomaly.resolved_at), 'yyyy-MM-dd HH:mm:ss')}` : 'Status: Unresolved'}
${anomaly.resolution_notes ? `Resolution: ${anomaly.resolution_notes}` : ''}
---
`).join('')}
    `.trim();

    return Buffer.from(pdfContent);
}
