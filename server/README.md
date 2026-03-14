# PTO Tracker - Server

Express.js + TypeScript + PostgreSQL backend for the PTO Tracker application.

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm or yarn

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your database credentials and JWT secret

# Run database migrations
psql -d pto_tracker -f migrations/001_initial_schema.sql

# Start development server
npm run dev
```

## Available Scripts

| Command            | Description                      |
| ------------------ | -------------------------------- |
| `npm run dev`      | Start dev server with hot reload |
| `npm run build`    | Compile TypeScript to dist/      |
| `npm start`        | Run compiled production server   |
| `npm run lint`     | Check for linting errors         |
| `npm run lint:fix` | Auto-fix linting errors          |
| `npm test`         | Run tests                        |

## Project Structure

```
server/
├── src/
│   ├── config/           # Environment, database config
│   ├── features/         # Feature modules
│   │   ├── auth/         # Authentication
│   │   ├── users/        # User management
│   │   ├── pto-types/    # PTO type configuration
│   │   ├── policies/     # Policy management
│   │   ├── balances/     # Balance tracking
│   │   ├── requests/     # PTO requests
│   │   ├── approvals/    # Approval workflow
│   │   └── holidays/     # Holiday management
│   ├── middleware/       # Express middleware
│   ├── types/            # TypeScript types
│   ├── utils/            # Utilities (logger, errors)
│   ├── app.ts            # Express app setup
│   └── server.ts         # Entry point
├── migrations/           # SQL migrations
├── package.json
└── tsconfig.json
```

## API Endpoints

Base URL: `http://localhost:3000/api/v1`

### Authentication
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh tokens
- `POST /auth/logout` - Logout
- `GET /auth/me` - Current user info

### Users (Admin only)
- `GET /users` - List users
- `POST /users` - Create user
- `GET /users/:id` - Get user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### PTO Types
- `GET /pto-types` - List types
- `POST /pto-types` - Create type (admin)
- `PATCH /pto-types/:id` - Update type (admin)

### Policies
- `GET /policies` - List policies
- `POST /policies` - Create policy (admin)
- `PATCH /policies/:id` - Update policy (admin)
- `POST /policies/:id/assign` - Assign to users

### Balances
- `GET /balances` - Current user balances
- `GET /balances/user/:userId` - User balances (admin/lead)
- `GET /balances/ledger` - Balance history
- `POST /balances/adjust` - Manual adjustment (admin)

### Requests
- `GET /requests` - List requests
- `POST /requests` - Create request
- `GET /requests/:id` - Get request
- `PATCH /requests/:id` - Update request
- `POST /requests/:id/cancel` - Cancel request

### Approvals (Tech Lead/Admin)
- `GET /approvals` - Pending approvals
- `POST /approvals/:requestId/approve` - Approve
- `POST /approvals/:requestId/deny` - Deny
- `POST /approvals/bulk` - Bulk action

### Holidays
- `GET /holidays` - List holidays
- `POST /holidays` - Create holiday (admin)
- `DELETE /holidays/:id` - Delete holiday (admin)

## Environment Variables

| Variable                 | Description                       | Default               |
| ------------------------ | --------------------------------- | --------------------- |
| `NODE_ENV`               | Environment                       | development           |
| `PORT`                   | Server port                       | 3000                  |
| `DATABASE_URL`           | PostgreSQL connection string      | -                     |
| `JWT_SECRET`             | JWT signing secret (min 32 chars) | -                     |
| `JWT_ACCESS_EXPIRES_IN`  | Access token TTL                  | 15m                   |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL                 | 7d                    |
| `CORS_ORIGIN`            | Allowed CORS origin               | http://localhost:5173 |

## Development

### Creating a new feature

1. Create folder in `src/features/<name>/`
2. Add files:
   - `<name>.routes.ts` - Express router
   - `<name>.service.ts` - Business logic
   - `<name>.schemas.ts` - Zod validation schemas
3. Import and mount routes in `src/app.ts`

### Database migrations

```bash
# Create new migration
# (manually create file in migrations/ folder)

# Run migration
psql -d pto_tracker -f migrations/XXX_migration_name.sql
```
