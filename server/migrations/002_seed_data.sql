-- Migration: Seed data for development and testing
-- Run after 001_initial_schema.sql

-- ============ Teams ============

INSERT INTO teams (id, name, code) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'Frontend', 'FE'),
    ('a1000000-0000-0000-0000-000000000002', 'Backend', 'BE');

-- ============ Users ============
-- All passwords: "Admin123!" (bcrypt hash)

INSERT INTO users (id, email, password_hash, first_name, last_name, hire_date, timezone, team_id, status) VALUES
    ('b1000000-0000-0000-0000-000000000001', 'alice.martin@company.com',
     '$2a$12$LJ3m4ys3Lk0TSwMCkGKNKePsInGCfJGnwcayAh7mWh3l9S1eCq0Wy',
     'Alice', 'Martin', '2024-01-15', 'America/Toronto', NULL, 'active'),
    ('b1000000-0000-0000-0000-000000000002', 'bob.tremblay@company.com',
     '$2a$12$LJ3m4ys3Lk0TSwMCkGKNKePsInGCfJGnwcayAh7mWh3l9S1eCq0Wy',
     'Bob', 'Tremblay', '2024-03-01', 'America/Toronto', 'a1000000-0000-0000-0000-000000000001', 'active'),
    ('b1000000-0000-0000-0000-000000000003', 'clara.roy@company.com',
     '$2a$12$LJ3m4ys3Lk0TSwMCkGKNKePsInGCfJGnwcayAh7mWh3l9S1eCq0Wy',
     'Clara', 'Roy', '2024-06-10', 'America/Toronto', 'a1000000-0000-0000-0000-000000000002', 'active');

-- Set team leads
UPDATE teams SET lead_id = 'b1000000-0000-0000-0000-000000000002' WHERE code = 'FE';
UPDATE teams SET lead_id = 'b1000000-0000-0000-0000-000000000003' WHERE code = 'BE';

-- Set manager relationships
UPDATE users SET manager_id = 'b1000000-0000-0000-0000-000000000001' WHERE id IN (
    'b1000000-0000-0000-0000-000000000002',
    'b1000000-0000-0000-0000-000000000003'
);

-- ============ User Roles ============

-- Alice = admin
INSERT INTO user_roles (user_id, role_id)
    SELECT 'b1000000-0000-0000-0000-000000000001', id FROM roles WHERE name = 'admin';

-- Bob = tech_lead
INSERT INTO user_roles (user_id, role_id)
    SELECT 'b1000000-0000-0000-0000-000000000002', id FROM roles WHERE name = 'tech_lead';

-- Clara = developer
INSERT INTO user_roles (user_id, role_id)
    SELECT 'b1000000-0000-0000-0000-000000000003', id FROM roles WHERE name = 'developer';

-- ============ Policies ============

INSERT INTO policies (id, name, pto_type_id, accrual_rate, accrual_frequency, max_accrual, carryover_cap, carryover_expiry_months, probation_days, min_increment_hours) VALUES
    -- Vacation: 10 hrs/month, max 200, carryover 40 hrs
    ('c1000000-0000-0000-0000-000000000001', 'Standard Vacation',
     (SELECT id FROM pto_types WHERE code = 'VAC'),
     10, 'monthly', 200, 40, 3, 90, 4),
    -- Sick: 6.67 hrs/month, max 80, no carryover
    ('c1000000-0000-0000-0000-000000000002', 'Standard Sick Leave',
     (SELECT id FROM pto_types WHERE code = 'SICK'),
     6.67, 'monthly', 80, 0, NULL, 0, 1),
    -- Personal: 3.33 hrs/month, max 40, no carryover
    ('c1000000-0000-0000-0000-000000000003', 'Standard Personal',
     (SELECT id FROM pto_types WHERE code = 'PERS'),
     3.33, 'monthly', 40, 0, NULL, 0, 4);

-- ============ Policy Assignments ============

INSERT INTO policy_assignments (user_id, policy_id, effective_date)
    SELECT u.id, p.id, u.hire_date
    FROM users u
    CROSS JOIN policies p
    WHERE u.deleted_at IS NULL;

-- ============ PTO Balances ============

-- Alice (hired 2024-01-15) — ~14 months accrued by Mar 2025
INSERT INTO pto_balances (user_id, pto_type_id, policy_id, available_hours, pending_hours, used_ytd, accrued_ytd, carryover_hours) VALUES
    ('b1000000-0000-0000-0000-000000000001', (SELECT id FROM pto_types WHERE code = 'VAC'), 'c1000000-0000-0000-0000-000000000001', 96, 0, 24, 120, 0),
    ('b1000000-0000-0000-0000-000000000001', (SELECT id FROM pto_types WHERE code = 'SICK'), 'c1000000-0000-0000-0000-000000000002', 73.33, 0, 0, 73.33, 0),
    ('b1000000-0000-0000-0000-000000000001', (SELECT id FROM pto_types WHERE code = 'PERS'), 'c1000000-0000-0000-0000-000000000003', 33.30, 0, 8, 40, 0);

-- Bob (hired 2024-03-01) — ~12 months accrued
INSERT INTO pto_balances (user_id, pto_type_id, policy_id, available_hours, pending_hours, used_ytd, accrued_ytd, carryover_hours) VALUES
    ('b1000000-0000-0000-0000-000000000002', (SELECT id FROM pto_types WHERE code = 'VAC'), 'c1000000-0000-0000-0000-000000000001', 80, 16, 16, 100, 0),
    ('b1000000-0000-0000-0000-000000000002', (SELECT id FROM pto_types WHERE code = 'SICK'), 'c1000000-0000-0000-0000-000000000002', 60, 0, 6.67, 66.70, 0),
    ('b1000000-0000-0000-0000-000000000002', (SELECT id FROM pto_types WHERE code = 'PERS'), 'c1000000-0000-0000-0000-000000000003', 26.64, 0, 0, 26.64, 0);

