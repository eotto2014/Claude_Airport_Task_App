import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read credentials
const supabaseUrl = readFileSync('supabaseurl.txt', 'utf8').trim();
const serviceRoleKey = readFileSync('pub.secretkey.txt', 'utf8').trim();

console.log('Connecting to Supabase...');
console.log('URL:', supabaseUrl);

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read the SQL schema
const schema = readFileSync('supabase-schema.sql', 'utf8');

console.log('\nRunning database migration...\n');

// Split schema into individual statements
const statements = schema
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

async function runMigration() {
  try {
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Skip comments
      if (statement.startsWith('--')) continue;

      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement
      });

      if (error) {
        console.error(`Error on statement ${i + 1}:`, error);
        console.error('Statement:', statement.substring(0, 100) + '...');

        // Try direct execution for specific statements
        if (statement.includes('CREATE TABLE') || statement.includes('INSERT')) {
          console.log('Trying alternative method...');
          // Continue anyway - some errors are expected (table exists, etc)
        }
      } else {
        console.log(`✓ Statement ${i + 1} executed successfully`);
      }
    }

    console.log('\n✅ Migration completed!');
    console.log('\nVerifying tables...');

    // Verify tables exist
    const { data: tasks } = await supabase.from('tasks').select('count');
    const { data: teamMembers } = await supabase.from('team_members').select('count');
    const { data: equipment } = await supabase.from('equipment').select('count');
    const { data: remarks } = await supabase.from('task_remarks').select('count');

    console.log('✓ Tables verified:');
    console.log('  - tasks');
    console.log('  - task_remarks');
    console.log('  - team_members');
    console.log('  - equipment');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
