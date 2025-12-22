// Script to create Supabase Auth users programmatically
// Run this script using: node scripts/create-users.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    line = line.trim().replace(/\r/g, ''); // Remove carriage returns
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        envVars[key] = value;
    }
});

// Service role key from Vercel (we configured this earlier)
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZHFvdHVodXd6b295c3JtdHJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEzMTY1NCwiZXhwIjoyMDgxNzA3NjU0fQ.WBcfhvchDl37AU3IR8cYyErrSALk6QPyx02otPDOghM';

// Debug: print environment variables
console.log('Environment variables loaded:');
console.log('  NEXT_PUBLIC_SUPABASE_URL:', envVars.NEXT_PUBLIC_SUPABASE_URL);
console.log('  Has service role key:', !!SERVICE_ROLE_KEY);
console.log('');

const supabase = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    SERVICE_ROLE_KEY
);

const users = [
    {
        email: 'frpboy12@gmail.com',
        password: 'Zabnix@2025',
        name: 'K4NN4N',
        role: 'superadmin',
        outlet_id: null
    },
    {
        email: 'paymentstarlexpmna@gmail.com',
        password: 'Zabnix@2025',
        name: 'HO Accountant',
        role: 'ho_accountant',
        outlet_id: null
    },
    {
        email: 'manager.test@sahakar.com',
        password: 'Zabnix@2025',
        name: 'Test Manager',
        role: 'outlet_manager',
        outlet_id: 'NEEDS_MAIN_OUTLET_ID'
    },
    {
        email: 'staff.test@sahakar.com',
        password: 'Zabnix@2025',
        name: 'Test Staff',
        role: 'outlet_staff',
        outlet_id: 'NEEDS_MAIN_OUTLET_ID'
    }
];

async function createUsers() {
    console.log('Starting user creation...\n');

    // First, get the Main Outlet ID
    const { data: outlets, error: outletError } = await supabase
        .from('outlets')
        .select('id, name')
        .eq('name', 'Main Outlet')
        .single();

    if (outletError || !outlets) {
        console.error('Error fetching Main Outlet:', outletError);
        return;
    }

    console.log('Found Main Outlet:', outlets.id);
    const mainOutletId = outlets.id;

    // Update outlet IDs for manager and staff
    users[2].outlet_id = mainOutletId;
    users[3].outlet_id = mainOutletId;

    // Create each user
    for (const user of users) {
        console.log(`\nCreating user: ${user.email}`);

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true,
        });

        if (authError) {
            console.error(`Error creating auth user ${user.email}:`, authError.message);
            continue;
        }

        console.log(`Auth user created with ID: ${authData.user.id}`);

        // Insert user profile
        const { data: profileData, error: profileError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                outlet_id: user.outlet_id
            })
            .select()
            .single();

        if (profileError) {
            console.error(`Error creating user profile ${user.email}:`, profileError.message);
            continue;
        }

        console.log(`User profile created:`, {
            email: profileData.email,
            name: profileData.name,
            role: profileData.role,
            outlet: user.outlet_id ? 'Main Outlet' : 'All outlets'
        });
    }

    console.log('\nUser creation complete!\n');

    // Verify all users
    console.log('Verifying created users...\n');
    const { data: allUsers, error: verifyError } = await supabase
        .from('users')
        .select(`
      id,
      email,
      name,
      role,
      outlets (name)
    `)
        .order('role', { ascending: true });

    if (verifyError) {
        console.error('Error verifying users:', verifyError);
        return;
    }

    console.table(allUsers.map(u => ({
        Email: u.email,
        Name: u.name,
        Role: u.role,
        Outlet: u.outlets?.name || 'All outlets'
    })));
}

createUsers().catch(console.error);
