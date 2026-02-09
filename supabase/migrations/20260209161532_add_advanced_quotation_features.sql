/*
  # Advanced Quotation Management Features
  
  ## Overview
  This migration adds comprehensive features for quotation management, expense tracking, and audit trails.
  
  ## 1. Quotation Enhancements
  ### New Columns:
    - `service_charges` (numeric) - Additional service-related charges
    - `external_charges` (numeric) - External vendor or third-party charges
    - `total_charges` (numeric) - Sum of all charges (base + service + external)
    - `approval_status` (text) - Tracks quotation approval state (draft, pending, approved, revised)
    - `approved_by` (uuid) - References user who approved the quotation
    - `approved_at` (timestamptz) - Timestamp of approval
    - `service_date` (date) - Scheduled service/delivery date for calendar integration
    - `version` (integer) - Version number for tracking edits
    - `company_details` (jsonb) - Store company info for PDF generation
    - `remarks` (text) - Additional notes or remarks
    - `validity_days` (integer) - Number of days quotation is valid (default 30)
  
  ## 2. Quotation Version History
  ### New Table: `quotation_versions`
    - Tracks all edits made to quotations
    - Stores complete snapshot of quotation at each version
    - Includes audit trail (who, when, why)
  
  ## 3. Order Expenses
  ### New Table: `expenses`
    - Track expenses for each booked order
    - Categories: internal, external, miscellaneous
    - Support for notes and document URLs
    - Linked to quotations for financial tracking
  
  ## 4. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their data
*/

-- Add new columns to quotations table
DO $$
BEGIN
  -- Service and external charges
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'service_charges'
  ) THEN
    ALTER TABLE quotations ADD COLUMN service_charges numeric(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'external_charges'
  ) THEN
    ALTER TABLE quotations ADD COLUMN external_charges numeric(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'total_charges'
  ) THEN
    ALTER TABLE quotations ADD COLUMN total_charges numeric(10,2) DEFAULT 0;
  END IF;
  
  -- Approval workflow fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE quotations ADD COLUMN approval_status text DEFAULT 'draft';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE quotations ADD COLUMN approved_by uuid REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE quotations ADD COLUMN approved_at timestamptz;
  END IF;
  
  -- Calendar and scheduling
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'service_date'
  ) THEN
    ALTER TABLE quotations ADD COLUMN service_date date;
  END IF;
  
  -- Versioning and metadata
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'version'
  ) THEN
    ALTER TABLE quotations ADD COLUMN version integer DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'company_details'
  ) THEN
    ALTER TABLE quotations ADD COLUMN company_details jsonb DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'remarks'
  ) THEN
    ALTER TABLE quotations ADD COLUMN remarks text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'validity_days'
  ) THEN
    ALTER TABLE quotations ADD COLUMN validity_days integer DEFAULT 30;
  END IF;
END $$;

-- Create quotation_versions table for audit trail
CREATE TABLE IF NOT EXISTS quotation_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  version integer NOT NULL,
  quotation_data jsonb NOT NULL,
  edited_by uuid NOT NULL REFERENCES auth.users(id),
  edited_at timestamptz DEFAULT now(),
  edit_reason text,
  changes_summary text,
  created_at timestamptz DEFAULT now()
);

-- Create expenses table for order-level expense tracking
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('internal', 'external', 'miscellaneous')),
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  expense_date date DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  document_url text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quotation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quotation_versions
CREATE POLICY "Users can view quotation version history"
  ON quotation_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create quotation versions"
  ON quotation_versions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = edited_by);

-- RLS Policies for expenses
CREATE POLICY "Users can view expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotation_versions_quotation_id ON quotation_versions(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_versions_version ON quotation_versions(quotation_id, version);
CREATE INDEX IF NOT EXISTS idx_expenses_quotation_id ON expenses(quotation_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_quotations_approval_status ON quotations(approval_status);
CREATE INDEX IF NOT EXISTS idx_quotations_service_date ON quotations(service_date);

-- Create trigger for expenses updated_at
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expenses_updated_at_trigger
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expenses_updated_at();

-- Function to create a version snapshot before updating quotation
CREATE OR REPLACE FUNCTION create_quotation_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if significant fields changed
  IF (OLD.subtotal != NEW.subtotal OR 
      OLD.tax != NEW.tax OR 
      OLD.total_amount != NEW.total_amount OR
      OLD.service_charges != NEW.service_charges OR
      OLD.external_charges != NEW.external_charges OR
      OLD.items::text != NEW.items::text) THEN
    
    INSERT INTO quotation_versions (
      quotation_id,
      version,
      quotation_data,
      edited_by,
      edit_reason
    ) VALUES (
      OLD.id,
      OLD.version,
      row_to_json(OLD)::jsonb,
      NEW.user_id,
      'Quotation updated'
    );
    
    NEW.version = OLD.version + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotation_version_trigger
  BEFORE UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION create_quotation_version();