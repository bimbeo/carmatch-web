-- Run this in Supabase Dashboard > SQL Editor
-- Allows the public website (anon key) to read published + available vehicles

-- Enable RLS on vehicles if not already enabled
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on vehicle_models if not already enabled
ALTER TABLE vehicle_models ENABLE ROW LEVEL SECURITY;

-- Allow anon to SELECT only published + available vehicles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vehicles'
      AND policyname = 'Public can read published available vehicles'
  ) THEN
    CREATE POLICY "Public can read published available vehicles"
      ON vehicles
      FOR SELECT
      TO anon
      USING (status = 'available' AND published = true);
  END IF;
END $$;

-- Allow anon to SELECT vehicle_models (needed for the join)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'vehicle_models'
      AND policyname = 'Public can read vehicle models'
  ) THEN
    CREATE POLICY "Public can read vehicle models"
      ON vehicle_models
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END $$;
