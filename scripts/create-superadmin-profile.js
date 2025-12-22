// Create superadmin profile using raw SQL query
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    line = line.trim().replace(/\r/g, '');
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        envVars[key] = value;
    }
});

// Service role key
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2ZHFvdHVodXd6b295c3JtdHJkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjEzMTY1NCwiZXhwIjoyMDgxNzA3NjU0fQ.WBcfhvchDl37AU3IR8cYyErrSALk6QPyx02otPDOghM';

const supabase = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    SERVICE_ROLE_KEY
);

async function createSuperadminProfile() {
    console.log('Finding superadmin auth user via SQL...');

    // Query auth.users table directly
    const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('id, email')
        .eq('email', 'frpboy12@gmail.com')
        .single();

    if (authError) {
        console.error('Error querying auth.users:', authError.message);
        console.log('\nTrying alternative method - creating profile with manual ID...');

        // Create a new auth user if it doesn't exist
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: 'frpboy12@gmail.com',
            password: 'Zabnix@2025',
            email_confirm: true,
        });

        if (createError) {
            // User might already exist, let's try to find it using RPC
            console.log('User creation failed (might already exist):', createError.message);
            console.log('\nPlease create the superadmin profile manually using the SQL Editor.');
            console.log('Run this SQL:');
            console.log(`
-- Create superadmin profile
INSERT INTO users (id, email, name, role, outlet_id)
SELECT id, 'frpboy12@gmail.com', 'K4NN4N', 'superadmin', NULL
FROM auth.users
WHERE email = 'frpboy12@gmail.com'
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, role = EXCLUDED.role;
      `);
            return;
        }

        console.log('Created new auth user with ID:', newUser.user.id);

        // Create profile for the new user
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .insert({
                id: newUser.user.id,
                email: 'frpboy12@gmail.com',
                name: 'K4NN4N',
                role: 'superadmin',
                outlet_id: null
            })
            .select()
            .single();

        if (profileError) {
            console.error('Error creating profile:', profileError);
            return;
        }

        console.log('Superadmin profile created successfully!');
        console.log(profile);
    } else {
        console.log('Found superadmin with ID:', authUsers.id);

        // Create or update profile
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .upsert({
                id: authUsers.id,
                email: 'frpboy12@gmail.com',
                name: 'K4NN4N',
                role: 'superadmin',
                outlet_id: null
            })
            .select()
            .single();

        if (profileError) {
            console.error('Error creating profile:', profileError);
            return;
        }

        console.log('Superadmin profile created successfully!');
        console.log(profile);
    }

    // Verify all users
    console.log('\n=== ALL USERS IN DATABASE ===');
    const { data: allUsers } = await supabase
        .from('users')
        .select(`
      email,
      name,
      role,
      outlets (name)
    `)
        .order('role');

    if (allUsers) {
        console.table(allUsers.map(u => ({
            Email: u.email,
            Name: u.name,
            Role: u.role,
            Outlet: u.outlets?.name || 'All outlets'
        })));
    }
}

createSuperadminProfile().catch(console.error);
