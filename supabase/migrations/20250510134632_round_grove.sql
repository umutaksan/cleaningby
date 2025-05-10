/*
  # Fix RLS Policies for Cleaning Management System

  1. Changes
    - Simplify RLS policies
    - Fix type casting issues
    - Allow unauthenticated inserts for CSV uploads
    - Maintain security for updates and deletes

  2. Security
    - Enable RLS on all tables
    - Add simplified policies for basic operations
    - Ensure proper type casting for auth.uid()
*/

-- First drop all existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON cleanings;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON cleanings;
DROP POLICY IF EXISTS "Enable update for admins and assigned cleaners" ON cleanings;
DROP POLICY IF EXISTS "Enable delete for admins" ON cleanings;
DROP POLICY IF EXISTS "Admins can insert cleanings" ON cleanings;
DROP POLICY IF EXISTS "Cleaners can read own data" ON cleaners;
DROP POLICY IF EXISTS "Admins can manage cleaners" ON cleaners;

-- Create new simplified policies for cleanings
CREATE POLICY "Enable read access for all users"
ON cleanings FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for all users"
ON cleanings FOR INSERT
WITH CHECK (true);

CREATE POLICY "Enable update for admins and assigned cleaners"
ON cleanings FOR UPDATE
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

CREATE POLICY "Enable delete for admins"
ON cleanings FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM cleaners
    WHERE id = auth.uid()::text
    AND is_admin = true
  )
);

-- Recreate cleaner policies
CREATE POLICY "Enable read own data"
ON cleaners FOR SELECT
TO authenticated
USING (id = auth.uid()::text);

CREATE POLICY "Enable admin management"
ON cleaners FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cleaners
    WHERE id = auth.uid()::text
    AND is_admin = true
  )
);