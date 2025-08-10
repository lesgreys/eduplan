-- Add date column to activities table
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS date DATE;

-- Add an index on the date column for better query performance
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);

-- Add an index on user_id and date for efficient weekly queries
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, date);

-- Optional: Update existing activities to have dates based on current week
-- This sets all existing activities to this week (you can adjust as needed)
UPDATE activities 
SET date = CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::integer - 
  CASE day
    WHEN 'Monday' THEN 1
    WHEN 'Tuesday' THEN 2
    WHEN 'Wednesday' THEN 3
    WHEN 'Thursday' THEN 4
    WHEN 'Friday' THEN 5
    WHEN 'Saturday' THEN 6
    WHEN 'Sunday' THEN 0
  END)
WHERE date IS NULL;