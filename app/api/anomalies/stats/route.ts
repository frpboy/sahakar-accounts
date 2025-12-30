export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-server';
import { format, subDays, startOfDay } from 'date-fns';

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
}

export async function GET(request: NextRequest) {
    try {
        const supabase = createRouteClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

        // Build base query
        let baseQuery = admin.from('anomalies').select('*', { count: 'exact' });

        // Apply outlet filter for non-superadmins
        if (user.role !== 'superadmin' && user.role !== 'master_admin') {
            if (user.outlet_id) {
                baseQuery = baseQuery.eq('outlet_id', user.outlet_id);
            }
        }

        // Get total counts by severity
        const { data: allAnomalies, error: allError, count: totalCount } = await baseQuery;

        if (allError) {
            return NextResponse.json({ error: allError.message }, { status: 500 });
        }

        // Calculate severity breakdown
        const severityCounts = {
            critical: allAnomalies?.filter(a => a.severity === 'critical').length || 0,
            warning: allAnomalies?.filter(a => a.severity === 'warning').length || 0,
            info: allAnomalies?.filter(a => a.severity === 'info').length || 0,
        };

        // Calculate resolution status
        const resolvedCount = allAnomalies?.filter(a => a.resolved_at !== null).length || 0;
        const unresolvedCount = (totalCount || 0) - resolvedCount;

        // Get type breakdown
        const typeCounts: Record<string, number> = {};
        allAnomalies?.forEach(anomaly => {
            typeCounts[anomaly.type] = (typeCounts[anomaly.type] || 0) + 1;
        });

        // Get outlet breakdown (for superadmins)
        const outletCounts: Record<string, number> = {};
        if (user.role === 'superadmin' || user.role === 'master_admin') {
            const { data: outletAnomalies } = await admin
                .from('anomalies')
                .select('outlet_id, outlets(name)')
                .not('outlet_id', 'is', null);

            outletAnomalies?.forEach(anomaly => {
                const outletName = (anomaly as any).outlets?.name || 'Unknown';
                outletCounts[outletName] = (outletCounts[outletName] || 0) + 1;
            });
        }

        // Get 7-day trend
        const trend = [];
        for (let i = 6; i >= 0; i--) {
            const date = startOfDay(subDays(new Date(), i));
            const nextDate = startOfDay(subDays(new Date(), i - 1));
            
            const dayCount = allAnomalies?.filter(anomaly => {
                const detectedAt = new Date(anomaly.detected_at);
                return detectedAt >= date && detectedAt < nextDate;
            }).length || 0;

            trend.push({
                date: format(date, 'yyyy-MM-dd'),
                count: dayCount
            });
        }

        // Get recent critical anomalies
        const { data: recentCritical } = await admin
            .from('anomalies')
            .select('*')
            .eq('severity', 'critical')
            .order('detected_at', { ascending: false })
            .limit(5);

        // Get resolution rate by severity
        const resolutionRates = {
            critical: {
                total: allAnomalies?.filter(a => a.severity === 'critical').length || 0,
                resolved: allAnomalies?.filter(a => a.severity === 'critical' && a.resolved_at !== null).length || 0,
                rate: 0
            },
            warning: {
                total: allAnomalies?.filter(a => a.severity === 'warning').length || 0,
                resolved: allAnomalies?.filter(a => a.severity === 'warning' && a.resolved_at !== null).length || 0,
                rate: 0
            },
            info: {
                total: allAnomalies?.filter(a => a.severity === 'info').length || 0,
                resolved: allAnomalies?.filter(a => a.severity === 'info' && a.resolved_at !== null).length || 0,
                rate: 0
            }
        };

        // Calculate rates
        Object.keys(resolutionRates).forEach(severity => {
            const rate = resolutionRates[severity as keyof typeof resolutionRates];
            if (rate.total > 0) {
                rate.rate = Math.round((rate.resolved / rate.total) * 100);
            }
        });

        // Decision cues
        const { data: topUnresolved } = await admin
            .from('anomalies')
            .select('*')
            .is('resolved_at', null)
            .order('severity', { ascending: true })
            .order('detected_at', { ascending: false })
            .limit(5);

        const { data: oldestUnresolved } = await admin
            .from('anomalies')
            .select('*')
            .is('resolved_at', null)
            .order('detected_at', { ascending: true })
            .limit(1);

        const cutoffIso = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        const { data: criticalOlderThan48h } = await admin
            .from('anomalies')
            .select('*')
            .eq('severity', 'critical')
            .is('resolved_at', null)
            .lt('detected_at', cutoffIso)
            .order('detected_at', { ascending: true });

        return NextResponse.json({
            total: totalCount || 0,
            ...severityCounts,
            resolved: resolvedCount,
            unresolved: unresolvedCount,
            by_type: typeCounts,
            by_outlet: outletCounts,
            trend,
            recent_critical: recentCritical || [],
            resolution_rates: resolutionRates,
            generated_at: new Date().toISOString(),
            decision_cues: {
                top_unresolved: topUnresolved || [],
                oldest_unresolved: (oldestUnresolved && oldestUnresolved[0]) || null,
                critical_older_than_48h: criticalOlderThan48h || []
            }
        });

    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
