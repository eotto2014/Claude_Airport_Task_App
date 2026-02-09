-- Recurring Task Improvements Migration
-- Run this SQL in your Supabase SQL Editor

-- Add column for specifying the month (used for annual recurrence)
-- Values 1-12 represent January-December
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurring_month INTEGER;

-- For quarterly tasks, recurring_month stores 1, 2, or 3 to indicate
-- which month of each quarter (1st, 2nd, or 3rd month)
-- For annual tasks, recurring_month stores 1-12 for the specific month
