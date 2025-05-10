/*
  # Update RLS policies for cleanings table

  1. Changes
    - Modify RLS policies to allow CSV uploads by authenticated users
    - Keep existing policies for read/update/delete operations
    - Add new policy for insert operations

  2. Security
    - Maintain existing security for read/update/delete
    - Allow authenticated users to insert new cleanings
    - Preserve admin-only delete operations
*/

-- First, drop the existing insert policy if it exists
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON cleanings;

-- Create new insert policy that allows authenticated users to insert records
CREATE POLICY "Enable insert for authenticated users"
ON cleanings
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Ensure other policies remain unchanged but are properly defined
DROP POLICY IF EXISTS "Enable read for authenticated users" ON cleanings;
CREATE POLICY "Enable read for authenticated users"
ON cleanings
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Enable update for admins and assigned cleaners" ON cleanings;
CREATE POLICY "Enable update for admins and assigned cleaners"
ON cleanings
FOR UPDATE
TO authenticated
USING (
  (cleaner_id = auth.uid()::text) OR 
  (EXISTS (
    SELECT 1
    FROM cleaners
    WHERE cleaners.id = auth.uid()::text 
    AND cleaners.is_admin = true
  ))
)
WITH CHECK (
  (cleaner_id = auth.uid()::text) OR 
  (EXISTS (
    SELECT 1
    FROM cleaners
    WHERE cleaners.id = auth.uid()::text 
    AND cleaners.is_admin = true
  ))
);

DROP POLICY IF EXISTS "Enable delete for admins" ON cleanings;
CREATE POLICY "Enable delete for admins"
ON cleanings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM cleaners
    WHERE cleaners.id = auth.uid()::text 
    AND cleaners.is_admin = true
  )
);