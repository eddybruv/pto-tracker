# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PTO Tracker is a comprehensive web application for managing employee paid time off, built for an 18-developer startup with no HR department. The architecture consists of:

- **Backend**: Node.js + Express + TypeScript (in `server/` directory)
- **Frontend**: React 18+ with TypeScript (planned, not yet implemented)
- **Database**: PostgreSQL (primary) or MongoDB (alternative)

The system manages PTO balances, accruals, requests, approvals, policies, and holidays with simplified roles: `developer`, `tech_lead`, and `admin` (rotating responsibility).

## Common Development Commands

### Backend (Server)

All backend commands run from the `server/` directory:

```bash
# Development
npm run dev              # Start dev server with hot reload (tsx watch)

# Building
npm run build            # Compile TypeScript to dist/
npm start                # Run compiled production server

# Testing
npm test                 # Run all tests with Jest
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report

# Linting
npm run lint             # Check for linting errors
npm run lint:fix         # Auto-fix linting errors

# Database
npm run db:migrate       # Run migrations (node-pg-migrate up)
npm run db:migrate:down  # Rollback last migration
npm run db:create-migration -- <name>  # Create new migration
```

### Running a Single Test

```bash
# Run specific test file
npm test -- path/to/test-file.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="auth service"

# Run tests for specific feature
npm test -- features/auth
```

## Architecture

### Backend Structure (Feature-Based)

The server uses a **feature-based architecture** where each feature is self-contained:

```
server/src/
├── features/           # Feature modules (domain-driven)
│   ├── auth/          # Authentication & JWT tokens
│   ├── users/         # User management (admin only)
│   ├── pto-types/     # PTO type configuration (vacation, sick, etc.)
│   ├── policies/      # Policy management (accrual rules, carryover)
│   ├── balances/      # Balance tracking & ledger
│   ├── requests/      # PTO requests
│   ├── approvals/     # Approval workflow
│   ├── holidays/      # Holiday management
│   ├── calendar/      # Team calendar view
│   └── teams/         # Team management
├── middleware/        # Express middleware (auth, error handling)
├── config/           # Environment, database config
├── utils/            # Utilities (logger, errors)
├── types/            # Shared TypeScript types
├── app.ts            # Express app setup & route mounting
└── server.ts         # Entry point & graceful shutdown
```

Each feature module contains:
- `<feature>.routes.ts` - Express router with API endpoints
- `<feature>.service.ts` - Business logic layer (if needed)
- `<feature>.schemas.ts` - Zod validation schemas
- `__tests__/` - Test files

### Frontend Structure (Planned - Feature-Sliced Design)

The React frontend will use **Feature-Sliced Design** with:

- `app/` - Application shell, providers, routing
- `features/` - Feature modules (auth, pto-requests, approvals, balances, etc.)
- `entities/` - Shared business models/types
- `shared/` - Reusable UI components, hooks, utilities
- `config/` - Environment, React Query configuration

State management:
- **React Query** for server state (API data)
- **Context API** for client state (auth, theme, UI state)
- **Local state** for component-specific state

### Database Schema

PostgreSQL schema with key tables:
- `users` - Employee information with soft delete
- `roles` / `user_roles` - Role-based access control
- `pto_types` - PTO categories (vacation, sick, personal)
- `policies` - Accrual rules, carryover settings, eligibility
- `pto_balances` - Denormalized current balances (fast access)
- `balance_ledger` - Immutable transaction log for all balance changes
- `pto_requests` - PTO requests with date ranges
- `approvals` - Approval workflow (can support multi-level)
- `holidays` - Company holidays with recurrence support
- `audit_log` - Comprehensive audit trail

Key relationships:
- Users can have multiple PTO balances (one per PTO type)
- Each balance is governed by a policy
- Requests create ledger entries when approved/denied
- Overlap detection prevents conflicting requests

### Authentication & Authorization

JWT-based authentication with refresh tokens:

