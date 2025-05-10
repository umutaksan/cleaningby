/*
  # Initial Schema Setup for Cleaning Management System

  1. New Tables
    - `cleaners`
      - `id` (uuid, primary key)
      - `name` (text)
      - `is_admin` (boolean)
      - `created_at` (timestamp)
    
    - `cleanings`
      - `id` (uuid, primary key)
      - `property` (text)
      - `guest` (text)
      - `arrival_date` (date)
      - `departure_date` (date)
      - `people_count` (integer)
      - `status` (text)
      - `cleaner_id` (uuid, foreign key)
      - `price` (decimal)
      - `payment_status` (text)
      - `created_at` (timestamp)
      - `notes` (text)
      - `door_code` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create cleaners table
CREATE TABLE cleaners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create cleanings table
CREATE TABLE cleanings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
ALTER TABLE cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleanings ENABLE ROW LEVEL SECURITY;

-- Policies for cleaners
CREATE POLICY "Cleaners can read own data"
  ON cleaners
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage cleaners"
  ON cleaners
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM cleaners WHERE id = auth.uid() AND is_admin = true
  ));

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