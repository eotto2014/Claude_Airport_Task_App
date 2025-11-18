import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = readFileSync('supabaseurl.txt', 'utf8').trim();
const anonKey = readFileSync('pub.key.txt', 'utf8').trim();

console.log('Testing Supabase connection...\n');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', anonKey.substring(0, 20) + '...\n');

const supabase = createClient(supabaseUrl, anonKey);

async function verifyConnection() {
  try {
    // Try to make ANY query to see if connection works
    const { data, error } = await supabase
      .from('_anything_')
      .select('*')
      .limit(1);

    if (error) {
      console.log('API Response Error:', error.message);
      console.log('Error Code:', error.code);
      console.log('Error Details:', error.details || 'none');

      if (error.message.includes('schema cache')) {
        console.log('\n⚠️  The API keys seem to work, but tables are not in the schema cache.');
        console.log('This might mean:');
        console.log('1. Tables were created but the API cache needs to refresh (wait 1-2 minutes)');
        console.log('2. Tables are in a different schema (not public)');
        console.log('3. API key doesn\'t have the right project URL');
      } else if (error.message.includes('JWT') || error.message.includes('Invalid')) {
        console.log('\n❌ API key appears to be invalid for this project');
      }
    }
  } catch (error) {
    console.error('Connection Error:', error.message);
  }
}

verifyConnection();
