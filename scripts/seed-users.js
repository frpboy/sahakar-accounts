import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PASSWORD = 'Zabnix@2025';

async function seedUsers() {
  console.log('Fetching outlets...');
  const { data: outlets, error: outletsError } = await supabase
    .from('outlets')
    .select('id, name, code, type')
    .order('name');

  if (outletsError) {
    console.error('Error fetching outlets:', outletsError);
    return;
  }

  console.log(`Found ${outlets.length} outlets. Creating users...`);

  for (const outlet of outlets) {
    // Generate emails based on outlet code
    // e.g., HP-TIRUR -> staff.hp.tirur@sahakar.com
    const cleanCode = outlet.code.toLowerCase().replace(/-/g, '.');
    const staffEmail = `staff.${cleanCode}@sahakar.com`;
    const managerEmail = `manager.${cleanCode}@sahakar.com`;

    // Create Staff
    await createUser(staffEmail, PASSWORD, 'outlet_staff', outlet.id, `${outlet.name} Staff`);
    
    // Create Manager
    await createUser(managerEmail, PASSWORD, 'outlet_manager', outlet.id, `${outlet.name} Manager`);
  }

  console.log('User seeding completed.');
}

async function createUser(email, password, role, outletId, name) {
  try {
    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (authError) {
      console.log(`Skipping ${email}: ${authError.message}`);
      // If user exists, we might want to update their outlet_id in public.users just in case
      // But for now, we assume fresh start or manual handling if exists
      return;
    }

    const userId = authData.user.id;
    console.log(`Created Auth User: ${email} (${userId})`);

    // 2. Create/Update Public Profile
    // Note: The trigger usually handles creation, but we need to set the role and outlet_id
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email,
        role,
        outlet_id: outletId,
        name
      });

    if (profileError) {
      console.error(`Error updating profile for ${email}:`, profileError);
    } else {
      console.log(`Linked ${role} profile for ${email} to outlet ${outletId}`);
    }

  } catch (e) {
    console.error(`Unexpected error for ${email}:`, e);
  }
}

seedUsers();
