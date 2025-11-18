import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = readFileSync('supabaseurl.txt', 'utf8').trim();
const anonKey = readFileSync('pub.key.txt', 'utf8').trim();

const supabase = createClient(supabaseUrl, anonKey);

async function checkDatabase() {
  console.log('Checking database tables...\n');

  try {
    // Check tasks table
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .limit(5);

    if (tasksError) {
      console.log('❌ Tasks table:', tasksError.message);
    } else {
      console.log(`✓ Tasks table exists (${tasks.length} sample records)`);
    }

    // Check team_members table
    const { data: team, error: teamError } = await supabase
      .from('team_members')
      .select('*');

    if (teamError) {
      console.log('❌ Team members table:', teamError.message);
    } else {
      console.log(`✓ Team members table exists (${team.length} members)`);
      team.forEach(m => console.log(`  - ${m.name}`));
    }

    // Check equipment table
    const { data: equip, error: equipError } = await supabase
      .from('equipment')
      .select('*');

    if (equipError) {
      console.log('❌ Equipment table:', equipError.message);
    } else {
      console.log(`✓ Equipment table exists (${equip.length} items)`);
      equip.forEach(e => console.log(`  - ${e.name}`));
    }

    // Check task_remarks table
    const { data: remarks, error: remarksError } = await supabase
      .from('task_remarks')
      .select('*')
      .limit(5);

    if (remarksError) {
      console.log('❌ Task remarks table:', remarksError.message);
    } else {
      console.log(`✓ Task remarks table exists (${remarks.length} sample records)`);
    }

    console.log('\n✅ Database check complete!');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDatabase();
