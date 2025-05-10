/*
  # Fix RLS policies for cleanings table

  1. Changes
    - Drop conflicting policies
    - Add new comprehensive policies that properly handle all cases
    
  2. Security
    - Maintain security while allowing CSV imports
    - Ensure admins can manage all cleanings
    - Allow authenticated users to insert cleanings
    - Allow cleaners to manage their assigned cleanings
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage all cleanings" ON cleanings;
DROP POLICY IF EXISTS "Admins can manage cleanings" ON cleanings;
DROP POLICY IF EXISTS "Authenticated users can insert cleanings" ON cleanings;
DROP POLICY IF EXISTS "Authenticated users can read all cleanings" ON cleanings;
DROP POLICY IF EXISTS "Cleaners can read assigned cleanings" ON cleanings;
DROP POLICY IF EXISTS "Cleaners can update assigned cleanings" ON cleanings;

-- Create new comprehensive policies
CREATE POLICY "Enable insert for authenticated users" ON cleanings
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users" ON cleanings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable update for admins and assigned cleaners" ON cleanings
  FOR UPDATE TO authenticated
  USING (
    cleaner_id = auth.uid()::text 
    OR 
    EXISTS (
      SELECT 1 FROM cleaners 
      WHERE cleaners.id = auth.uid()::text 
      AND cleaners.is_admin = true
    )
  )
  WITH CHECK (
    cleaner_id = auth.uid()::text 
    OR 
    EXISTS (
      SELECT 1 FROM cleaners 
      WHERE cleaners.id = auth.uid()::text 
      AND cleaners.is_admin = true
    )
  );

CREATE POLICY "Enable delete for admins" ON cleanings
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cleaners 
      WHERE cleaners.id = auth.uid()::text 
      AND cleaners.is_admin = true
    )
  );