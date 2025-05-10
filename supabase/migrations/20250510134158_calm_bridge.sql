/*
  # Add insert policy for cleanings table

  1. Security Changes
    - Add RLS policy to allow admins to insert new cleanings
    - This policy ensures that only admin users can insert new cleaning records
    - The policy checks if the user is an admin by querying the cleaners table

  Note: This maintains security while enabling the CSV upload functionality
*/

CREATE POLICY "Admins can insert cleanings"
  ON cleanings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM cleaners
      WHERE cleaners.id = auth.uid()
      AND cleaners.is_admin = true
    )
  );