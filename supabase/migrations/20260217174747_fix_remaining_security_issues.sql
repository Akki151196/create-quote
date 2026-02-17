/*
  # Fix Remaining Security and Performance Issues

  ## Overview
  This migration addresses security and performance issues identified after the previous optimization:
  - Re-adds necessary foreign key indexes that were previously dropped but are needed
  - Optimizes company_settings RLS policies to use (select auth.uid())
  - Fixes company_settings function search path security
  - Documents intentional "always true" RLS policies for single-tenant architecture

  ## Changes

  ### 1. Re-add Necessary Foreign Key Indexes
  These indexes were dropped as "unused" but are actually needed for:
  - Foreign key constraint performance
  - Join query optimization
  - Query planner efficiency
  
  ### 2. Optimize company_settings RLS Policies
  Updates policies to use (select auth.uid()) to prevent re-evaluation per row.
  
  ### 3. Fix company_settings Function Security
  Sets immutable search_path on the trigger function to prevent injection.

  ## Security Notes

  ### Single-Tenant Architecture
  This application uses a single-tenant architecture where:
  - Each database instance serves ONE business/caterer
  - All authenticated users are staff members of that single business
  - Resources like menu_categories, menu_items, packages are shared across all staff
  
  Therefore, "RLS Policy Always True" warnings for these tables are INTENTIONAL:
  - menu_categories: Shared category list (Appetizers, Main Course, etc.)
  - menu_items: Shared menu item library
  - packages: Shared package templates
  - menu_template_items, package_items: Related to shared resources
  
  These policies use `USING (true)` because all authenticated staff should access shared resources.
  
  ### User-Specific Data
  Tables with user-specific data (clients, quotations, payments) DO have proper ownership checks
  using created_by columns and auth.uid() verification.
*/

-- =====================================================
-- PART 1: RE-ADD NECESSARY FOREIGN KEY INDEXES
-- =====================================================

-- These indexes improve foreign key constraint checks and join performance

-- calendar_events indexes (needed for joins and lookups)
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_quotation_id ON calendar_events(quotation_id);

-- clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);

-- event_expenses indexes
CREATE INDEX IF NOT EXISTS idx_event_expenses_event_id ON event_expenses(event_id);
CREATE INDEX IF NOT EXISTS idx_event_expenses_quotation_id ON event_expenses(quotation_id);

-- expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_quotation_id ON expenses(quotation_id);

-- menu_items indexes (needed for category filtering)
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);

-- menu_template_items indexes (needed for joins)
CREATE INDEX IF NOT EXISTS idx_menu_template_items_menu_item_id ON menu_template_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_template_items_template_id ON menu_template_items(template_id);

-- menu_templates indexes
CREATE INDEX IF NOT EXISTS idx_menu_templates_created_by ON menu_templates(created_by);

-- package_items indexes (needed for package queries)
CREATE INDEX IF NOT EXISTS idx_package_items_package_id ON package_items(package_id);

-- packages indexes
CREATE INDEX IF NOT EXISTS idx_packages_created_by ON packages(created_by);

-- payments indexes (needed for quotation lookups)
CREATE INDEX IF NOT EXISTS idx_payments_created_by ON payments(created_by);
CREATE INDEX IF NOT EXISTS idx_payments_quotation_id ON payments(quotation_id);

-- quotation_responses indexes
CREATE INDEX IF NOT EXISTS idx_quotation_responses_quotation_id ON quotation_responses(quotation_id);

-- quotation_versions indexes
CREATE INDEX IF NOT EXISTS idx_quotation_versions_edited_by ON quotation_versions(edited_by);
CREATE INDEX IF NOT EXISTS idx_quotation_versions_quotation_id ON quotation_versions(quotation_id);

-- quotations indexes
CREATE INDEX IF NOT EXISTS idx_quotations_approved_by ON quotations(approved_by);
CREATE INDEX IF NOT EXISTS idx_quotations_created_by ON quotations(created_by);

-- =====================================================
-- PART 2: OPTIMIZE COMPANY_SETTINGS RLS POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own settings" ON company_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON company_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON company_settings;

-- Recreate with optimized auth function calls
CREATE POLICY "Users can view own settings"
  ON company_settings
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own settings"
  ON company_settings
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own settings"
  ON company_settings
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- =====================================================
-- PART 3: FIX COMPANY_SETTINGS FUNCTION SEARCH PATH
-- =====================================================

-- Drop and recreate the function with proper search_path
DROP TRIGGER IF EXISTS update_company_settings_timestamp ON company_settings;
DROP FUNCTION IF EXISTS update_company_settings_updated_at();

CREATE OR REPLACE FUNCTION update_company_settings_updated_at()
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

-- Recreate the trigger
CREATE TRIGGER update_company_settings_timestamp
  BEFORE UPDATE ON company_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_company_settings_updated_at();

-- =====================================================
-- NOTES ON REMAINING WARNINGS
-- =====================================================

/*
  The following warnings are INTENTIONAL and do not need fixing:

  1. "RLS Policy Always True" for shared resource tables:
     - menu_categories
     - menu_items  
     - menu_template_items
     - package_items
     - packages (when used as templates)
     
     These are shared across all staff in the single-tenant system.
     
  2. "Auth DB Connection Strategy is not Percentage":
     This requires manual configuration in Supabase Dashboard:
     - Go to Settings > Database
     - Change Auth pooling mode from fixed to percentage-based
     
  3. "Leaked Password Protection Disabled":
     This requires manual configuration in Supabase Dashboard:
     - Go to Authentication > Providers > Email
     - Enable "Check for leaked passwords (HaveIBeenPwned)"
     
  4. "Unused Index" warnings:
     - idx_event_expenses_created_by: Actually used, keep it
     - idx_company_settings_user_id: Actually used for lookups, keep it
     
     These indexes may show as "unused" initially but will be used as data grows.
*/
