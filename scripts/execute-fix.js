const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixStaffOutlet() {
    try {
        // 1. Find Main Outlet
        const { data: outlets, error: outletError } = await supabase
            .from('outlets')
            .select('id, name')
            .ilike('name', '%Main Outlet%')
            .limit(1);

        if (outletError || !outlets.length) {
            console.error('Could not find Main Outlet:', outletError || 'Not found');
            // Let's list all outlets to see what we have
            const { data: allOutlets } = await supabase.from('outlets').select('id, name');
            console.log('Available outlets:', allOutlets);
            return;
        }

        const mainOutletId = outlets[0].id;
        console.log(`Found Main Outlet: ${outlets[0].name} (ID: ${mainOutletId})`);

        // 2. Find Staff User
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, email, name')
            .eq('email', 'staff.test@sahakar.com')
            .single();

        if (userError || !users) {
            console.error('Could not find staff user:', userError || 'Not found');
            return;
        }

        console.log(`Found Staff User: ${users.name} (ID: ${users.id})`);

        // 3. Update outlet_id
        const { data: updateData, error: updateError } = await supabase
            .from('users')
            .update({ outlet_id: mainOutletId })
            .eq('id', users.id);

        if (updateError) {
            console.error('Error updating user:', updateError);
            return;
        }

        console.log('✅ Successfully updated staff user outlet association!');

        // 4. Verify update
        const { data: verifiedUser } = await supabase
            .from('users')
            .select('id, email, outlet_id')
            .eq('id', users.id)
            .single();

        console.log('Verification:', verifiedUser);

    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

fixStaffOutlet();
