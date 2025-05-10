/*
  # Update Cleaning Schema

  1. Changes
    - Add missing columns for cleaning details
    - Add constraints and defaults
    - Update existing tables with new fields

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns and modify existing ones in cleanings table
ALTER TABLE cleanings
  ADD COLUMN IF NOT EXISTS details_locked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS edit_request boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_new boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS added_at bigint;

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_cleanings_status ON cleanings(status);
CREATE INDEX IF NOT EXISTS idx_cleanings_departure_date ON cleanings(departure_date);
CREATE INDEX IF NOT EXISTS idx_cleanings_cleaner_id ON cleanings(cleaner_id);

-- Add constraints for status and payment_status if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cleanings_status_check'
  ) THEN
    ALTER TABLE cleanings
      ADD CONSTRAINT cleanings_status_check 
      CHECK (status IN ('pending', 'confirmed', 'completed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cleanings_payment_status_check'
  ) THEN
    ALTER TABLE cleanings
      ADD CONSTRAINT cleanings_payment_status_check 
      CHECK (payment_status IN ('pending', 'partial', 'paid'));
  END IF;
END $$;