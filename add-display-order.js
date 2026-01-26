import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addDisplayOrderColumn() {
  console.log('Adding display_order column to tasks table...');

  // Add display_order column with default value
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql: `
      -- Add display_order column if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'tasks' AND column_name = 'display_order'
        ) THEN
          ALTER TABLE tasks ADD COLUMN display_order INTEGER DEFAULT 0;

          -- Update existing tasks with display_order based on created_at
          UPDATE tasks
          SET display_order = subquery.row_num
          FROM (
            SELECT id, ROW_NUMBER() OVER (
              PARTITION BY COALESCE(parent_task_id, 0)
              ORDER BY created_at
            ) as row_num
            FROM tasks
          ) AS subquery
          WHERE tasks.id = subquery.id;

          ALTER TABLE tasks ALTER COLUMN display_order SET NOT NULL;
        END IF;
      END $$;
    `
  });

  if (alterError) {
    console.error('Error adding column:', alterError);

    // Fallback: Try direct SQL if RPC doesn't work
    console.log('Trying alternative approach...');

    // Check if column exists
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'tasks')
      .eq('column_name', 'display_order');

    if (!columns || columns.length === 0) {
      console.log('Column does not exist. You may need to run this SQL manually in Supabase SQL Editor:');
      console.log(`
ALTER TABLE tasks ADD COLUMN display_order INTEGER DEFAULT 0;

UPDATE tasks
SET display_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY COALESCE(parent_task_id, 0)
    ORDER BY created_at
  ) as row_num
  FROM tasks
) AS subquery
WHERE tasks.id = subquery.id;

ALTER TABLE tasks ALTER COLUMN display_order SET NOT NULL;
      `);
      return;
    }
  }

  console.log('✓ Successfully added display_order column');
  console.log('✓ Updated existing tasks with display order');
}

addDisplayOrderColumn().catch(console.error);
