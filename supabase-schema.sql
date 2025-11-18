-- Airport Task Tracker Database Schema
-- Run this SQL in your Supabase SQL Editor to create the required tables

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  assignee TEXT,
  status TEXT NOT NULL DEFAULT 'not-started',
  equipment TEXT,
  due_date DATE,
  notes TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_interval TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task remarks table (one-to-many relationship with tasks)
CREATE TABLE IF NOT EXISTS task_remarks (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT REFERENCES tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default team members
INSERT INTO team_members (name) VALUES
  ('Pat'),
  ('Evan'),
  ('Cody'),
  ('Wyatt'),
  ('Carlos')
ON CONFLICT (name) DO NOTHING;

-- Insert default equipment
INSERT INTO equipment (name) VALUES
  ('Jet Fuel Truck 1'),
  ('Jet Fuel Truck 2'),
  ('Avgas Truck 1'),
  ('Fire Truck'),
  ('Hangar 1'),
  ('Hangar 2'),
  ('Hangar 3'),
  ('Hangar 4'),
  ('Terminal Building'),
  ('Fuel Storage Tank 1'),
  ('Fuel Storage Tank 2'),
  ('Fuel Storage Tank 3'),
  ('Runway Lighting System'),
  ('AWOS Station')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (modify these based on your auth requirements)
-- For now, allowing all operations for everyone

-- Tasks policies
CREATE POLICY "Allow all access to tasks" ON tasks
  FOR ALL USING (true) WITH CHECK (true);

-- Task remarks policies
CREATE POLICY "Allow all access to task_remarks" ON task_remarks
  FOR ALL USING (true) WITH CHECK (true);

-- Team members policies
CREATE POLICY "Allow all access to team_members" ON team_members
  FOR ALL USING (true) WITH CHECK (true);

-- Equipment policies
CREATE POLICY "Allow all access to equipment" ON equipment
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_remarks_task_id ON task_remarks(task_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tasks table
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
