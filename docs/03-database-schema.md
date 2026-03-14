# Database Schema Documentation

This document provides two database schema alternatives for the PTO Tracker application:
1. **PostgreSQL** - Relational database (recommended for production)
2. **MongoDB** - Document database (alternative for flexible schema needs)

> **Team Context**: Designed for an 18-developer startup with no HR department. 
> - Simplified roles: `developer`, `tech_lead`, `admin` (rotating)
> - Optional `teams` table (vs formal departments)
> - All developers can view team calendar by default

## Table of Contents
1. [PostgreSQL Schema](#postgresql-schema)
2. [MongoDB Schema](#mongodb-schema)
3. [Schema Comparison & Tradeoffs](#schema-comparison--tradeoffs)
4. [Migration Strategy](#migration-strategy)

---

# PostgreSQL Schema

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │     roles       │       │  user_roles     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │──────<│ id (PK)         │>──────│ user_id (FK)    │
│ email           │       │ name            │       │ role_id (FK)    │
│ password_hash   │       │ permissions[]   │       │ assigned_at     │
│ first_name      │       └─────────────────┘       │ assigned_by     │
│ last_name       │                                 └─────────────────┘
│ manager_id (FK) │──┐
│ team_id (opt)   │  │    ┌─────────────────┐
│ hire_date       │  └───>│     users       │ (self-reference)
│ timezone        │       └─────────────────┘
│ status          │
│ created_at      │
│ updated_at      │       ┌─────────────────┐       ┌─────────────────┐
│ deleted_at      │       │   pto_types     │       │   policies      │
└─────────────────┘       ├─────────────────┤       ├─────────────────┤
        │                 │ id (PK)         │<──────│ id (PK)         │
        │                 │ name            │       │ name            │
        │                 │ code            │       │ pto_type_id(FK) │
        │                 │ color           │       │ accrual_rate    │
        │                 │ is_paid         │       │ accrual_freq    │
        │                 │ is_active       │       │ max_accrual     │
        │                 └─────────────────┘       │ carryover_cap   │
        │                         │                 │ allow_negative  │
        │                         │                 │ probation_days  │
        │                         │                 │ is_active       │
        │                         ▼                 └─────────────────┘
        │                 ┌─────────────────┐               │
        │                 │  pto_balances   │               │
        │                 ├─────────────────┤               │
        └────────────────>│ user_id (FK)    │               │
                          │ pto_type_id(FK) │<──────────────┘
                          │ policy_id (FK)  │
                          │ available_hours │
                          │ pending_hours   │
                          │ used_ytd        │
                          │ accrued_ytd     │
                          │ carryover       │
                          └─────────────────┘
                                  │
                                  ▼
                          ┌─────────────────┐
                          │ balance_ledger  │
                          ├─────────────────┤
                          │ id (PK)         │
                          │ user_id (FK)    │
                          │ pto_type_id(FK) │
                          │ txn_type        │
                          │ hours           │
                          │ running_balance │
                          │ effective_date  │
                          │ request_id (FK) │
                          │ adjusted_by(FK) │
                          │ description     │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  pto_requests   │       │   approvals     │       │   holidays      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │<──────│ id (PK)         │       │ id (PK)         │
│ user_id (FK)    │       │ request_id (FK) │       │ name            │
│ pto_type_id(FK) │       │ approver_id(FK) │       │ date            │
│ start_date      │       │ status          │       │ is_recurring    │
│ end_date        │       │ comment         │       │ recurrence_rule │
│ is_half_start   │       │ responded_at    │       │ created_at      │
│ is_half_end     │       └─────────────────┘       └─────────────────┘
│ total_hours     │
│ notes           │       ┌─────────────────┐       ┌─────────────────┐
│ status          │       │   audit_log     │       │  notifications  │
│ created_at      │       ├─────────────────┤       ├─────────────────┤
│ updated_at      │       │ id (PK)         │       │ id (PK)         │
│ cancelled_at    │       │ user_id (FK)    │       │ user_id (FK)    │
│ cancelled_by    │       │ entity_type     │       │ type            │
└─────────────────┘       │ entity_id       │       │ title           │
                          │ action          │       │ message         │
                          │ old_values      │       │ is_read         │
                          │ new_values      │       │ action_url      │
                          │ ip_address      │       │ related_id      │
                          │ user_agent      │       │ created_at      │
                          │ created_at      │       │ read_at         │
                          └─────────────────┘       └─────────────────┘
```

## DDL Statements

### Extensions and Types

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom ENUM types
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'pending');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'denied', 'cancelled');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'denied');
CREATE TYPE accrual_frequency AS ENUM ('weekly', 'biweekly', 'monthly', 'quarterly', 'annually');
CREATE TYPE ledger_txn_type AS ENUM ('accrual', 'debit', 'adjustment', 'carryover', 'expiration');
CREATE TYPE notification_type AS ENUM (
    'request_submitted', 'request_approved', 'request_denied', 'request_cancelled',
    'approval_pending', 'approval_reminder', 'balance_low', 'balance_expiring',
    'policy_changed', 'system'
);
```

### Users and Roles

```sql
-- Roles table
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

-- Teams table (optional - for small startups, can use a single "Engineering" team)
-- For an 18-dev startup, this may just have 1-3 entries (e.g., "Frontend", "Backend", "Platform")
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    lead_id UUID, -- Tech lead, will be set after users table creation
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    avatar_url TEXT,
    manager_id UUID REFERENCES users(id), -- Optional: direct approver if not using team lead
    team_id UUID REFERENCES teams(id),     -- Optional: for small teams, everyone may be on one team
    hire_date DATE NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
    status user_status NOT NULL DEFAULT 'active',
    last_login_at TIMESTAMPTZ,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ, -- Soft delete
    
    CONSTRAINT valid_timezone CHECK (timezone ~ '^[A-Za-z]+/[A-Za-z_]+$')
);

-- Add foreign key for team lead
ALTER TABLE teams 
    ADD CONSTRAINT fk_team_lead 
    FOREIGN KEY (lead_id) REFERENCES users(id);

-- User roles junction table
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    PRIMARY KEY (user_id, role_id)
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_manager ON users(manager_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_team ON users(team_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_hire_date ON users(hire_date);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    replaced_by UUID REFERENCES refresh_tokens(id)
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE revoked_at IS NULL;
```

### PTO Types and Policies

```sql
-- PTO Types (vacation, sick, personal, etc.)
CREATE TABLE pto_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) NOT NULL DEFAULT '#4CAF50', -- Hex color
    icon VARCHAR(50),
    is_paid BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default PTO types
INSERT INTO pto_types (name, code, color, icon, is_paid) VALUES
    ('Vacation', 'VAC', '#4CAF50', 'palm-tree', TRUE),
    ('Sick Leave', 'SICK', '#F44336', 'thermometer', TRUE),
    ('Personal Day', 'PERS', '#2196F3', 'user', TRUE),
    ('Floating Holiday', 'FLOAT', '#9C27B0', 'star', TRUE),
    ('Unpaid Leave', 'UNPAID', '#9E9E9E', 'pause', FALSE);

-- PTO Policies
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    pto_type_id UUID NOT NULL REFERENCES pto_types(id),
    
    -- Accrual settings
    accrual_rate DECIMAL(10,2) NOT NULL, -- Hours per period
    accrual_frequency accrual_frequency NOT NULL DEFAULT 'monthly',
    max_accrual DECIMAL(10,2), -- NULL = unlimited
    
    -- Carryover settings
    carryover_cap DECIMAL(10,2), -- NULL = unlimited
    carryover_expire_months INTEGER, -- Months after fiscal year end
    fiscal_year_start_month INTEGER NOT NULL DEFAULT 1, -- January
    
    -- Balance rules
    allow_negative_balance BOOLEAN NOT NULL DEFAULT FALSE,
    max_negative_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Eligibility
    probation_days INTEGER NOT NULL DEFAULT 0,
    
    -- Request rules
    minimum_increment DECIMAL(10,2) NOT NULL DEFAULT 0.5, -- Hours
    maximum_consecutive_days INTEGER, -- NULL = unlimited
    advance_notice_days INTEGER NOT NULL DEFAULT 0,
    requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Day counting
    skip_weekends BOOLEAN NOT NULL DEFAULT TRUE,
    skip_holidays BOOLEAN NOT NULL DEFAULT TRUE,
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_accrual_rate CHECK (accrual_rate >= 0),
    CONSTRAINT valid_carryover CHECK (carryover_cap IS NULL OR carryover_cap >= 0),
    CONSTRAINT valid_probation CHECK (probation_days >= 0),
    CONSTRAINT valid_increment CHECK (minimum_increment >= 0.5),
    CONSTRAINT valid_fiscal_month CHECK (fiscal_year_start_month BETWEEN 1 AND 12)
);

CREATE INDEX idx_policies_pto_type ON policies(pto_type_id) WHERE is_active = TRUE;

-- Policy assignments to users
CREATE TABLE policy_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id UUID NOT NULL REFERENCES policies(id),
    user_id UUID NOT NULL REFERENCES users(id),
    effective_date DATE NOT NULL,
    end_date DATE, -- NULL = current/ongoing
    assigned_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure no overlapping assignments for same user and PTO type
    CONSTRAINT no_overlap EXCLUDE USING gist (
        user_id WITH =,
        (SELECT pto_type_id FROM policies WHERE id = policy_id) WITH =,
        daterange(effective_date, end_date, '[)') WITH &&
    )
);

CREATE INDEX idx_policy_assignments_user ON policy_assignments(user_id);
CREATE INDEX idx_policy_assignments_policy ON policy_assignments(policy_id);
CREATE INDEX idx_policy_assignments_dates ON policy_assignments(effective_date, end_date);
```

### PTO Balances and Ledger

```sql
-- Current PTO balances (denormalized for quick access)
CREATE TABLE pto_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    pto_type_id UUID NOT NULL REFERENCES pto_types(id),
    policy_id UUID REFERENCES policies(id),
    
    -- Current state
    available_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
    pending_hours DECIMAL(10,2) NOT NULL DEFAULT 0, -- In pending requests
    
    -- Year-to-date tracking
    used_ytd DECIMAL(10,2) NOT NULL DEFAULT 0,
    accrued_ytd DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Carryover
    carryover_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
    carryover_expires_at DATE,
    
    -- Metadata
    last_accrual_date DATE,
    next_accrual_date DATE,
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, pto_type_id, year)
);

CREATE INDEX idx_balances_user ON pto_balances(user_id);
CREATE INDEX idx_balances_user_type ON pto_balances(user_id, pto_type_id);
CREATE INDEX idx_balances_carryover_expires ON pto_balances(carryover_expires_at) 
    WHERE carryover_expires_at IS NOT NULL AND carryover_hours > 0;

-- Balance ledger (immutable transaction log)
CREATE TABLE balance_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    pto_type_id UUID NOT NULL REFERENCES pto_types(id),
    
    transaction_type ledger_txn_type NOT NULL,
    hours DECIMAL(10,2) NOT NULL, -- Positive for credits, negative for debits
    running_balance DECIMAL(10,2) NOT NULL,
    
    effective_date DATE NOT NULL,
    description TEXT,
    
    -- References
    request_id UUID, -- Link to PTO request if applicable
    adjusted_by_id UUID REFERENCES users(id), -- For manual adjustments
    policy_id UUID REFERENCES policies(id), -- Policy at time of transaction
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_hours CHECK (
        (transaction_type IN ('accrual', 'carryover', 'adjustment') AND hours != 0) OR
        (transaction_type IN ('debit', 'expiration') AND hours <= 0)
    )
);

CREATE INDEX idx_ledger_user ON balance_ledger(user_id);
CREATE INDEX idx_ledger_user_type ON balance_ledger(user_id, pto_type_id);
CREATE INDEX idx_ledger_date ON balance_ledger(effective_date);
CREATE INDEX idx_ledger_request ON balance_ledger(request_id) WHERE request_id IS NOT NULL;
CREATE INDEX idx_ledger_type ON balance_ledger(transaction_type);
```

### PTO Requests and Approvals

```sql
-- PTO Requests
CREATE TABLE pto_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    pto_type_id UUID NOT NULL REFERENCES pto_types(id),
    policy_id UUID REFERENCES policies(id), -- Policy at time of request
    
    -- Date range
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_half_day_start BOOLEAN NOT NULL DEFAULT FALSE,
    is_half_day_end BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Calculated fields
    total_hours DECIMAL(10,2) NOT NULL,
    total_days DECIMAL(10,2) NOT NULL,
    business_days INTEGER NOT NULL, -- Excluding weekends/holidays
    
    notes TEXT,
    status request_status NOT NULL DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Cancellation info
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES users(id),
    cancellation_reason TEXT,
    
    CONSTRAINT valid_dates CHECK (end_date >= start_date),
    CONSTRAINT valid_hours CHECK (total_hours > 0),
    CONSTRAINT valid_half_days CHECK (
        NOT (is_half_day_start AND is_half_day_end AND start_date = end_date)
    )
);

CREATE INDEX idx_requests_user ON pto_requests(user_id);
CREATE INDEX idx_requests_status ON pto_requests(status);
CREATE INDEX idx_requests_dates ON pto_requests(start_date, end_date);
CREATE INDEX idx_requests_user_status ON pto_requests(user_id, status);
CREATE INDEX idx_requests_pending ON pto_requests(user_id, start_date) 
    WHERE status = 'pending';

-- Prevent overlapping approved/pending requests for same user
CREATE OR REPLACE FUNCTION check_request_overlap()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pto_requests
        WHERE user_id = NEW.user_id
        AND id != NEW.id
        AND status IN ('pending', 'approved')
        AND daterange(start_date, end_date, '[]') && daterange(NEW.start_date, NEW.end_date, '[]')
    ) THEN
        RAISE EXCEPTION 'Request overlaps with existing pending or approved request';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_request_overlap
    BEFORE INSERT OR UPDATE ON pto_requests
    FOR EACH ROW
    WHEN (NEW.status IN ('pending', 'approved'))
    EXECUTE FUNCTION check_request_overlap();

-- Approvals
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES pto_requests(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES users(id),
    
    status approval_status NOT NULL DEFAULT 'pending',
    comment TEXT,
    
    -- For multi-level approval
    level INTEGER NOT NULL DEFAULT 1,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    
    UNIQUE(request_id, approver_id)
);

CREATE INDEX idx_approvals_request ON approvals(request_id);
CREATE INDEX idx_approvals_approver ON approvals(approver_id);
CREATE INDEX idx_approvals_pending ON approvals(approver_id, status) 
    WHERE status = 'pending';
```

### Calendar and Holidays

```sql
-- Company holidays
CREATE TABLE holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    
    -- Recurrence
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_rule TEXT, -- iCal RRULE format
    
    -- Scope
    applies_to_all BOOLEAN NOT NULL DEFAULT TRUE,
    department_ids UUID[] DEFAULT '{}',
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(date, name)
);

CREATE INDEX idx_holidays_date ON holidays(date);
CREATE INDEX idx_holidays_year ON holidays(EXTRACT(YEAR FROM date));

-- Team/Department calendar visibility settings
CREATE TABLE calendar_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_type VARCHAR(20) NOT NULL, -- 'user', 'department', 'all'
    target_id UUID, -- user_id or department_id
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, subscription_type, target_id)
);
```

### Notifications

```sql
-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    action_url TEXT,
    
    -- Related entities
    related_request_id UUID REFERENCES pto_requests(id) ON DELETE SET NULL,
    related_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    
    -- Auto-expire old notifications
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days')
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) 
    WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_expires ON notifications(expires_at) 
    WHERE expires_at IS NOT NULL;

-- Notification preferences
CREATE TABLE notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Email preferences
    email_request_submitted BOOLEAN NOT NULL DEFAULT TRUE,
    email_request_approved BOOLEAN NOT NULL DEFAULT TRUE,
    email_request_denied BOOLEAN NOT NULL DEFAULT TRUE,
    email_approval_pending BOOLEAN NOT NULL DEFAULT TRUE,
    email_approval_reminder BOOLEAN NOT NULL DEFAULT TRUE,
    email_balance_warnings BOOLEAN NOT NULL DEFAULT TRUE,
    email_weekly_digest BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- In-app preferences  
    inapp_request_submitted BOOLEAN NOT NULL DEFAULT TRUE,
    inapp_request_approved BOOLEAN NOT NULL DEFAULT TRUE,
    inapp_request_denied BOOLEAN NOT NULL DEFAULT TRUE,
    inapp_approval_pending BOOLEAN NOT NULL DEFAULT TRUE,
    inapp_balance_warnings BOOLEAN NOT NULL DEFAULT TRUE,
    
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Approval delegation
CREATE TABLE approval_delegations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delegator_id UUID NOT NULL REFERENCES users(id),
    delegatee_id UUID NOT NULL REFERENCES users(id),
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    auto_approve_after_hours INTEGER, -- NULL = no auto-approve
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_delegation_dates CHECK (end_date >= start_date),
    CONSTRAINT no_self_delegation CHECK (delegator_id != delegatee_id)
);

CREATE INDEX idx_delegations_delegator ON approval_delegations(delegator_id);
CREATE INDEX idx_delegations_active ON approval_delegations(delegatee_id, start_date, end_date) 
    WHERE is_active = TRUE;
```

### Audit Log

```sql
-- Audit log for all changes
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Who
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255), -- Denormalized in case user deleted
    
    -- What
    entity_type VARCHAR(50) NOT NULL, -- 'user', 'policy', 'request', etc.
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'approve', etc.
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[], -- List of changed field names
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100), -- Correlation ID
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_action ON audit_log(action);

-- Partition audit log by month for performance
-- (In production, implement table partitioning)

-- Trigger function for automatic audit logging
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    old_row JSONB := NULL;
    new_row JSONB := NULL;
    changed TEXT[] := '{}';
BEGIN
    IF TG_OP = 'DELETE' THEN
        old_row := to_jsonb(OLD);
    ELSIF TG_OP = 'UPDATE' THEN
        old_row := to_jsonb(OLD);
        new_row := to_jsonb(NEW);
        -- Find changed fields
        SELECT array_agg(key) INTO changed
        FROM jsonb_each(old_row) o
        FULL OUTER JOIN jsonb_each(new_row) n USING (key)
        WHERE o.value IS DISTINCT FROM n.value;
    ELSE
        new_row := to_jsonb(NEW);
    END IF;
    
    INSERT INTO audit_log (
        user_id, entity_type, entity_id, action,
        old_values, new_values, changed_fields
    ) VALUES (
        current_setting('app.current_user_id', TRUE)::UUID,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        old_row, new_row, changed
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to key tables
CREATE TRIGGER audit_users 
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_policies
    AFTER INSERT OR UPDATE OR DELETE ON policies
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_pto_requests
    AFTER INSERT OR UPDATE OR DELETE ON pto_requests
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_balances
    AFTER UPDATE ON pto_balances
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

### Helper Functions

```sql
-- Calculate business days between two dates
CREATE OR REPLACE FUNCTION calculate_business_days(
    p_start_date DATE,
    p_end_date DATE,
    p_skip_weekends BOOLEAN DEFAULT TRUE,
    p_skip_holidays BOOLEAN DEFAULT TRUE
) RETURNS INTEGER AS $$
DECLARE
    total_days INTEGER := 0;
    current_date DATE := p_start_date;
    holiday_dates DATE[];
BEGIN
    -- Get holidays in range
    IF p_skip_holidays THEN
        SELECT array_agg(date) INTO holiday_dates
        FROM holidays
        WHERE date BETWEEN p_start_date AND p_end_date;
    END IF;
    
    WHILE current_date <= p_end_date LOOP
        -- Skip weekends if configured
        IF p_skip_weekends AND EXTRACT(DOW FROM current_date) IN (0, 6) THEN
            current_date := current_date + 1;
            CONTINUE;
        END IF;
        
        -- Skip holidays if configured
        IF p_skip_holidays AND current_date = ANY(COALESCE(holiday_dates, '{}')) THEN
            current_date := current_date + 1;
            CONTINUE;
        END IF;
        
        total_days := total_days + 1;
        current_date := current_date + 1;
    END LOOP;
    
    RETURN total_days;
END;
$$ LANGUAGE plpgsql;

-- Get user's effective policy for a PTO type
CREATE OR REPLACE FUNCTION get_effective_policy(
    p_user_id UUID,
    p_pto_type_id UUID,
    p_as_of_date DATE DEFAULT CURRENT_DATE
) RETURNS UUID AS $$
    SELECT p.id
    FROM policies p
    JOIN policy_assignments pa ON pa.policy_id = p.id
    WHERE pa.user_id = p_user_id
    AND p.pto_type_id = p_pto_type_id
    AND p.is_active = TRUE
    AND pa.effective_date <= p_as_of_date
    AND (pa.end_date IS NULL OR pa.end_date > p_as_of_date)
    ORDER BY pa.effective_date DESC
    LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Check if user is past probation for a policy
CREATE OR REPLACE FUNCTION is_past_probation(
    p_user_id UUID,
    p_policy_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_hire_date DATE;
    v_probation_days INTEGER;
BEGIN
    SELECT u.hire_date, p.probation_days
    INTO v_hire_date, v_probation_days
    FROM users u, policies p
    WHERE u.id = p_user_id AND p.id = p_policy_id;
    
    RETURN (v_hire_date + v_probation_days) <= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

# MongoDB Schema

## Collection Schemas

### users Collection

```javascript
// users collection
{
  $jsonSchema: {
    bsonType: "object",
    required: ["email", "passwordHash", "firstName", "lastName", "roles", "status", "hireDate", "createdAt"],
    properties: {
      _id: { bsonType: "objectId" },
      email: {
        bsonType: "string",
        pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
      },
      passwordHash: { bsonType: "string" },
      firstName: { bsonType: "string", minLength: 1, maxLength: 100 },
      lastName: { bsonType: "string", minLength: 1, maxLength: 100 },
      displayName: { bsonType: "string" },
      avatarUrl: { bsonType: "string" },
      
      roles: {
        bsonType: "array",
        items: { enum: ["employee", "manager", "admin"] },
        minItems: 1
      },
      permissions: {
        bsonType: "array",
        items: { bsonType: "string" }
      },
      
      managerId: { bsonType: "objectId" },
      departmentId: { bsonType: "objectId" },
      department: { bsonType: "string" },
      
      hireDate: { bsonType: "date" },
      timezone: { bsonType: "string" },
      
      status: { enum: ["active", "inactive", "pending"] },
      
      // Embedded notification preferences
      notificationPreferences: {
        bsonType: "object",
        properties: {
          email: {
            bsonType: "object",
            properties: {
              requestSubmitted: { bsonType: "bool" },
              requestApproved: { bsonType: "bool" },
              requestDenied: { bsonType: "bool" },
              approvalPending: { bsonType: "bool" },
              approvalReminder: { bsonType: "bool" },
              balanceWarnings: { bsonType: "bool" },
              weeklyDigest: { bsonType: "bool" }
            }
          },
          inApp: {
            bsonType: "object",
            properties: {
              requestSubmitted: { bsonType: "bool" },
              requestApproved: { bsonType: "bool" },
              requestDenied: { bsonType: "bool" },
              approvalPending: { bsonType: "bool" },
              balanceWarnings: { bsonType: "bool" }
            }
          }
        }
      },
      
      // Embedded approval delegation
      approvalDelegation: {
        bsonType: "object",
        properties: {
          isActive: { bsonType: "bool" },
          delegateeId: { bsonType: "objectId" },
          startDate: { bsonType: "date" },
          endDate: { bsonType: "date" },
          autoApproveAfterHours: { bsonType: "int" }
        }
      },
      
      lastLoginAt: { bsonType: "date" },
      passwordResetToken: { bsonType: "string" },
      passwordResetExpires: { bsonType: "date" },
      
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" },
      deletedAt: { bsonType: "date" }
    }
  }
}

// Indexes for users collection
db.users.createIndex({ email: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
db.users.createIndex({ managerId: 1 }, { partialFilterExpression: { deletedAt: null } });
db.users.createIndex({ departmentId: 1 }, { partialFilterExpression: { deletedAt: null } });
db.users.createIndex({ status: 1, roles: 1 });
db.users.createIndex({ "roles": 1 });
```

### ptoTypes Collection

```javascript
// ptoTypes collection
{
  $jsonSchema: {
    bsonType: "object",
    required: ["name", "code", "color", "isActive"],
    properties: {
      _id: { bsonType: "objectId" },
      name: { bsonType: "string", minLength: 1, maxLength: 100 },
      code: { bsonType: "string", minLength: 2, maxLength: 10 },
      description: { bsonType: "string" },
      color: { bsonType: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
      icon: { bsonType: "string" },
      isPaid: { bsonType: "bool" },
      isActive: { bsonType: "bool" },
      sortOrder: { bsonType: "int" },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" }
    }
  }
}

db.ptoTypes.createIndex({ code: 1 }, { unique: true });
db.ptoTypes.createIndex({ isActive: 1, sortOrder: 1 });
```

### policies Collection

```javascript
// policies collection
{
  $jsonSchema: {
    bsonType: "object",
    required: ["name", "ptoTypeId", "accrualRate", "accrualFrequency", "isActive"],
    properties: {
      _id: { bsonType: "objectId" },
      name: { bsonType: "string", minLength: 1, maxLength: 100 },
      description: { bsonType: "string" },
      ptoTypeId: { bsonType: "objectId" },
      
      // Accrual settings
      accrual: {
        bsonType: "object",
        required: ["rate", "frequency"],
        properties: {
          rate: { bsonType: "double", minimum: 0 },
          frequency: { enum: ["weekly", "biweekly", "monthly", "quarterly", "annually"] },
          maxAccrual: { bsonType: ["double", "null"] }
        }
      },
      
      // Carryover settings
      carryover: {
        bsonType: "object",
        properties: {
          cap: { bsonType: ["double", "null"] },
          expireMonths: { bsonType: ["int", "null"] },
          fiscalYearStartMonth: { bsonType: "int", minimum: 1, maximum: 12 }
        }
      },
      
      // Balance rules
      balanceRules: {
        bsonType: "object",
        properties: {
          allowNegative: { bsonType: "bool" },
          maxNegative: { bsonType: "double", minimum: 0 }
        }
      },
      
      // Eligibility
      eligibility: {
        bsonType: "object",
        properties: {
          probationDays: { bsonType: "int", minimum: 0 }
        }
      },
      
      // Request rules
      requestRules: {
        bsonType: "object",
        properties: {
          minimumIncrement: { bsonType: "double", minimum: 0.5 },
          maximumConsecutiveDays: { bsonType: ["int", "null"] },
          advanceNoticeDays: { bsonType: "int", minimum: 0 },
          requiresApproval: { bsonType: "bool" },
          skipWeekends: { bsonType: "bool" },
          skipHolidays: { bsonType: "bool" }
        }
      },
      
      isActive: { bsonType: "bool" },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" }
    }
  }
}

db.policies.createIndex({ ptoTypeId: 1, isActive: 1 });
db.policies.createIndex({ isActive: 1 });
```

### ptoBalances Collection

```javascript
// ptoBalances collection - One document per user per PTO type per year
{
  $jsonSchema: {
    bsonType: "object",
    required: ["userId", "ptoTypeId", "year", "availableHours"],
    properties: {
      _id: { bsonType: "objectId" },
      userId: { bsonType: "objectId" },
      ptoTypeId: { bsonType: "objectId" },
      policyId: { bsonType: "objectId" },
      year: { bsonType: "int" },
      
      // Current state
      availableHours: { bsonType: "double" },
      pendingHours: { bsonType: "double" },
      
      // YTD tracking
      usedYtd: { bsonType: "double" },
      accruedYtd: { bsonType: "double" },
      
      // Carryover
      carryoverHours: { bsonType: "double" },
      carryoverExpiresAt: { bsonType: "date" },
      
      // Metadata
      lastAccrualDate: { bsonType: "date" },
      nextAccrualDate: { bsonType: "date" },
      
      // Embedded ledger entries (last 50 for quick access)
      recentLedger: {
        bsonType: "array",
        items: {
          bsonType: "object",
          properties: {
            id: { bsonType: "objectId" },
            transactionType: { enum: ["accrual", "debit", "adjustment", "carryover", "expiration"] },
            hours: { bsonType: "double" },
            runningBalance: { bsonType: "double" },
            effectiveDate: { bsonType: "date" },
            description: { bsonType: "string" },
            requestId: { bsonType: "objectId" },
            createdAt: { bsonType: "date" }
          }
        }
      },
      
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" }
    }
  }
}

db.ptoBalances.createIndex({ userId: 1, ptoTypeId: 1, year: 1 }, { unique: true });
db.ptoBalances.createIndex({ userId: 1, year: 1 });
db.ptoBalances.createIndex({ carryoverExpiresAt: 1 }, { 
  partialFilterExpression: { carryoverHours: { $gt: 0 } } 
});
```

### balanceLedger Collection

```javascript
// balanceLedger collection - Full transaction history
{
  $jsonSchema: {
    bsonType: "object",
    required: ["userId", "ptoTypeId", "transactionType", "hours", "runningBalance", "effectiveDate"],
    properties: {
      _id: { bsonType: "objectId" },
      userId: { bsonType: "objectId" },
      ptoTypeId: { bsonType: "objectId" },
      
      transactionType: { enum: ["accrual", "debit", "adjustment", "carryover", "expiration"] },
      hours: { bsonType: "double" },
      runningBalance: { bsonType: "double" },
      
      effectiveDate: { bsonType: "date" },
      description: { bsonType: "string" },
      
      // References
      requestId: { bsonType: "objectId" },
      adjustedById: { bsonType: "objectId" },
      policyId: { bsonType: "objectId" },
      
      createdAt: { bsonType: "date" }
    }
  }
}

db.balanceLedger.createIndex({ userId: 1, ptoTypeId: 1 });
db.balanceLedger.createIndex({ userId: 1, effectiveDate: -1 });
db.balanceLedger.createIndex({ requestId: 1 }, { sparse: true });
db.balanceLedger.createIndex({ effectiveDate: 1, transactionType: 1 });
```

### ptoRequests Collection

```javascript
// ptoRequests collection
{
  $jsonSchema: {
    bsonType: "object",
    required: ["userId", "ptoTypeId", "startDate", "endDate", "totalHours", "status"],
    properties: {
      _id: { bsonType: "objectId" },
      userId: { bsonType: "objectId" },
      ptoTypeId: { bsonType: "objectId" },
      policyId: { bsonType: "objectId" },
      
      // Denormalized user info for quick display
      user: {
        bsonType: "object",
        properties: {
          firstName: { bsonType: "string" },
          lastName: { bsonType: "string" },
          email: { bsonType: "string" },
          avatarUrl: { bsonType: "string" }
        }
      },
      
      // Denormalized PTO type info
      ptoType: {
        bsonType: "object",
        properties: {
          name: { bsonType: "string" },
          code: { bsonType: "string" },
          color: { bsonType: "string" }
        }
      },
      
      // Date range
      startDate: { bsonType: "date" },
      endDate: { bsonType: "date" },
      isHalfDayStart: { bsonType: "bool" },
      isHalfDayEnd: { bsonType: "bool" },
      
      // Calculated fields
      totalHours: { bsonType: "double", minimum: 0.5 },
      totalDays: { bsonType: "double" },
      businessDays: { bsonType: "int" },
      
      notes: { bsonType: "string" },
      status: { enum: ["pending", "approved", "denied", "cancelled"] },
      
      // Embedded approvals
      approvals: {
        bsonType: "array",
        items: {
          bsonType: "object",
          properties: {
            approverId: { bsonType: "objectId" },
            approver: {
              bsonType: "object",
              properties: {
                firstName: { bsonType: "string" },
                lastName: { bsonType: "string" },
                email: { bsonType: "string" }
              }
            },
            status: { enum: ["pending", "approved", "denied"] },
            comment: { bsonType: "string" },
            level: { bsonType: "int" },
            isRequired: { bsonType: "bool" },
            createdAt: { bsonType: "date" },
            respondedAt: { bsonType: "date" }
          }
        }
      },
      
      // Timeline for history
      timeline: {
        bsonType: "array",
        items: {
          bsonType: "object",
          properties: {
            action: { enum: ["created", "updated", "approved", "denied", "cancelled", "reminder_sent"] },
            timestamp: { bsonType: "date" },
            actorId: { bsonType: "objectId" },
            actorName: { bsonType: "string" },
            details: { bsonType: "string" }
          }
        }
      },
      
      // Cancellation
      cancellation: {
        bsonType: "object",
        properties: {
          cancelledAt: { bsonType: "date" },
          cancelledById: { bsonType: "objectId" },
          reason: { bsonType: "string" }
        }
      },
      
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" }
    }
  }
}

db.ptoRequests.createIndex({ userId: 1, status: 1 });
db.ptoRequests.createIndex({ userId: 1, startDate: 1, endDate: 1 });
db.ptoRequests.createIndex({ status: 1, createdAt: -1 });
db.ptoRequests.createIndex({ "approvals.approverId": 1, "approvals.status": 1 });
db.ptoRequests.createIndex({ startDate: 1, endDate: 1, status: 1 });

// Text index for searching
db.ptoRequests.createIndex({ 
  "user.firstName": "text", 
  "user.lastName": "text", 
  notes: "text" 
});
```

### holidays Collection

```javascript
// holidays collection
{
  $jsonSchema: {
    bsonType: "object",
    required: ["name", "date"],
    properties: {
      _id: { bsonType: "objectId" },
      name: { bsonType: "string", minLength: 1, maxLength: 100 },
      date: { bsonType: "date" },
      
      isRecurring: { bsonType: "bool" },
      recurrenceRule: { bsonType: "string" },
      
      appliesToAll: { bsonType: "bool" },
      departmentIds: {
        bsonType: "array",
        items: { bsonType: "objectId" }
      },
      
      createdById: { bsonType: "objectId" },
      createdAt: { bsonType: "date" },
      updatedAt: { bsonType: "date" }
    }
  }
}

db.holidays.createIndex({ date: 1 });
db.holidays.createIndex({ date: 1, name: 1 }, { unique: true });
```

### notifications Collection

```javascript
// notifications collection
{
  $jsonSchema: {
    bsonType: "object",
    required: ["userId", "type", "title", "message", "isRead", "createdAt"],
    properties: {
      _id: { bsonType: "objectId" },
      userId: { bsonType: "objectId" },
      
      type: { 
        enum: [
          "request_submitted", "request_approved", "request_denied", "request_cancelled",
          "approval_pending", "approval_reminder", "balance_low", "balance_expiring",
          "policy_changed", "system"
        ]
      },
      title: { bsonType: "string" },
      message: { bsonType: "string" },
      
      isRead: { bsonType: "bool" },
      actionUrl: { bsonType: "string" },
      
      relatedRequestId: { bsonType: "objectId" },
      relatedUserId: { bsonType: "objectId" },
      
      createdAt: { bsonType: "date" },
      readAt: { bsonType: "date" },
      expiresAt: { bsonType: "date" }
    }
  }
}

db.notifications.createIndex({ userId: 1, isRead: 1 });
db.notifications.createIndex({ userId: 1, createdAt: -1 });
db.notifications.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
```

### auditLog Collection

```javascript
// auditLog collection
{
  $jsonSchema: {
    bsonType: "object",
    required: ["entityType", "entityId", "action", "createdAt"],
    properties: {
      _id: { bsonType: "objectId" },
      
      userId: { bsonType: "objectId" },
      userEmail: { bsonType: "string" },
      
      entityType: { bsonType: "string" },
      entityId: { bsonType: "objectId" },
      action: { bsonType: "string" },
      
      oldValues: { bsonType: "object" },
      newValues: { bsonType: "object" },
      changedFields: {
        bsonType: "array",
        items: { bsonType: "string" }
      },
      
      ipAddress: { bsonType: "string" },
      userAgent: { bsonType: "string" },
      requestId: { bsonType: "string" },
      
      createdAt: { bsonType: "date" }
    }
  }
}

db.auditLog.createIndex({ entityType: 1, entityId: 1 });
db.auditLog.createIndex({ userId: 1 });
db.auditLog.createIndex({ createdAt: -1 });
db.auditLog.createIndex({ action: 1, createdAt: -1 });

// TTL index to auto-delete old logs (e.g., after 2 years)
db.auditLog.createIndex({ createdAt: 1 }, { expireAfterSeconds: 63072000 });
```

---

# Schema Comparison & Tradeoffs

## PostgreSQL vs MongoDB

| Aspect                 | PostgreSQL                               | MongoDB                           |
| ---------------------- | ---------------------------------------- | --------------------------------- |
| **Data Integrity**     | ✅ Strong with FKs, constraints, triggers | ⚠️ Application-level enforcement   |
| **ACID Transactions**  | ✅ Full support                           | ✅ Multi-doc transactions (v4.0+)  |
| **Schema Evolution**   | ⚠️ Requires migrations                    | ✅ Flexible, easier changes        |
| **Complex Queries**    | ✅ JOINs, CTEs, window functions          | ⚠️ Aggregation pipeline complexity |
| **Reporting**          | ✅ Native SQL, easy BI integration        | ⚠️ May need separate analytics DB  |
| **Horizontal Scaling** | ⚠️ Read replicas, limited sharding        | ✅ Native sharding                 |
| **Embedded Documents** | ❌ Requires JOINs                         | ✅ Natural for related data        |
| **Audit/History**      | ✅ Triggers, temporal tables              | ✅ Change streams                  |

## Recommendation

**Use PostgreSQL for:**
- Strong data consistency requirements
- Complex reporting needs
- Smaller to medium teams
- Standard deployment infrastructure

**Use MongoDB for:**
- Rapid prototyping
- Highly variable schema needs
- Need for horizontal scaling
- Teams experienced with document DBs

**Our recommendation: PostgreSQL** for this PTO Tracker due to:
1. Financial/HR data requires strong consistency
2. Complex queries for balances and accruals
3. Audit requirements benefit from triggers
4. Reporting needs are better served by SQL

---

# Migration Strategy

## PostgreSQL Migrations

### Using Node.js with node-pg-migrate

```javascript
// migrations/001_initial_schema.js
exports.up = (pgm) => {
  // Create extensions
  pgm.sql(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  
  // Create enum types
  pgm.createType('user_status', ['active', 'inactive', 'pending']);
  pgm.createType('request_status', ['pending', 'approved', 'denied', 'cancelled']);
  
  // Create users table
  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('uuid_generate_v4()') },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    first_name: { type: 'varchar(100)', notNull: true },
    last_name: { type: 'varchar(100)', notNull: true },
    status: { type: 'user_status', notNull: true, default: 'active' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    deleted_at: { type: 'timestamptz' }
  });
  
  // ... continue with other tables
};

exports.down = (pgm) => {
  pgm.dropTable('users');
  pgm.dropType('user_status');
  pgm.dropType('request_status');
};
```

### Migration Best Practices

1. **Version Control**: Store all migrations in git
2. **Atomic Changes**: Each migration should be self-contained
3. **Rollback Support**: Always implement `down` migrations
4. **Data Migrations**: Separate schema changes from data changes
5. **Testing**: Test migrations against production-like data
6. **Backups**: Always backup before running migrations

### Schema Versioning Table

```sql
CREATE TABLE schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    execution_time_ms INTEGER
);
```

## MongoDB Schema Versioning

```javascript
// migrations/001_initial_collections.js
module.exports = {
  async up(db) {
    // Create collections with validation
    await db.createCollection('users', {
      validator: { $jsonSchema: userSchema }
    });
    
    // Create indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
  },
  
  async down(db) {
    await db.collection('users').drop();
  }
};
```

---

# Indexing Strategy Summary

## Key Query Patterns and Indexes

| Query Pattern      | PostgreSQL Index           | MongoDB Index                                          |
| ------------------ | -------------------------- | ------------------------------------------------------ |
| User by email      | `idx_users_email`          | `{ email: 1 }`                                         |
| User's requests    | `idx_requests_user_status` | `{ userId: 1, status: 1 }`                             |
| Pending approvals  | `idx_approvals_pending`    | `{ "approvals.approverId": 1, "approvals.status": 1 }` |
| Date range queries | `idx_requests_dates`       | `{ startDate: 1, endDate: 1 }`                         |
| Balance by user    | `idx_balances_user_type`   | `{ userId: 1, ptoTypeId: 1, year: 1 }`                 |
| Audit log search   | `idx_audit_entity`         | `{ entityType: 1, entityId: 1 }`                       |

---

# Data Retention & Soft Delete

## Soft Delete Implementation

### PostgreSQL

```sql
-- Add deleted_at to enable soft delete
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;

-- Create view for active users
CREATE VIEW active_users AS
SELECT * FROM users WHERE deleted_at IS NULL;

-- Modify foreign key behavior
-- Use application logic or triggers to handle cascades
```

### MongoDB

```javascript
// Add deletedAt field and update queries
db.users.updateOne(
  { _id: userId },
  { $set: { deletedAt: new Date() } }
);

// Query pattern - always filter out deleted
db.users.find({ deletedAt: { $exists: false } });
```

## Data Retention Policies

| Data Type        | Retention Period | Action                      |
| ---------------- | ---------------- | --------------------------- |
| Active user data | Indefinite       | Soft delete on deactivation |
| PTO requests     | 7 years          | Archive after retention     |
| Balance ledger   | 7 years          | Archive after retention     |
| Audit logs       | 2 years          | Auto-delete via TTL         |
| Notifications    | 90 days          | Auto-delete via TTL         |
| Sessions/tokens  | 30 days          | Auto-delete via TTL         |

---

This database schema provides a solid foundation for the PTO Tracker application with comprehensive support for all required features including balances, accruals, requests, approvals, audit logging, and notifications.
