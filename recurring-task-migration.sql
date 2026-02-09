-- Recurring Task Enhancement Migration
-- Run this SQL in your Supabase SQL Editor

-- Add columns for more specific recurrence patterns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring_day_of_week INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring_day_of_month INTEGER;

-- recurring_day_of_week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
-- recurring_day_of_month: 1-31 (day of the month)

-- For weekly tasks: recurring_day_of_week specifies which day
-- For monthly tasks: recurring_day_of_month specifies which day (1-31)
-- For quarterly/annually: recurring_day_of_month can specify which day of that month
