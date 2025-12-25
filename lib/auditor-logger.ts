import { createServerClient } from '@/lib/supabase-server';

/**
 * Log auditor actions for compliance tracking
 */
export async function logAuditorAction(
    action: string,
    entity_type?: string,
    entity_id?: string,
    outlet_id?: string,
    metadata?: {
        ip_address?: string;
        user_agent?: string;
    }
) {
    try {
        const supabase = createServerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        // Check if user is auditor
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (userData?.role !== 'auditor') return;

        // Log the action
        await supabase.from('auditor_access_log').insert({
            auditor_id: user.id,
            action,
            entity_type,
            entity_id,
            outlet_id,
            ip_address: metadata?.ip_address,
            user_agent: metadata?.user_agent
        });
    } catch (error) {
        console.error('[AuditorLogger] Error logging action:', error);
        // Don't throw - logging failure shouldn't break the app
    }
}
