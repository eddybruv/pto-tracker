-- Migration: Rename hours-based columns to days-based
-- The system now tracks PTO in full days instead of hours

-- ============ policies ============
ALTER TABLE policies RENAME COLUMN min_increment_hours TO min_increment_days;

-- ============ pto_balances ============
ALTER TABLE pto_balances RENAME COLUMN available_hours TO available_days;
ALTER TABLE pto_balances RENAME COLUMN pending_hours TO pending_days;
ALTER TABLE pto_balances RENAME COLUMN carryover_hours TO carryover_days;

-- ============ balance_ledger ============
ALTER TABLE balance_ledger RENAME COLUMN hours TO days;

-- ============ pto_requests ============
ALTER TABLE pto_requests RENAME COLUMN total_hours TO total_days;

-- ============ Convert existing data from hours to days (divide by 8) ============

UPDATE policies SET
  accrual_rate = accrual_rate / 8,
  max_accrual = max_accrual / 8,
  carryover_cap = carryover_cap / 8,
  max_negative = max_negative / 8,
  min_increment_days = min_increment_days / 8;

UPDATE pto_balances SET
  available_days = available_days / 8,
  pending_days = pending_days / 8,
  used_ytd = used_ytd / 8,
  accrued_ytd = accrued_ytd / 8,
  carryover_days = carryover_days / 8;

UPDATE balance_ledger SET
  days = days / 8,
  running_balance = running_balance / 8;

UPDATE pto_requests SET
  total_days = total_days / 8;
