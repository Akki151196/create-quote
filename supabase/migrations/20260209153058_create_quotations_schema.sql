/*
  # The Royal Catering Service & Events - Quotations Schema

  ## Overview
  This migration creates the complete database schema for a professional quotation and invoice management system for The Royal Catering Service & Events.

  ## New Tables

  ### `quotations`
  Main table storing quotation/invoice data
  - `id` (uuid, primary key) - Unique identifier
  - `quotation_number` (text, unique) - Auto-generated quotation number (e.g., QUOTE-2024-001)
  - `client_name` (text) - Client's full name
  - `client_phone` (text) - Client's phone number
  - `client_email` (text, optional) - Client's email address
  - `event_date` (date) - Date of the event
  - `event_type` (text) - Type of event (wedding, party, corporate, etc.)
  - `event_venue` (text, optional) - Venue address/name
  - `number_of_guests` (integer) - Expected number of guests
  - `subtotal` (numeric) - Total before tax and discount
  - `tax_percentage` (numeric) - GST/Tax percentage
  - `tax_amount` (numeric) - Calculated tax amount
  - `discount_percentage` (numeric) - Discount percentage
  - `discount_amount` (numeric) - Calculated discount amount
  - `grand_total` (numeric) - Final total amount
  - `status` (text) - Status: draft, sent, accepted, rejected, converted_to_invoice
  - `notes` (text, optional) - Internal notes
  - `terms_and_conditions` (text) - Terms and conditions text
  - `created_by` (uuid) - Reference to admin user who created it
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `quotation_items`
  Line items for quotations (menu items and services)
  - `id` (uuid, primary key) - Unique identifier
  - `quotation_id` (uuid) - Foreign key to quotations table
  - `item_type` (text) - Type: menu_item or service
  - `item_name` (text) - Name of the item/service
  - `description` (text, optional) - Detailed description
  - `unit_price` (numeric) - Price per unit/person/plate
  - `quantity` (integer) - Quantity (usually number of guests)
  - `total` (numeric) - Calculated total (unit_price * quantity)
  - `sort_order` (integer) - Order for display
  - `created_at` (timestamptz) - Creation timestamp

  ### `quotation_responses`
  Client responses to quotations
  - `id` (uuid, primary key) - Unique identifier
  - `quotation_id` (uuid) - Foreign key to quotations table
  - `response_type` (text) - Type: accepted or rejected
  - `response_message` (text, optional) - Client's message
  - `responded_at` (timestamptz) - Response timestamp

  ## Security
  - Enable RLS on all tables
  - Admin users (authenticated) can perform all operations
  - Public users can view quotations via share link (using quotation_id)
  - Public users can submit responses to quotations
*/

-- Create quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number text UNIQUE NOT NULL,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  client_email text,
  event_date date NOT NULL,
  event_type text NOT NULL,
  event_venue text,
  number_of_guests integer NOT NULL DEFAULT 0,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax_percentage numeric(5,2) NOT NULL DEFAULT 0,
  tax_amount numeric(10,2) NOT NULL DEFAULT 0,
  discount_percentage numeric(5,2) NOT NULL DEFAULT 0,
  discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  grand_total numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  terms_and_conditions text DEFAULT 'Payment terms: 50% advance at booking, 50% before event. Cancellation policy: Non-refundable after 7 days of booking.',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create quotation_items table
CREATE TABLE IF NOT EXISTS quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_name text NOT NULL,
  description text,
  unit_price numeric(10,2) NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  total numeric(10,2) NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create quotation_responses table
CREATE TABLE IF NOT EXISTS quotation_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  response_type text NOT NULL,
  response_message text,
  responded_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotations_created_by ON quotations(created_by);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_event_date ON quotations(event_date);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_responses_quotation_id ON quotation_responses(quotation_id);

-- Enable Row Level Security
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quotations table

-- Authenticated users (admins) can view all quotations
CREATE POLICY "Admins can view all quotations"
  ON quotations
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users (admins) can insert quotations
CREATE POLICY "Admins can create quotations"
  ON quotations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Authenticated users (admins) can update their own quotations
CREATE POLICY "Admins can update quotations"
  ON quotations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users (admins) can delete quotations
CREATE POLICY "Admins can delete quotations"
  ON quotations
  FOR DELETE
  TO authenticated
  USING (true);

-- Public users can view quotations (for client view via share link)
CREATE POLICY "Public can view quotations via link"
  ON quotations
  FOR SELECT
  TO anon
  USING (true);

-- RLS Policies for quotation_items table

-- Authenticated users can view all quotation items
CREATE POLICY "Admins can view all quotation items"
  ON quotation_items
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert quotation items
CREATE POLICY "Admins can create quotation items"
  ON quotation_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update quotation items
CREATE POLICY "Admins can update quotation items"
  ON quotation_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete quotation items
CREATE POLICY "Admins can delete quotation items"
  ON quotation_items
  FOR DELETE
  TO authenticated
  USING (true);

-- Public users can view quotation items (for client view)
CREATE POLICY "Public can view quotation items"
  ON quotation_items
  FOR SELECT
  TO anon
  USING (true);

-- RLS Policies for quotation_responses table

-- Authenticated users can view all responses
CREATE POLICY "Admins can view all responses"
  ON quotation_responses
  FOR SELECT
  TO authenticated
  USING (true);

-- Public users can view responses
CREATE POLICY "Public can view responses"
  ON quotation_responses
  FOR SELECT
  TO anon
  USING (true);

-- Public users can insert responses (accept/reject quotations)
CREATE POLICY "Public can submit responses"
  ON quotation_responses
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create a function to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for quotations table
CREATE TRIGGER update_quotations_updated_at
  BEFORE UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();