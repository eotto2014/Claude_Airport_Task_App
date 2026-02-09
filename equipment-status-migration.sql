-- Equipment Status Sheets Migration
-- Run this SQL in your Supabase SQL Editor to add new columns to the equipment table

-- Add new columns for admin data
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS equipment_type TEXT DEFAULT 'vehicle';
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS make TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS vin TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS license_plate TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS acquisition_date DATE;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS mileage_hours INTEGER;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS registration_date DATE;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS registration_renewal_date DATE;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS insurance_expiration DATE;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'operational';
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS notes TEXT;

-- Status options: 'operational', 'down', 'limited', 'out-of-service'

-- Create index for equipment status for better performance
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(equipment_type);

-- Create index on tasks.equipment for faster lookups when viewing equipment status sheets
CREATE INDEX IF NOT EXISTS idx_tasks_equipment ON tasks(equipment);
