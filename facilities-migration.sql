-- Facilities Status Sheets Migration
-- Run this SQL in your Supabase SQL Editor to add facility-specific columns

-- Add facility-specific columns to equipment table
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS ownership TEXT DEFAULT 'business';

-- Ownership options: 'business', 'county', 'shared', 'leased'

-- Note: The existing 'status' column serves as the condition field
-- Status/Condition options: 'operational', 'down', 'limited', 'out-of-service'

-- Note: equipment_type can now include facility subtypes:
-- 'vehicle', 'facility', 'equipment', 'system',
-- 'hangar-door', 'fuel-farm', 'runway-lights', 'hvac', 'boiler'
