import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = readFileSync('supabaseurl.txt', 'utf8').trim();
const serviceKey = readFileSync('pub.secretkey.txt', 'utf8').trim();

console.log('Using service role key for admin access...\n');

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDatabase() {
  console.log('Checking database tables with admin privileges...\n');

  try {
    // Check tasks table
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(5);

    if (tasksError) {
      console.log('❌ Tasks table:', tasksError.message);
    } else {
      console.log(`✅ Tasks table exists (${tasks.length} records)`);
    }

    // Check team_members table
    const { data: team, error: teamError } = await supabase
      .from('team_members')
      .select('*');

    if (teamError) {
      console.log('❌ Team members table:', teamError.message);
    } else {
      console.log(`✅ Team members table exists (${team.length} members)`);
      if (team.length > 0) {
        console.log('   Default members:');
        team.forEach(m => console.log(`   - ${m.name}`));
      }
    }

    // Check equipment table
    const { data: equip, error: equipError } = await supabase
      .from('equipment')
      .select('*');

    if (equipError) {
      console.log('❌ Equipment table:', equipError.message);
    } else {
      console.log(`✅ Equipment table exists (${equip.length} items)`);
      if (equip.length > 0 && equip.length <= 5) {
        console.log('   Sample equipment:');
        equip.forEach(e => console.log(`   - ${e.name}`));
      }
    }

    // Check task_remarks table
    const { data: remarks, error: remarksError } = await supabase
      .from('task_remarks')
      .select('*')
      .limit(5);

    if (remarksError) {
      console.log('❌ Task remarks table:', remarksError.message);
    } else {
      console.log(`✅ Task remarks table exists (${remarks.length} records)`);
    }

    console.log('\n✅ Database verification complete!');
    console.log('\nIf all tables show ✅, your database is set up correctly!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabase();