1. **Login Flow**:
   - `POST /api/v1/auth/login` returns access token (15m TTL) and refresh token (7d TTL)
   - Access token stored in memory, refresh token in httpOnly cookie (planned)
   - Currently: Both tokens in localStorage (client-side, not implemented yet)

2. **Token Refresh**:
   - `POST /api/v1/auth/refresh` exchanges refresh token for new access token
   - Automatic retry on 401 responses via axios interceptor (client-side)

3. **Middleware**:
   - `authenticate` middleware validates JWT and attaches `req.user`
   - `requireRoles(...roles)` middleware checks user roles
   - Applied at route level in `app.ts`

4. **Roles & Permissions**:
   - `developer` - View own PTO/balances, submit/cancel own requests, view team calendar, view holidays, view PTO types, view teams
   - `tech_lead` - All developer permissions + approve/deny team requests
   - `admin` - Full access: manage users, PTO types, policies (CRUD + assign), holidays, teams, manual balance adjustments

5. **Route-Level RBAC**:
   - **Middleware-level** (in `app.ts`): `/users` requires `admin`, `/approvals` requires `tech_lead` or `admin`
   - **Route-level** (via `requireRoles`): Write endpoints on `/pto-types`, `/policies`, `/holidays`, `/teams`, and `/balances/adjust` require `admin`
   - **Read endpoints** on PTO types, policies, holidays, teams, calendar, and balances are accessible to all authenticated users
   - **Ownership checks**: Request cancellation and updates enforce user ownership in the handler logic

### Request Lifecycle

1. **Submission**:
   - User submits request via `POST /api/v1/requests`
   - Validation: Date range, sufficient balance, no overlaps
   - Creates pending request and ledger entry (pending debit)

2. **Approval**:
   - Approver reviews via `GET /api/v1/approvals`
   - Action via `POST /api/v1/approvals/:requestId/approve` or `/deny`
   - Updates request status and balance ledger

3. **Balance Updates**:
   - Approved: Deducts from available balance, adds to used_ytd
   - Denied: Reverses pending debit
   - Cancelled: Similar to denied, with cancellation metadata

### Balance Calculations

Balance tracking uses a dual approach:

1. **Current Balances** (`pto_balances` table):
   - Denormalized for fast queries
   - Fields: `available_hours`, `pending_hours`, `used_ytd`, `accrued_ytd`, `carryover_hours`
   - Updated transactionally when requests change status

2. **Balance Ledger** (`balance_ledger` table):
   - Immutable audit trail
   - Transaction types: `accrual`, `debit`, `adjustment`, `carryover`, `expiration`
   - Each entry has `running_balance` for point-in-time accuracy

3. **Accrual Processing**:
   - Scheduled job (node-cron) runs on accrual schedule (monthly, biweekly, etc.)
   - Adds hours based on policy configuration
   - Respects `max_accrual` cap and probation periods

## Key Design Patterns

### Error Handling

Centralized error handling with custom error classes:

```typescript
// Custom errors in utils/errors.ts
AppError              // Base class
BadRequestError       // 400
UnauthorizedError     // 401
ForbiddenError        // 403
NotFoundError         // 404
ConflictError         // 409
ValidationError       // 422

// Usage in routes/services
throw new NotFoundError('Request not found');

// Global error handler in middleware/error.ts
// Transforms errors to consistent JSON response
```

### Validation

Zod schemas for request validation:

```typescript
// Define schema in <feature>.schemas.ts
export const createRequestSchema = z.object({
  ptoTypeId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  // ...
});

// Validate in route handler
const body = createRequestSchema.parse(req.body);
```

### API Response Format

All API responses follow consistent format:

```typescript
// Success
{
  success: true,
  data: { ... },
  meta?: { pagination, ... }
}

// Error
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Human readable message',
    details?: { ... }
  }
}
```

### Database Connection

