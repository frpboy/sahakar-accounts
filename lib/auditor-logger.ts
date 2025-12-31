import { createClientBrowser } from '@/lib/supabase-client';
import type { Database } from '@/lib/database.types';

/**
 * Log auditor actions for compliance tracking
 */
export async function logAuditorAction(
    action: Database['public']['Tables']['auditor_access_log']['Row']['action'],
    entity_type?: string,
    entity_id?: string,
    outlet_id?: string,
    metadata?: {
        ip_address?: string;
        user_agent?: string;
    }
) {
    try {
        const supabase = createClientBrowser();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        // Check if user is auditor
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        const typedUserData = userData as Pick<Database['public']['Tables']['users']['Row'], 'role'> | null;
        if (typedUserData?.role !== 'auditor') return;

        // Log the action
        const payload: Database['public']['Tables']['auditor_access_log']['Insert'] = {
            auditor_id: user.id,
            action,
            entity_type,
            entity_id,
            outlet_id,
            ip_address: metadata?.ip_address,
            user_agent: metadata?.user_agent
        };
        await supabase.from('auditor_access_log').insert(payload as unknown as never);
    } catch (error) {
        console.error('[AuditorLogger] Error logging action:', error);
        // Don't throw - logging failure shouldn't break the app
    }
}