-- Clara (hired 2024-06-10) — ~9 months accrued
INSERT INTO pto_balances (user_id, pto_type_id, policy_id, available_hours, pending_hours, used_ytd, accrued_ytd, carryover_hours) VALUES
    ('b1000000-0000-0000-0000-000000000003', (SELECT id FROM pto_types WHERE code = 'VAC'), 'c1000000-0000-0000-0000-000000000001', 64, 8, 8, 80, 0),
    ('b1000000-0000-0000-0000-000000000003', (SELECT id FROM pto_types WHERE code = 'SICK'), 'c1000000-0000-0000-0000-000000000002', 53.36, 0, 0, 53.36, 0),
    ('b1000000-0000-0000-0000-000000000003', (SELECT id FROM pto_types WHERE code = 'PERS'), 'c1000000-0000-0000-0000-000000000003', 23.31, 0, 0, 23.31, 0);

-- ============ Sample PTO Requests ============

-- Clara: approved vacation (past)
INSERT INTO pto_requests (id, user_id, pto_type_id, start_date, end_date, total_hours, notes, status) VALUES
    ('d1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003',
     (SELECT id FROM pto_types WHERE code = 'VAC'),
     '2026-01-05', '2026-01-06', 8, 'Family visit', 'approved');

-- Bob: pending vacation request
INSERT INTO pto_requests (id, user_id, pto_type_id, start_date, end_date, total_hours, notes, status) VALUES
    ('d1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002',
     (SELECT id FROM pto_types WHERE code = 'VAC'),
     '2026-04-13', '2026-04-14', 16, 'Spring break trip', 'pending');

-- Clara: pending vacation request
INSERT INTO pto_requests (id, user_id, pto_type_id, start_date, end_date, total_hours, notes, status) VALUES
    ('d1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003',
     (SELECT id FROM pto_types WHERE code = 'VAC'),
     '2026-06-22', '2026-06-23', 8, 'Moving day', 'pending');

-- Alice: approved personal day (past)
INSERT INTO pto_requests (id, user_id, pto_type_id, start_date, end_date, total_hours, notes, status) VALUES
    ('d1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001',
     (SELECT id FROM pto_types WHERE code = 'PERS'),
     '2026-02-20', '2026-02-20', 8, 'Appointment', 'approved');

-- ============ Approvals ============

-- Clara's approved request — approved by Bob (tech lead)
INSERT INTO approvals (request_id, approver_id, status, comment, responded_at) VALUES
    ('d1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002',
     'approved', 'Enjoy!', '2025-12-20 10:00:00-05');

-- Bob's pending request — awaiting Alice (admin) approval
INSERT INTO approvals (request_id, approver_id, status) VALUES
    ('d1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'pending');

-- Clara's pending request — awaiting Bob (tech lead) approval
INSERT INTO approvals (request_id, approver_id, status) VALUES
    ('d1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002', 'pending');

-- Alice's approved request — self-approved (admin)
INSERT INTO approvals (request_id, approver_id, status, responded_at) VALUES
    ('d1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001',
     'approved', '2026-02-18 09:00:00-05');

-- ============ Quebec Holidays 2026 ============

INSERT INTO holidays (name, date, is_recurring, recurrence_rule) VALUES
    ('New Year''s Day',              '2026-01-01', TRUE,  'RRULE:FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1'),
    ('Good Friday',                  '2026-04-03', FALSE, NULL),
    ('Easter Monday',                '2026-04-06', FALSE, NULL),
    ('National Patriots'' Day',      '2026-05-18', FALSE, NULL),
    ('Saint-Jean-Baptiste Day',      '2026-06-24', TRUE,  'RRULE:FREQ=YEARLY;BYMONTH=6;BYMONTHDAY=24'),
    ('Canada Day',                   '2026-07-01', TRUE,  'RRULE:FREQ=YEARLY;BYMONTH=7;BYMONTHDAY=1'),
    ('Labour Day',                   '2026-09-07', FALSE, NULL),
    ('National Day for Truth and Reconciliation', '2026-09-30', TRUE, 'RRULE:FREQ=YEARLY;BYMONTH=9;BYMONTHDAY=30'),
    ('Thanksgiving',                 '2026-10-12', FALSE, NULL),
    ('Christmas Day',                '2026-12-25', TRUE,  'RRULE:FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25');

-- ============ Quebec Holidays 2027 ============

INSERT INTO holidays (name, date, is_recurring, recurrence_rule) VALUES
    ('New Year''s Day',              '2027-01-01', TRUE,  'RRULE:FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1'),
    ('Good Friday',                  '2027-03-26', FALSE, NULL),
    ('Easter Monday',                '2027-03-29', FALSE, NULL),
    ('National Patriots'' Day',      '2027-05-24', FALSE, NULL),
    ('Saint-Jean-Baptiste Day',      '2027-06-24', TRUE,  'RRULE:FREQ=YEARLY;BYMONTH=6;BYMONTHDAY=24'),
    ('Canada Day',                   '2027-07-01', TRUE,  'RRULE:FREQ=YEARLY;BYMONTH=7;BYMONTHDAY=1'),
    ('Labour Day',                   '2027-09-06', FALSE, NULL),
    ('National Day for Truth and Reconciliation', '2027-09-30', TRUE, 'RRULE:FREQ=YEARLY;BYMONTH=9;BYMONTHDAY=30'),
    ('Thanksgiving',                 '2027-10-11', FALSE, NULL),
    ('Christmas Day',                '2027-12-25', TRUE,  'RRULE:FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25');