The server connects to PostgreSQL via the `pg` library (`config/database.ts`):
- Connection pool with max 20 connections
- Automatic `snake_case` → `camelCase` row transformation via `camelcase-keys`
- `DECIMAL` columns parsed as JavaScript numbers (not strings)
- Transaction helper (`transaction()`) provides a `TxClient` with the same transforms
- Seed data available in `migrations/002_seed_data.sql`
- Legacy `config/mock-db.ts` exists but is no longer used by any production code

## Important Considerations

### Security

- **JWT Secret**: Must be at least 32 characters in production
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for frontend origin (default: `http://localhost:5173`)
- **Helmet**: Security headers enabled
- **Input Validation**: All user input validated with Zod schemas
- **SQL Injection**: Prevented by parameterized queries (when real DB is connected)

### Data Integrity

- **Soft Deletes**: Users soft deleted with `deleted_at` timestamp
- **Audit Logging**: All changes logged to `audit_log` table
- **Immutable Ledger**: Balance ledger entries never modified, only appended
- **Overlap Prevention**: Database trigger prevents overlapping approved requests
- **Transaction Safety**: Balance updates wrapped in database transactions

### Testing Strategy

- **Unit Tests**: Services and utility functions
- **Integration Tests**: Route handlers with mocked services
- **Test Files**: Located in `__tests__/` subdirectory within each feature
- **Coverage**: Aim for >80% coverage on critical paths (auth, balances, requests)

### Performance Considerations

- **Denormalized Balances**: `pto_balances` table for fast queries
- **Indexes**: Key indexes on `user_id`, `status`, date ranges
- **Query Optimization**: Use `get_effective_policy()` function for policy lookups
- **Connection Pooling**: PostgreSQL connection pool (when implemented)

### TypeScript Configuration

- **Module System**: ES Modules (`"module": "NodeNext"`)
- **Target**: ES2022
- **Strict Mode**: Enabled
- **Source**: `server/src/`
- **Output**: `server/dist/`
- **Import Extensions**: Must use `.js` extensions in imports (ESM requirement)

## Environment Setup

Required environment variables (`.env`):

```bash
NODE_ENV=development
PORT=3000

# Database (when real DB is used)
DATABASE_URL=postgresql://user:password@localhost:5432/pto_tracker

# JWT (MUST be 32+ characters in production)
JWT_SECRET=your-secret-key-at-least-32-characters-long
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Common Issues & Solutions

### ESM Import Errors

If you see "Cannot find module" errors, ensure:
1. All imports use `.js` extension: `import { foo } from './bar.js'`
2. `tsconfig.json` has `"module": "NodeNext"` and `"moduleResolution": "NodeNext"`
3. `package.json` has `"type": "module"`

### Port Already in Use

If port 3000 is in use:
1. Change `PORT` in `.env`
2. Or kill existing process: `npx kill-port 3000`

### Database Connection Issues

1. Ensure PostgreSQL is running and accessible
2. Create database: `createdb pto_tracker`
3. Run migrations in order:
   - `psql -d pto_tracker -f migrations/001_initial_schema.sql`
   - `psql -d pto_tracker -f migrations/002_seed_data.sql`
4. Set `DATABASE_URL` in `.env` (e.g. `postgresql://user:password@localhost:5432/pto_tracker`)
5. Server will verify DB connectivity on startup and fail fast if unreachable

## Documentation References

Detailed specifications available in `docs/`:

- `01-react-architecture.md` - Frontend component tree, routing, state management
- `02-api-specification.yaml` - OpenAPI 3.1 spec with all endpoints
- `03-database-schema.md` - Full PostgreSQL schema with ERD and DDL
- `04-mvp-timeline.md` - 6-week development roadmap
- `05-ux-flows.md` - User flows and screen inventory

Key decisions and assumptions:
- Single timezone (all developers in primary timezone)
- Flat team structure (optional team groupings)
- Simple approval flow (tech lead or designated approver)
- Monthly accrual on 1st of month, pro-rated for new hires
- Fiscal year configurable per policy for carryover calculations
