/*
  # Fix RLS Policies and Add Insert Policy

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new policies with proper type casting
    - Add explicit insert policy for authenticated users
    - Fix type casting issues in policy conditions

  2. Security
    - Maintain RLS enabled on all tables
    - Allow authenticated users to insert new cleanings
    - Allow admins to manage all cleanings
    - Allow cleaners to update their assigned cleanings
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON cleanings;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON cleanings;
DROP POLICY IF EXISTS "Enable update for admins and assigned cleaners" ON cleanings;
DROP POLICY IF EXISTS "Enable delete for admins" ON cleanings;

-- Create new policies with proper type casting
CREATE POLICY "Enable insert for authenticated users"
ON cleanings
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users"
ON cleanings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable update for admins and assigned cleaners"
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

CREATE POLICY "Enable delete for admins"
ON cleanings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cleaners
    WHERE id = auth.uid()::text
    AND is_admin = true
  )
);

-- Ensure cleaners table has proper policies
DROP POLICY IF EXISTS "Cleaners can read own data" ON cleaners;
DROP POLICY IF EXISTS "Admins can manage cleaners" ON cleaners;

CREATE POLICY "Cleaners can read own data"
ON cleaners
FOR SELECT
TO authenticated
USING (id = auth.uid()::text);

CREATE POLICY "Admins can manage cleaners"
ON cleaners
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cleaners
    WHERE id = auth.uid()::text
    AND is_admin = true
  )
);