-- Migration: Create initial schema for PTO Tracker
-- Run with: npm run db:migrate

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============ ENUM Types ============

CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'denied', 'cancelled');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'denied');
CREATE TYPE accrual_frequency AS ENUM ('weekly', 'biweekly', 'monthly', 'quarterly', 'annually');
CREATE TYPE ledger_txn_type AS ENUM ('accrual', 'debit', 'adjustment', 'carryover', 'expiration');

-- ============ Roles ============

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default roles (simplified for 18-developer startup)
INSERT INTO roles (name, description, permissions, is_system) VALUES
    ('developer', 'Standard developer', '["pto:request", "pto:view_own", "pto:view_team_calendar"]', TRUE),
    ('tech_lead', 'Tech lead / approver', '["pto:request", "pto:view_own", "pto:view_team", "pto:approve"]', TRUE),
    ('admin', 'Rotating admin (any dev)', '["pto:*", "users:*", "policies:*", "reports:*"]', TRUE);

-- ============ Teams (optional) ============

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    lead_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ Users ============

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    avatar_url TEXT,
    manager_id UUID REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    hire_date DATE NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
    status user_status NOT NULL DEFAULT 'active',
    last_login_at TIMESTAMPTZ,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Add team lead foreign key
ALTER TABLE teams ADD CONSTRAINT fk_team_lead FOREIGN KEY (lead_id) REFERENCES users(id);

-- User roles junction table
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    PRIMARY KEY (user_id, role_id)
);

-- Refresh tokens for JWT
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ PTO Types ============

CREATE TABLE pto_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    is_paid BOOLEAN NOT NULL DEFAULT TRUE,
    requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default PTO types
INSERT INTO pto_types (name, code, color, is_paid, requires_approval) VALUES
    ('Vacation', 'VAC', '#10B981', TRUE, TRUE),
    ('Sick Leave', 'SICK', '#EF4444', TRUE, TRUE),
    ('Personal', 'PERS', '#8B5CF6', TRUE, TRUE);

-- ============ Policies ============

CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    pto_type_id UUID NOT NULL REFERENCES pto_types(id),
    accrual_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    accrual_frequency accrual_frequency NOT NULL DEFAULT 'monthly',
    max_accrual DECIMAL(6,2),
    carryover_cap DECIMAL(6,2),
    carryover_expiry_months INTEGER,
    allow_negative BOOLEAN NOT NULL DEFAULT FALSE,
    max_negative DECIMAL(5,2) NOT NULL DEFAULT 0,
    probation_days INTEGER NOT NULL DEFAULT 0,
    min_increment_days DECIMAL(3,1) NOT NULL DEFAULT 1.0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Policy assignments
CREATE TABLE policy_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES policies(id),
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, policy_id, effective_date)
);

-- ============ Balances ============

CREATE TABLE pto_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pto_type_id UUID NOT NULL REFERENCES pto_types(id),
    policy_id UUID NOT NULL REFERENCES policies(id),
    available_days DECIMAL(6,2) NOT NULL DEFAULT 0,
    pending_days DECIMAL(6,2) NOT NULL DEFAULT 0,
    used_ytd DECIMAL(6,2) NOT NULL DEFAULT 0,
    accrued_ytd DECIMAL(6,2) NOT NULL DEFAULT 0,
    carryover_days DECIMAL(6,2) NOT NULL DEFAULT 0,
    carryover_expires DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, pto_type_id)
);

-- Balance ledger for audit trail
CREATE TABLE balance_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    pto_type_id UUID NOT NULL REFERENCES pto_types(id),
    transaction_type ledger_txn_type NOT NULL,
    days DECIMAL(6,2) NOT NULL,
    running_balance DECIMAL(6,2) NOT NULL,
    effective_date DATE NOT NULL,
    request_id UUID,
    adjusted_by UUID REFERENCES users(id),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ PTO Requests ============

CREATE TABLE pto_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    pto_type_id UUID NOT NULL REFERENCES pto_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_half_day_start BOOLEAN NOT NULL DEFAULT FALSE,
    is_half_day_end BOOLEAN NOT NULL DEFAULT FALSE,
    total_days DECIMAL(5,2) NOT NULL,
    notes TEXT,
    status request_status NOT NULL DEFAULT 'pending',
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Add foreign key from ledger to requests
ALTER TABLE balance_ledger ADD CONSTRAINT fk_ledger_request 
    FOREIGN KEY (request_id) REFERENCES pto_requests(id);

-- Approvals
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES pto_requests(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES users(id),
    status approval_status NOT NULL DEFAULT 'pending',
    comment TEXT,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ Holidays ============

CREATE TABLE holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_rule VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ Indexes ============

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_manager ON users(manager_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_team ON users(team_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE revoked_at IS NULL;

CREATE INDEX idx_pto_requests_user ON pto_requests(user_id);
CREATE INDEX idx_pto_requests_status ON pto_requests(status);
CREATE INDEX idx_pto_requests_dates ON pto_requests(start_date, end_date);

CREATE INDEX idx_approvals_request ON approvals(request_id);
CREATE INDEX idx_approvals_approver ON approvals(approver_id) WHERE status = 'pending';

CREATE INDEX idx_balance_ledger_user ON balance_ledger(user_id, pto_type_id);
CREATE INDEX idx_balance_ledger_date ON balance_ledger(effective_date);

CREATE INDEX idx_holidays_date ON holidays(date);

-- ============ Updated At Trigger ============

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_pto_types_updated_at BEFORE UPDATE ON pto_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_policies_updated_at BEFORE UPDATE ON policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_pto_balances_updated_at BEFORE UPDATE ON pto_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_pto_requests_updated_at BEFORE UPDATE ON pto_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_approvals_updated_at BEFORE UPDATE ON approvals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_holidays_updated_at BEFORE UPDATE ON holidays
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
