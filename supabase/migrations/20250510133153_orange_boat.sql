/*
  # Initial Schema Setup for Cleaning Management System

  1. New Tables
    - `cleaners`
      - `id` (text, primary key)
      - `name` (text)
      - `is_admin` (boolean)
      - `created_at` (timestamp)
    
    - `cleanings`
      - `id` (text, primary key)
      - `property` (text)
      - `guest` (text)
      - `arrival_date` (timestamptz)
      - `departure_date` (timestamptz)
      - `people_count` (integer)
      - `status` (text)
      - `cleaner_id` (text, foreign key)
      - `cleaner_name` (text)
      - `price` (decimal)
      - `cleaning_price` (decimal)
      - `payment_status` (text)
      - `notes` (text)
      - `door_code` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS cleanings;
DROP TABLE IF EXISTS cleaners;

-- Create cleaners table
CREATE TABLE cleaners (
  id text PRIMARY KEY,
  name text NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create cleanings table
CREATE TABLE cleanings (
  id text PRIMARY KEY,
  property text NOT NULL,
  guest text NOT NULL,
  arrival_date timestamptz NOT NULL,
  departure_date timestamptz NOT NULL,
  people_count integer DEFAULT 1,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed')),
  cleaner_id text REFERENCES cleaners(id),
  cleaner_name text,
  price decimal(10,2),
  cleaning_price decimal(10,2),
  payment_status text CHECK (payment_status IN ('pending', 'partial', 'paid')),
  notes text,
  door_code text,
  created_at timestamptz DEFAULT now(),
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
  USING (auth.uid()::text = id);

CREATE POLICY "Admins can manage cleaners"
  ON cleaners
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM cleaners WHERE id = auth.uid()::text AND is_admin = true
  ));

-- Policies for cleanings
CREATE POLICY "Cleaners can read assigned cleanings"
  ON cleanings
  FOR SELECT
  TO authenticated
  USING (
    cleaner_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM cleaners WHERE id = auth.uid()::text AND is_admin = true
    )
  );

CREATE POLICY "Admins can manage cleanings"
  ON cleanings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cleaners WHERE id = auth.uid()::text AND is_admin = true
    )
  );

CREATE POLICY "Cleaners can update assigned cleanings"
  ON cleanings
  FOR UPDATE
  TO authenticated
  USING (cleaner_id = auth.uid()::text)
  WITH CHECK (cleaner_id = auth.uid()::text);