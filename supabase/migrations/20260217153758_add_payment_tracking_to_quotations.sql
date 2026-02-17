/*
  # Add Payment Tracking to Quotations

  1. Changes
    - Add `advance_paid` column to track advance payments received
    - Add `balance_due` column to track remaining balance
    - Add `payment_status` column to track payment completion status
    
  2. Details
    - `advance_paid` (numeric): Amount paid in advance, defaults to 0
    - `balance_due` (numeric): Remaining balance to be paid, defaults to 0
    - `payment_status` (text): Status of payment - 'pending', 'partial', 'paid', defaults to 'pending'
*/

-- Add payment tracking columns to quotations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'advance_paid'
  ) THEN
    ALTER TABLE quotations ADD COLUMN advance_paid numeric(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'balance_due'
  ) THEN
    ALTER TABLE quotations ADD COLUMN balance_due numeric(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE quotations ADD COLUMN payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid'));
  END IF;
END $$;