/*
  # Menu Templates, Packages, Clients, and Payments Schema

  ## Overview
  This migration creates tables for managing menu templates, service packages, clients, and payment tracking
  to enhance the quotation management system with complete business functionality.

  ## New Tables

  ### `menu_categories`
  Categories for organizing menu items
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text, unique) - Category name (e.g., "Appetizers", "Main Course", "Desserts")
  - `description` (text, optional) - Category description
  - `display_order` (integer) - Order for display
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `menu_items`
  Library of menu items that can be added to templates and quotations
  - `id` (uuid, primary key) - Unique identifier
  - `category_id` (uuid) - Foreign key to menu_categories
  - `name` (text) - Item name
  - `description` (text, optional) - Detailed description
  - `base_price` (numeric) - Base price per unit
  - `unit` (text) - Unit of measurement (e.g., "per person", "per plate", "per item")
  - `is_vegetarian` (boolean) - Whether item is vegetarian
  - `is_active` (boolean) - Whether item is currently available
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `menu_templates`
  Pre-configured menu templates for quick quotation creation
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Template name (e.g., "Wedding Package - Basic", "Corporate Lunch")
  - `description` (text, optional) - Template description
  - `is_active` (boolean) - Whether template is currently available
  - `created_by` (uuid) - Reference to admin user who created it
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `menu_template_items`
  Items included in menu templates
  - `id` (uuid, primary key) - Unique identifier
  - `template_id` (uuid) - Foreign key to menu_templates
  - `menu_item_id` (uuid) - Foreign key to menu_items
  - `quantity_multiplier` (numeric) - Multiplier for guest count (usually 1)
  - `sort_order` (integer) - Order for display
  - `created_at` (timestamptz) - Creation timestamp

  ### `packages`
  Complete service packages including menu and services
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Package name (e.g., "Gold Wedding Package")
  - `description` (text, optional) - Package description
  - `base_price_per_person` (numeric, optional) - Base price per person
  - `is_active` (boolean) - Whether package is currently available
  - `created_by` (uuid) - Reference to admin user who created it
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `package_items`
  Items included in packages
  - `id` (uuid, primary key) - Unique identifier
  - `package_id` (uuid) - Foreign key to packages
  - `item_type` (text) - Type: menu_item or service
  - `item_name` (text) - Name of item/service
  - `description` (text, optional) - Description
  - `unit_price` (numeric) - Price per unit
  - `quantity_multiplier` (numeric) - Multiplier based on guest count
  - `sort_order` (integer) - Order for display
  - `created_at` (timestamptz) - Creation timestamp

  ### `clients`
  Client contact and information management
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Client name
  - `email` (text, optional) - Client email
  - `phone` (text) - Client phone number
  - `secondary_phone` (text, optional) - Secondary phone number
  - `address` (text, optional) - Client address
  - `company_name` (text, optional) - Company name for corporate clients
  - `notes` (text, optional) - Internal notes about client
  - `created_by` (uuid) - Reference to admin user who created it
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `payments`
  Payment tracking for quotations
  - `id` (uuid, primary key) - Unique identifier
  - `quotation_id` (uuid) - Foreign key to quotations table
  - `amount` (numeric) - Payment amount
  - `payment_type` (text) - Type: advance, partial, full, refund
  - `payment_method` (text) - Method: cash, card, upi, bank_transfer, razorpay
  - `payment_status` (text) - Status: pending, completed, failed, refunded
  - `razorpay_order_id` (text, optional) - Razorpay order ID
  - `razorpay_payment_id` (text, optional) - Razorpay payment ID
  - `transaction_reference` (text, optional) - Transaction reference number
  - `payment_date` (timestamptz, optional) - When payment was completed
  - `notes` (text, optional) - Payment notes
  - `created_by` (uuid) - Reference to admin user who created record
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - Enable RLS on all tables
  - Admin users (authenticated) can perform all operations
  - Public users have no access to these tables
*/

-- Create menu_categories table
CREATE TABLE IF NOT EXISTS menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES menu_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'per person',
  is_vegetarian boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create menu_templates table
CREATE TABLE IF NOT EXISTS menu_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create menu_template_items table
CREATE TABLE IF NOT EXISTS menu_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES menu_templates(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity_multiplier numeric(10,2) NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  base_price_per_person numeric(10,2),
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create package_items table
CREATE TABLE IF NOT EXISTS package_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_name text NOT NULL,
  description text,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  quantity_multiplier numeric(10,2) NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text NOT NULL,
  secondary_phone text,
  address text,
  company_name text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  payment_type text NOT NULL,
  payment_method text NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  transaction_reference text,
  payment_date timestamptz,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_active ON menu_items(is_active);
CREATE INDEX IF NOT EXISTS idx_menu_template_items_template_id ON menu_template_items(template_id);
CREATE INDEX IF NOT EXISTS idx_menu_template_items_menu_item_id ON menu_template_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_package_items_package_id ON package_items(package_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_payments_quotation_id ON payments(quotation_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON payments(payment_status);

-- Enable Row Level Security
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for menu_categories table
CREATE POLICY "Admins can view all menu categories"
  ON menu_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert menu categories"
  ON menu_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update menu categories"
  ON menu_categories
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete menu categories"
  ON menu_categories
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for menu_items table
CREATE POLICY "Admins can view all menu items"
  ON menu_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert menu items"
  ON menu_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update menu items"
  ON menu_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete menu items"
  ON menu_items
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for menu_templates table
CREATE POLICY "Admins can view all menu templates"
  ON menu_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert menu templates"
  ON menu_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update menu templates"
  ON menu_templates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete menu templates"
  ON menu_templates
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for menu_template_items table
CREATE POLICY "Admins can view all menu template items"
  ON menu_template_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert menu template items"
  ON menu_template_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update menu template items"
  ON menu_template_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete menu template items"
  ON menu_template_items
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for packages table
CREATE POLICY "Admins can view all packages"
  ON packages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert packages"
  ON packages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update packages"
  ON packages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete packages"
  ON packages
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for package_items table
CREATE POLICY "Admins can view all package items"
  ON package_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert package items"
  ON package_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update package items"
  ON package_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete package items"
  ON package_items
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for clients table
CREATE POLICY "Admins can view all clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for payments table
CREATE POLICY "Admins can view all payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete payments"
  ON payments
  FOR DELETE
  TO authenticated
  USING (true);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_menu_categories_updated_at
  BEFORE UPDATE ON menu_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_templates_updated_at
  BEFORE UPDATE ON menu_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default menu categories
INSERT INTO menu_categories (name, description, display_order) VALUES
  ('Appetizers', 'Starters and small bites', 1),
  ('Main Course - Veg', 'Vegetarian main dishes', 2),
  ('Main Course - Non-Veg', 'Non-vegetarian main dishes', 3),
  ('Breads & Rice', 'Breads, rice, and accompaniments', 4),
  ('Desserts', 'Sweet dishes and desserts', 5),
  ('Beverages', 'Drinks and beverages', 6),
  ('Services', 'Additional services', 7)
ON CONFLICT (name) DO NOTHING;