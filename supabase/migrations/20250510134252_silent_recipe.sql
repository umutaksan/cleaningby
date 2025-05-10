/*
  # Add Insert Policy for Cleanings Table

  1. Security Changes
    - Add RLS policy to allow admins to insert new cleanings
    - Cast auth.uid() to text for proper type comparison
*/

CREATE POLICY "Admins can insert cleanings"
  ON cleanings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM cleaners
      WHERE cleaners.id = (auth.uid())::text
      AND cleaners.is_admin = true
    )
  );