-- Add display_order column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Update existing tasks with display_order based on created_at
-- Parent tasks and subtasks get separate ordering
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

-- Make display_order NOT NULL after populating values
ALTER TABLE tasks ALTER COLUMN display_order SET NOT NULL;
