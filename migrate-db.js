import pg from 'pg';
import { readFileSync } from 'fs';

const { Client } = pg;

// Read credentials
const supabaseUrl = readFileSync('supabaseurl.txt', 'utf8').trim();
const serviceRoleKey = readFileSync('pub.secretkey.txt', 'utf8').trim();

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)[1];

// Construct connection string (using Supabase pooler)
const connectionString = `postgresql://postgres.${projectRef}:${serviceRoleKey}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

console.log('Connecting to PostgreSQL...');
console.log('Project:', projectRef);

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✓ Connected to database\n');

    // Read the SQL schema
    const schema = readFileSync('supabase-schema.sql', 'utf8');

    console.log('Running migration...\n');

    // Execute the entire schema
    await client.query(schema);

    console.log('✅ Migration completed successfully!\n');

    // Verify tables
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('tasks', 'task_remarks', 'team_members', 'equipment')
      ORDER BY table_name
    `);

    console.log('✓ Tables created:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));

    // Check data
    const teamCount = await client.query('SELECT COUNT(*) FROM team_members');
    const equipCount = await client.query('SELECT COUNT(*) FROM equipment');

    console.log('\n✓ Default data inserted:');
    console.log(`  - ${teamCount.rows[0].count} team members`);
    console.log(`  - ${equipCount.rows[0].count} equipment items`);

  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error.message);
    if (error.code) console.error('Error code:', error.code);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
