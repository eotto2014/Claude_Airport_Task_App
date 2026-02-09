-- Equipment Replacement Parts Migration
-- Run this SQL in your Supabase SQL Editor

-- Create table for equipment replacement part numbers
CREATE TABLE IF NOT EXISTS equipment_parts (
  id SERIAL PRIMARY KEY,
  equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  part_component TEXT NOT NULL,
  part_number TEXT NOT NULL,
  last_sourced_from TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by equipment
CREATE INDEX IF NOT EXISTS idx_equipment_parts_equipment_id ON equipment_parts(equipment_id);

-- Enable RLS (Row Level Security)
ALTER TABLE equipment_parts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth needs)
CREATE POLICY "Allow all operations on equipment_parts" ON equipment_parts
  FOR ALL USING (true) WITH CHECK (true);
