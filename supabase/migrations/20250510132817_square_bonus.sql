/*
  # Schema Setup for CSV Import Data

  1. New Tables
    - `cleanings`
      - `id` (text, primary key) - Generated from property name and date
      - `property` (text) - HouseName from CSV
      - `guest` (text) - Name from CSV
      - `arrival_date` (date) - DateArrival from CSV
      - `departure_date` (date) - DateDeparture from CSV
      - `people_count` (integer) - People from CSV
      - `status` (text) - Calculated based on dates
      - `cleaner_id` (uuid) - Reference to cleaners
      - `price` (decimal) - TotalAmount from CSV
      - `payment_status` (text)
      - `notes` (text)
      - `door_code` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for data access
*/

-- Create cleanings table
CREATE TABLE IF NOT EXISTS cleanings (
  id text PRIMARY KEY,
  property text NOT NULL,
  guest text NOT NULL,
  arrival_date date NOT NULL,
  departure_date date NOT NULL,
  people_count integer DEFAULT 1,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed')),
  cleaner_id uuid REFERENCES cleaners(id),
  price decimal(10,2),
  payment_status text CHECK (payment_status IN ('pending', 'partial', 'paid')),
  created_at timestamptz DEFAULT now(),
  notes text,
  door_code text,
  UNIQUE(property, departure_date)
);

-- Enable RLS
ALTER TABLE cleanings ENABLE ROW LEVEL SECURITY;

-- Policies for cleanings
CREATE POLICY "Cleaners can read assigned cleanings"
  ON cleanings
  FOR SELECT
  TO authenticated
  USING (
    cleaner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM cleaners WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can manage cleanings"
  ON cleanings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cleaners WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Cleaners can update assigned cleanings"
  ON cleanings
  FOR UPDATE
  TO authenticated
  USING (cleaner_id = auth.uid())
  WITH CHECK (cleaner_id = auth.uid());