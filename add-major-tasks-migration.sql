-- Migration: Add Major Task and Subtask Support
-- Run this SQL in your Supabase SQL Editor to add major task support

-- Add new columns to tasks table
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS is_major_task BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS parent_task_id BIGINT REFERENCES tasks(id) ON DELETE CASCADE;

-- Create index for parent_task_id for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);

-- Add comment for documentation
COMMENT ON COLUMN tasks.is_major_task IS 'Indicates if this is a major task that can have subtasks';
COMMENT ON COLUMN tasks.parent_task_id IS 'Reference to parent task if this is a subtask';
