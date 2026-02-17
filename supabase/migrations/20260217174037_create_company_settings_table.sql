/*
  # Create Company Settings Table

  ## Overview
  This migration creates a table to store company/business settings that are used throughout the application,
  particularly in PDF generation (quotations and invoices).

  ## New Tables
  - `company_settings`
    - `id` (uuid, primary key) - Unique identifier
    - `user_id` (uuid, foreign key) - References auth.users, the owner of these settings
    - `business_name` (text) - Company/business name
    - `email` (text) - Business email address
    - `phone` (text) - Business phone number
    - `address` (text) - Business address
    - `gst_number` (text, nullable) - GST/Tax identification number
    - `website` (text, nullable) - Business website URL
    - `bank_name` (text, nullable) - Bank name for payment details
    - `account_number` (text, nullable) - Bank account number
    - `ifsc_code` (text, nullable) - Bank IFSC code
    - `upi_id` (text, nullable) - UPI ID for payments
    - `default_tax_rate` (numeric, default 18) - Default tax percentage for new quotations
    - `default_terms` (text) - Default terms and conditions for quotations/invoices
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Record last update timestamp

  ## Security
  - Enable RLS on company_settings table
  - Users can only view their own settings
  - Users can only insert their own settings
  - Users can only update their own settings
  - Users cannot delete settings (to prevent accidental data loss)

  ## Notes
  - Each user should have only one settings record
  - A unique constraint ensures one settings record per user
  - Settings are automatically loaded in the application and used in PDF generation
*/

CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name text NOT NULL DEFAULT 'The Royal Catering Service & Events',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  gst_number text DEFAULT '',
  website text DEFAULT '',
  bank_name text DEFAULT '',
  account_number text DEFAULT '',
  ifsc_code text DEFAULT '',
  upi_id text DEFAULT '',
  default_tax_rate numeric DEFAULT 18,
  default_terms text DEFAULT 'Payment terms: 50% advance at booking, 50% before event. Cancellation policy: Non-refundable after 7 days of booking.',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON company_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON company_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON company_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_company_settings_user_id ON company_settings(user_id);

CREATE OR REPLACE FUNCTION update_company_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_settings_timestamp
  BEFORE UPDATE ON company_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_company_settings_updated_at();
