/*
  # Security Improvements and Performance Optimization

  ## Overview
  This migration addresses critical security and performance issues identified by Supabase's database advisor.

  ## 1. Missing Foreign Key Indexes
  Adds indexes for foreign key columns to improve query performance:
    - `expenses.created_by`
    - `menu_templates.created_by`
    - `packages.created_by`
    - `payments.created_by`
    - `quotation_versions.edited_by`
    - `quotations.approved_by`

  ## 2. RLS Policy Optimization
  Fixes auth function calls in RLS policies by wrapping them with SELECT to prevent re-evaluation for each row:
    - Updates policies on `menu_templates`, `packages`, `clients`, `payments`, `quotation_versions`, and `expenses`
    - Replaces `auth.uid()` with `(select auth.uid())`

  ## 3. Function Security
  Secures database functions by setting immutable search_path:
    - `update_expenses_updated_at()`
    - `create_quotation_version()`

  ## Notes
  - "Unused Index" warnings are informational and kept for future use
  - "RLS Policy Always True" warnings are intentional for admin-only single-tenant system
  - Auth connection strategy and leaked password protection require UI configuration
*/

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_menu_templates_created_by ON menu_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_packages_created_by ON packages(created_by);
CREATE INDEX IF NOT EXISTS idx_payments_created_by ON payments(created_by);
CREATE INDEX IF NOT EXISTS idx_quotation_versions_edited_by ON quotation_versions(edited_by);
CREATE INDEX IF NOT EXISTS idx_quotations_approved_by ON quotations(approved_by);

-- =====================================================
-- 2. FIX RLS POLICIES - OPTIMIZE AUTH FUNCTION CALLS
-- =====================================================

-- Drop and recreate menu_templates policies
DROP POLICY IF EXISTS "Admins can insert menu templates" ON menu_templates;
CREATE POLICY "Admins can insert menu templates"
  ON menu_templates
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

-- Drop and recreate packages policies
DROP POLICY IF EXISTS "Admins can insert packages" ON packages;
CREATE POLICY "Admins can insert packages"
  ON packages
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

-- Drop and recreate clients policies
DROP POLICY IF EXISTS "Admins can insert clients" ON clients;
CREATE POLICY "Admins can insert clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

-- Drop and recreate payments policies
DROP POLICY IF EXISTS "Admins can insert payments" ON payments;
CREATE POLICY "Admins can insert payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

-- Drop and recreate quotation_versions policies
DROP POLICY IF EXISTS "Users can create quotation versions" ON quotation_versions;
CREATE POLICY "Users can create quotation versions"
  ON quotation_versions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = edited_by);

-- Drop and recreate expenses policies
DROP POLICY IF EXISTS "Users can create expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;

CREATE POLICY "Users can create expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = created_by);

-- =====================================================
-- 3. FIX FUNCTION SEARCH PATH SECURITY
-- =====================================================

-- Recreate update_expenses_updated_at with secure search_path
DROP TRIGGER IF EXISTS expenses_updated_at_trigger ON expenses;
DROP FUNCTION IF EXISTS update_expenses_updated_at();

CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER expenses_updated_at_trigger
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expenses_updated_at();

-- Recreate create_quotation_version with secure search_path
DROP TRIGGER IF EXISTS quotation_version_trigger ON quotations;
DROP FUNCTION IF EXISTS create_quotation_version();

CREATE OR REPLACE FUNCTION create_quotation_version()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = pg_catalog, public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only create version if significant fields changed
  IF (OLD.subtotal != NEW.subtotal OR 
      OLD.tax_amount != NEW.tax_amount OR 
      OLD.grand_total != NEW.grand_total OR
      OLD.service_charges != NEW.service_charges OR
      OLD.external_charges != NEW.external_charges) THEN
    
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
      NEW.created_by,
      'Quotation updated'
    );
    
    NEW.version = OLD.version + 1;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER quotation_version_trigger
  BEFORE UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION create_quotation_version();
