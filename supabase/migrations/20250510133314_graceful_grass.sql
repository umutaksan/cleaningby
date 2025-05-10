/*
  # Update RLS policies for cleanings table

  1. Changes
    - Add policy for admins to manage all cleanings
    - Add policy for authenticated users to read all cleanings
    - Add policy for authenticated users to insert cleanings
    - Add policy for cleaners to update their assigned cleanings

  2. Security
    - Maintains RLS on cleanings table
    - Ensures admins have full access
    - Allows authenticated users to read and insert cleanings
    - Restricts cleaner updates to their assigned cleanings only
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage cleanings" ON cleanings;
DROP POLICY IF EXISTS "Cleaners can read assigned cleanings" ON cleanings;
DROP POLICY IF EXISTS "Cleaners can update assigned cleanings" ON cleanings;

-- Create new policies
CREATE POLICY "Admins can manage all cleanings"
ON cleanings
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cleaners
    WHERE cleaners.id = auth.uid()
    AND cleaners.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cleaners
    WHERE cleaners.id = auth.uid()
    AND cleaners.is_admin = true
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
  cleaner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM cleaners
    WHERE cleaners.id = auth.uid()
    AND cleaners.is_admin = true
  )
)
WITH CHECK (
  cleaner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM cleaners
    WHERE cleaners.id = auth.uid()
    AND cleaners.is_admin = true
  )
);