/*
  # Fix RLS policies and type casting

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new policies with proper type casting
    - Ensure authenticated users can insert records
    - Maintain security while allowing necessary operations

  2. Security
    - Maintain RLS enabled on all tables
    - Ensure proper access control for different user roles
*/

-- First drop all existing policies to avoid conflicts
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