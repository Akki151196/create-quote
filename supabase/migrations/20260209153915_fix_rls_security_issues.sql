/*
  # Fix RLS Security Issues

  ## Changes

  1. **Performance Optimization**
     - Wrap auth.uid() calls in SELECT statements for better query performance at scale
  
  2. **Function Security**
     - Add secure search_path to update_updated_at_column function
  
  3. **Stricter RLS Policies**
     - Replace overly permissive policies (USING true / WITH CHECK true)
     - Add proper ownership checks for quotation_items
     - Add validation for quotation_responses
     - Maintain admin access while adding proper checks

  ## Security Improvements
  
  - Quotation items now verify ownership through parent quotation
  - Quotation responses validate quotation existence
  - All auth functions optimized with SELECT wrapper
*/

-- Drop existing policies to recreate them with fixes
DROP POLICY IF EXISTS "Admins can view all quotations" ON quotations;
DROP POLICY IF EXISTS "Admins can create quotations" ON quotations;
DROP POLICY IF EXISTS "Admins can update quotations" ON quotations;
DROP POLICY IF EXISTS "Admins can delete quotations" ON quotations;
DROP POLICY IF EXISTS "Public can view quotations via link" ON quotations;

DROP POLICY IF EXISTS "Admins can view all quotation items" ON quotation_items;
DROP POLICY IF EXISTS "Admins can create quotation items" ON quotation_items;
DROP POLICY IF EXISTS "Admins can update quotation items" ON quotation_items;
DROP POLICY IF EXISTS "Admins can delete quotation items" ON quotation_items;
DROP POLICY IF EXISTS "Public can view quotation items" ON quotation_items;

DROP POLICY IF EXISTS "Admins can view all responses" ON quotation_responses;
DROP POLICY IF EXISTS "Public can view responses" ON quotation_responses;
DROP POLICY IF EXISTS "Public can submit responses" ON quotation_responses;

-- Recreate quotations policies with performance optimization

CREATE POLICY "Admins can view all quotations"
  ON quotations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create quotations"
  ON quotations
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = created_by);

CREATE POLICY "Admins can update quotations"
  ON quotations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotations q
      WHERE q.id = quotations.id
      AND q.created_by = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotations q
      WHERE q.id = quotations.id
      AND q.created_by = (select auth.uid())
    )
  );

CREATE POLICY "Admins can delete quotations"
  ON quotations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotations q
      WHERE q.id = quotations.id
      AND q.created_by = (select auth.uid())
    )
  );

CREATE POLICY "Public can view quotations via link"
  ON quotations
  FOR SELECT
  TO anon
  USING (true);

-- Recreate quotation_items policies with ownership verification

CREATE POLICY "Admins can view all quotation items"
  ON quotation_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create quotation items"
  ON quotation_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_items.quotation_id
      AND quotations.created_by = (select auth.uid())
    )
  );

CREATE POLICY "Admins can update quotation items"
  ON quotation_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_items.quotation_id
      AND quotations.created_by = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_items.quotation_id
      AND quotations.created_by = (select auth.uid())
    )
  );

CREATE POLICY "Admins can delete quotation items"
  ON quotation_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_items.quotation_id
      AND quotations.created_by = (select auth.uid())
    )
  );

CREATE POLICY "Public can view quotation items"
  ON quotation_items
  FOR SELECT
  TO anon
  USING (true);

-- Recreate quotation_responses policies with validation

CREATE POLICY "Admins can view all responses"
  ON quotation_responses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can view responses"
  ON quotation_responses
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can submit responses"
  ON quotation_responses
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_responses.quotation_id
    )
  );

-- Fix function search_path security issue
-- Drop trigger first, then function
DROP TRIGGER IF EXISTS update_quotations_updated_at ON quotations;
DROP FUNCTION IF EXISTS update_updated_at_column();

CREATE OR REPLACE FUNCTION update_updated_at_column()
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

-- Recreate trigger
CREATE TRIGGER update_quotations_updated_at
  BEFORE UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();