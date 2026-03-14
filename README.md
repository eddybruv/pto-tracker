# PTO Tracker - Paid Time Off Management System

A comprehensive web application for managing employee paid time off, built with React (frontend) and Node.js + Express (backend).

## 📋 Project Overview

The PTO Tracker enables organizations to:
- Manage employee PTO balances and accruals
- Process PTO requests and approvals
- Configure flexible policies (accrual rules, carryover, probation)
- Track company holidays and calendars
- Send notifications for request updates
- Generate reports for HR and management

## 👥 User Roles

> **Note**: We're an 18-developer startup with no HR department. Roles are simplified accordingly.

| Role          | Capabilities                                                                |
| ------------- | --------------------------------------------------------------------------- |
| **Developer** | View balances, submit requests, view team calendar, manage preferences      |
| **Tech Lead** | Approve/deny team requests (if assigned as approver), view team reports     |
| **Admin**     | Configure policies, manage users, adjust balances (rotating responsibility) |

## 🛠 Tech Stack

### Frontend
- React 18+ with TypeScript
- React Query (TanStack Query) for server state
- React Router v6 for routing
- React Hook Form + Zod for forms/validation
- Tailwind CSS for styling
- Headless UI for accessible components

### Backend
- Node.js 20 LTS
- Express.js
- PostgreSQL (primary) or MongoDB (alternative)
- JWT authentication with refresh tokens
- Node-cron for scheduled jobs

## 📁 Documentation

| Document                                                        | Description                               |
| --------------------------------------------------------------- | ----------------------------------------- |
| [React Component Architecture](./docs/01-react-architecture.md) | Component tree, state management, routing |
| [API Specification](./docs/02-api-specification.yaml)           | OpenAPI 3.1 complete spec                 |
| [Database Schema](./docs/03-database-schema.md)                 | PostgreSQL and MongoDB schemas            |
| [MVP Timeline](./docs/04-mvp-timeline.md)                       | 6-week development plan                   |
| [UX Flows & Screens](./docs/05-ux-flows.md)                     | Mermaid diagrams and screen inventory     |

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/eddybruv/pto-tracker.git
cd pto-tracker

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Run database migrations
npm run db:migrate

# Start development servers
npm run dev
```

## 📐 Architecture Decisions

### Key Assumptions Made

1. **Small team (18 developers)** - No HR department; self-service admin with rotating responsibility
2. **Flat structure** - Optional team groupings, but no formal departments
3. **Single timezone** - All developers operate in a primary timezone
4. **Simple approval** - Tech leads approve, or peer-based approval with designated backup
5. **Accrual timing** - Monthly accrual on the 1st; pro-rated for new hires
6. **Carryover** - Calculated on fiscal year end (configurable date)

### Architecture Highlights

- **REST API** with versioning (`/api/v1`)
- **JWT + Refresh Token** authentication
- **React Query** for server state management
- **Feature-based** folder structure
- **Soft delete** for data retention
- **Comprehensive audit logging**

## 📊 Core Features

### Phase 1 (MVP)
- [x] User authentication & authorization
- [x] PTO policy configuration
- [x] Balance tracking with accruals
- [x] Request submission and approval workflow
- [x] Employee and manager dashboards
- [x] Basic email notifications

### Phase 2 (Post-MVP)
- [ ] Calendar integrations (Google, Outlook)
- [ ] SSO (SAML, OAuth)
- [ ] Advanced reporting
- [ ] Mobile app
- [ ] Teams integration

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.
