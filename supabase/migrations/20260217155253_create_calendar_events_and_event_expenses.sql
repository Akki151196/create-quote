/*
  # Create Calendar Events and Event Expenses Schema
  
  1. New Tables
    - `calendar_events` - Calendar events linked to quotations
    - `event_expenses` - Expense tracking for calendar events
    - `event_expense_items` - Individual expense line items
      
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    
  3. Triggers
    - Auto-calculate expense totals and profit
*/

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid REFERENCES quotations(id) ON DELETE SET NULL,
  event_name text NOT NULL,
  event_date date NOT NULL,
  event_type text NOT NULL DEFAULT 'Other',
  client_name text NOT NULL,
  client_phone text NOT NULL,
  venue text,
  guest_count integer DEFAULT 0,
  total_revenue numeric(12,2) DEFAULT 0,
  status text DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'In Progress', 'Completed', 'Cancelled')),
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create event_expenses table
CREATE TABLE IF NOT EXISTS event_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE,
  quotation_id uuid REFERENCES quotations(id) ON DELETE SET NULL,
  total_expenses numeric(12,2) DEFAULT 0,
  profit numeric(12,2) DEFAULT 0,
  profit_percentage numeric(5,2) DEFAULT 0,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partial', 'Complete')),
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create event_expense_items table
CREATE TABLE IF NOT EXISTS event_expense_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid REFERENCES event_expenses(id) ON DELETE CASCADE NOT NULL,
  vendor_name text NOT NULL,
  category text NOT NULL DEFAULT 'Other' CHECK (category IN ('Food', 'Decoration', 'Staff', 'Venue', 'Transport', 'Other')),
  amount numeric(12,2) NOT NULL DEFAULT 0,
  bill_url text,
  bill_file_name text,
  payment_date date,
  payment_method text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_quotation_id ON calendar_events(quotation_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_date ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_event_expenses_event_id ON event_expenses(event_id);
CREATE INDEX IF NOT EXISTS idx_event_expenses_quotation_id ON event_expenses(quotation_id);
CREATE INDEX IF NOT EXISTS idx_event_expense_items_expense_id ON event_expense_items(expense_id);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_expense_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_events
CREATE POLICY "Users can view own calendar events"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create own calendar events"
  ON calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own calendar events"
  ON calendar_events FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own calendar events"
  ON calendar_events FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for event_expenses
CREATE POLICY "Users can view own event expenses"
  ON event_expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create own event expenses"
  ON event_expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own event expenses"
  ON event_expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own event expenses"
  ON event_expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for event_expense_items
CREATE POLICY "Users can view event expense items"
  ON event_expense_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_expenses
      WHERE event_expenses.id = event_expense_items.expense_id
      AND event_expenses.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create event expense items"
  ON event_expense_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_expenses
      WHERE event_expenses.id = event_expense_items.expense_id
      AND event_expenses.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update event expense items"
  ON event_expense_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_expenses
      WHERE event_expenses.id = event_expense_items.expense_id
      AND event_expenses.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete event expense items"
  ON event_expense_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_expenses
      WHERE event_expenses.id = event_expense_items.expense_id
      AND event_expenses.created_by = auth.uid()
    )
  );

-- Function to update event expense totals
CREATE OR REPLACE FUNCTION update_event_expense_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_expense_id uuid;
  v_revenue numeric;
BEGIN
  -- Determine expense_id
  IF TG_OP = 'DELETE' THEN
    v_expense_id := OLD.expense_id;
  ELSE
    v_expense_id := NEW.expense_id;
  END IF;
  
  -- Update total_expenses
  UPDATE event_expenses
  SET 
    total_expenses = (
      SELECT COALESCE(SUM(amount), 0)
      FROM event_expense_items
      WHERE expense_id = v_expense_id
    ),
    updated_at = now()
  WHERE id = v_expense_id;
  
  -- Get revenue and update profit calculations
  SELECT COALESCE(
    (SELECT total_revenue FROM calendar_events WHERE id = e.event_id), 0
  ) INTO v_revenue
  FROM event_expenses e
  WHERE e.id = v_expense_id;
  
  UPDATE event_expenses e
  SET 
    profit = v_revenue - e.total_expenses,
    profit_percentage = CASE 
      WHEN v_revenue > 0 
      THEN ((v_revenue - e.total_expenses) / v_revenue * 100)
      ELSE 0
    END,
    updated_at = now()
  WHERE id = v_expense_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger for event expense totals
DROP TRIGGER IF EXISTS trigger_update_event_expense_totals ON event_expense_items;
CREATE TRIGGER trigger_update_event_expense_totals
AFTER INSERT OR UPDATE OR DELETE ON event_expense_items
FOR EACH ROW
EXECUTE FUNCTION update_event_expense_totals();

-- Function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON calendar_events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();

DROP TRIGGER IF EXISTS update_event_expenses_updated_at ON event_expenses;
CREATE TRIGGER update_event_expenses_updated_at
BEFORE UPDATE ON event_expenses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();

DROP TRIGGER IF EXISTS update_event_expense_items_updated_at ON event_expense_items;
CREATE TRIGGER update_event_expense_items_updated_at
BEFORE UPDATE ON event_expense_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_timestamp();