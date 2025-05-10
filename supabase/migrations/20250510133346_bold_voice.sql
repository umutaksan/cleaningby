/*
  # Fix RLS policies type casting

  1. Changes
    - Drop existing policies
    - Recreate policies with proper type casting between UUID and text
    - Ensure consistent type comparison in all policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all cleanings" ON cleanings;
DROP POLICY IF EXISTS "Authenticated users can read all cleanings" ON cleanings;
DROP POLICY IF EXISTS "Authenticated users can insert cleanings" ON cleanings;
DROP POLICY IF EXISTS "Cleaners can update assigned cleanings" ON cleanings;
DROP POLICY IF EXISTS "Cleaners can read own data" ON cleaners;
DROP POLICY IF EXISTS "Admins can manage cleaners" ON cleaners;

-- Recreate policies with proper type casting
CREATE POLICY "Cleaners can read own data"
  ON cleaners
  FOR SELECT
  TO authenticated
  USING (id = auth.uid()::text);

CREATE POLICY "Admins can manage cleaners"
  ON cleaners
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM cleaners 
    WHERE id = auth.uid()::text 
    AND is_admin = true
  ));

CREATE POLICY "Admins can manage all cleanings"
  ON cleanings
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cleaners
      WHERE id = auth.uid()::text
      AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cleaners
      WHERE id = auth.uid()::text
      AND is_admin = true
    )
  );

CREATE POLICY "Authenticated users can read all cleanings"
  ON cleanings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert cleanings"
  ON cleanings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Cleaners can update assigned cleanings"
  ON cleanings
  FOR UPDATE
  TO authenticated
  USING (
    cleaner_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM cleaners
      WHERE id = auth.uid()::text
      AND is_admin = true
    )
  )
  WITH CHECK (
    cleaner_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM cleaners
      WHERE id = auth.uid()::text
      AND is_admin = true
    )
  );