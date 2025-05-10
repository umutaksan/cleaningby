/*
  # Update Schema for Cleaning Management System

  1. Changes
    - Drop existing tables if they exist
    - Create cleaners table with updated structure
    - Create cleanings table with updated structure to match CSV format
    - Enable RLS and add security policies

  2. Tables
    - cleaners
      - id (uuid)
      - name (text)
      - is_admin (boolean)
      - created_at (timestamptz)
    
    - cleanings
      - id (text, matches CSV Id column)
      - type (text)
      - source (text)
      - source_text (text)
      - guest_name (text)
      - arrival_date (date)
      - departure_date (date)
      - nights (integer)
      - property (text)
      - internal_code (text)
      - house_id (text)
      - room_types (text)
      - people_count (integer)
      - date_created (timestamptz)
      - total_amount (decimal)
      - currency (text)
      - promotion_code (text)
      - status (text)
      - email (text)
      - phone (text)
      - country (text)
      - ip_created (text)
      - ip_country (text)
      - quote_id (text)
      - quote_status (text)
      - room_rates_total (decimal)
      - promotions_total (decimal)
      - fees_total (decimal)
      - taxes_total (decimal)
      - addons_total (decimal)
      - addons_detail (text)
      - amount_paid (decimal)
      - balance_due (decimal)
      - change_request_adjustment (text)
      - policy_name (text)
      - payment_policy (text)
      - cancellation_policy (text)
      - damage_deposit_policy (text)
      - owner_id (text)
      - owner_first_name (text)
      - owner_last_name (text)
      - owner_email (text)
      - owner_payout (decimal)
      - included_vat_total (decimal)
      - notes (text)
      - cleaner_id (uuid)
      - cleaning_price (decimal)
      - payment_status (text)
      - door_code (text)

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS cleanings CASCADE;
DROP TABLE IF EXISTS cleaners CASCADE;

-- Create cleaners table
CREATE TABLE cleaners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create cleanings table with all CSV fields
CREATE TABLE cleanings (
  id text PRIMARY KEY,
  type text,
  source text,
  source_text text,
  guest_name text,
  arrival_date date,
  departure_date date,
  nights integer,
  property text NOT NULL,
  internal_code text,
  house_id text,
  room_types text,
  people_count integer DEFAULT 1,
  date_created timestamptz,
  total_amount decimal(10,2),
  currency text,
  promotion_code text,
  status text,
  email text,
  phone text,
  country text,
  ip_created text,
  ip_country text,
  quote_id text,
  quote_status text,
  room_rates_total decimal(10,2),
  promotions_total decimal(10,2),
  fees_total decimal(10,2),
  taxes_total decimal(10,2),
  addons_total decimal(10,2),
  addons_detail text,
  amount_paid decimal(10,2),
  balance_due decimal(10,2),
  change_request_adjustment text,
  policy_name text,
  payment_policy text,
  cancellation_policy text,
  damage_deposit_policy text,
  owner_id text,
  owner_first_name text,
  owner_last_name text,
  owner_email text,
  owner_payout decimal(10,2),
  included_vat_total decimal(10,2),
  notes text,
  -- Additional fields for cleaning management
  cleaner_id uuid REFERENCES cleaners(id),
  cleaning_price decimal(10,2),
  payment_status text CHECK (payment_status IN ('pending', 'partial', 'paid')),
  door_code text,
  created_at timestamptz DEFAULT now()
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