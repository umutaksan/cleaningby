/*
  # Add example cleaners

  1. New Records
    - Add Cleaner 1 and Cleaner 2 to the cleaners table
    
  2. Details
    - Both cleaners are non-admin users
    - Using predefined IDs to match the application logic
*/

-- Insert example cleaners
INSERT INTO cleaners (id, name, is_admin)
VALUES 
  ('cleaner-1', 'Cleaner 1', false),
  ('cleaner-2', 'Cleaner 2', false)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    is_admin = EXCLUDED.is_admin;