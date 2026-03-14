# MVP Timeline - PTO Tracker

## Executive Summary

This document outlines a **6-week MVP development plan** for the PTO Tracker application. The MVP focuses on core functionality that enables employees to request PTO, managers to approve/deny requests, and HR to configure basic policies.

### Team Assumptions
- **Company Size**: 18 developers total (startup with no other teams)
- **Project Allocation**: 2 developers part-time (~50% allocation each)
- **Availability**: ~8 hours/day combined across both devs
- **Experience Level**: Mid-senior developers familiar with React and Node.js
- **Person-Days Available**: 60 person-days total (10 person-days/week × 6 weeks)

> **Note**: This is a reasonable allocation for an internal tool at a small startup. The remaining 16 developers continue on core product work.

### Key Assumptions
1. Design mockups/wireframes are provided or minimal design effort needed
2. Development environment and CI/CD pipeline can be set up quickly
3. PostgreSQL database is the chosen data store
4. No third-party integrations (calendar, SSO) in MVP
5. Single timezone per organization for MVP
6. Single-level approval workflow (direct manager only)

---

## Sprint Overview

| Week | Sprint   | Focus Area    | Primary Deliverables                 |
| ---- | -------- | ------------- | ------------------------------------ |
| 1    | Sprint 1 | Foundation    | Project setup, Auth, User management |
| 2    | Sprint 2 | Core Backend  | Policies, Balances, Accrual engine   |
| 3    | Sprint 3 | Request Flow  | PTO requests, Approval workflow      |
| 4    | Sprint 4 | Frontend Core | Dashboard, Request UI, Approval UI   |
| 5    | Sprint 5 | Integration   | Calendar, Notifications, Polish      |
| 6    | Sprint 6 | QA & Launch   | Testing, Bug fixes, Deployment       |

---

## Detailed Sprint Plan

### Week 1: Sprint 1 - Foundation

**Objectives**: Establish project infrastructure, implement authentication, and create user management foundation.

| Task               | Description                                                                 | Effort (PD) | Owner | Done Criteria                     |
| ------------------ | --------------------------------------------------------------------------- | ----------- | ----- | --------------------------------- |
| Project Setup      | Initialize React + Express projects, configure TypeScript, ESLint, Prettier | 1           | Dev 1 | Both projects build and run       |
| Database Setup     | PostgreSQL setup, initial migrations, connection pooling                    | 1           | Dev 2 | Migrations run, connections work  |
| CI/CD Pipeline     | GitHub Actions for build, test, lint                                        | 1           | Dev 3 | PRs trigger checks                |
| Auth Backend       | JWT access/refresh tokens, login/logout endpoints                           | 2           | Dev 2 | Tokens issued/validated correctly |
| Password Reset     | Forgot password flow with email                                             | 1           | Dev 2 | Email sent with reset link        |
| Auth Frontend      | Login page, auth context, token handling                                    | 2           | Dev 3 | Users can log in/out              |
| User CRUD API      | Create, read, update users; role assignment                                 | 2           | Dev 1 | CRUD operations work              |
| User Management UI | Admin user list, create user form                                           | 2           | Dev 3 | Admins can manage users           |
| Role-based Access  | Backend middleware, frontend guards                                         | 1.5         | Dev 1 | Routes protected by role          |
| Error Handling     | Global error handler, standardized responses                                | 0.5         | Dev 1 | Consistent error format           |

**Sprint 1 Total**: 14 person-days

**Risks & Mitigations**:
| Risk               | Likelihood | Impact | Mitigation                                |
| ------------------ | ---------- | ------ | ----------------------------------------- |
| Auth complexity    | Medium     | High   | Use proven libraries (passport-jwt, jose) |
| Environment issues | Low        | Medium | Docker for consistent local dev           |

**Sprint 1 Deliverables**:
- ✅ Running frontend and backend applications
- ✅ User authentication (login/logout)
- ✅ Admin can create and manage users
- ✅ Role-based access control working

---

### Week 2: Sprint 2 - Core Backend

**Objectives**: Implement PTO types, policies, balance tracking, and the accrual engine.

| Task               | Description                               | Effort (PD) | Owner | Done Criteria                    |
| ------------------ | ----------------------------------------- | ----------- | ----- | -------------------------------- |
| PTO Types API      | CRUD for PTO types (vacation, sick, etc.) | 1           | Dev 1 | Types can be created/updated     |
| Policy Model       | Database schema, validation rules         | 1.5         | Dev 2 | Policy table with all fields     |
| Policy CRUD API    | Create, update, deactivate policies       | 2           | Dev 2 | Full policy management           |
| Policy Assignment  | Assign policies to users                  | 1.5         | Dev 1 | Users linked to policies         |
| Balance Model      | Balance tracking schema, ledger table     | 1.5         | Dev 2 | Balance queries work             |
| Balance API        | Get balances, ledger history              | 1.5         | Dev 1 | Balances returned correctly      |
| Manual Adjustment  | Admin balance adjustment endpoint         | 1           | Dev 2 | Adjustments recorded in ledger   |
| Accrual Engine     | Scheduled job for monthly accruals        | 2.5         | Dev 2 | Accruals calculated correctly    |
| Probation Logic    | Skip accruals during probation            | 0.5         | Dev 2 | No accrual before probation ends |
| Holiday Management | Holiday CRUD API                          | 1           | Dev 1 | Holidays can be managed          |
| Policy Settings UI | Admin policy configuration page           | 2           | Dev 3 | Policies can be created/edited   |

**Sprint 2 Total**: 16 person-days

**Risks & Mitigations**:
| Risk                       | Likelihood | Impact | Mitigation                                          |
| -------------------------- | ---------- | ------ | --------------------------------------------------- |
| Complex accrual logic      | High       | High   | Extensive unit tests, edge case documentation       |
| Balance calculation errors | Medium     | High   | Ledger-based source of truth, reconciliation checks |

**Sprint 2 Deliverables**:
- ✅ PTO types and policies configurable
- ✅ Balance tracking operational
- ✅ Accrual engine running (can be triggered manually for testing)
- ✅ Admin can adjust balances

---

### Week 3: Sprint 3 - Request Flow

**Objectives**: Implement PTO request submission and approval workflow.

| Task                  | Description                                | Effort (PD) | Owner | Done Criteria                    |
| --------------------- | ------------------------------------------ | ----------- | ----- | -------------------------------- |
| Request Model         | Request table, status workflow             | 1           | Dev 1 | Schema complete with constraints |
| Create Request API    | Submit PTO request with validation         | 2           | Dev 1 | Requests created correctly       |
| Overlap Detection     | Check for conflicting requests             | 1.5         | Dev 2 | Overlaps rejected with message   |
| Business Day Calc     | Calculate days excluding weekends/holidays | 1.5         | Dev 2 | Correct day counts               |
| Half-Day Support      | Handle half-day start/end                  | 1           | Dev 1 | Hours calculated correctly       |
| Balance Validation    | Check available balance, handle negative   | 1           | Dev 2 | Insufficient balance handled     |
| Update/Cancel API     | Edit pending, cancel approved/pending      | 1.5         | Dev 1 | State transitions work           |
| Approval Model        | Approval records, manager lookup           | 1           | Dev 2 | Approvals linked to requests     |
| Pending Approvals API | List pending for manager                   | 1           | Dev 1 | Correct requests returned        |
| Approve/Deny API      | Manager actions with comments              | 2           | Dev 2 | Status updated, balance debited  |
| Balance Debit         | Debit balance on approval                  | 1           | Dev 2 | Ledger entry created             |
| Balance Refund        | Credit balance on cancellation             | 1           | Dev 1 | Balance restored correctly       |

**Sprint 3 Total**: 15.5 person-days

**Risks & Mitigations**:
| Risk                     | Likelihood | Impact | Mitigation                                |
| ------------------------ | ---------- | ------ | ----------------------------------------- |
| State machine complexity | Medium     | Medium | Clear status transition diagram, tests    |
| Edge cases in day calc   | High       | Medium | Comprehensive test suite with known dates |
| Race conditions          | Medium     | High   | Database transactions, optimistic locking |

**Sprint 3 Deliverables**:
- ✅ Employees can submit PTO requests
- ✅ System validates overlaps and balances
- ✅ Half-day requests supported
- ✅ Managers can approve/deny requests
- ✅ Balances update correctly on approval/cancellation

---

### Week 4: Sprint 4 - Frontend Core

**Objectives**: Build primary user-facing screens for employees and managers.

| Task                 | Description                          | Effort (PD) | Owner | Done Criteria                |
| -------------------- | ------------------------------------ | ----------- | ----- | ---------------------------- |
| App Shell            | Layout, navigation, sidebar          | 1.5         | Dev 3 | Responsive layout works      |
| Employee Dashboard   | Balance overview, recent requests    | 2           | Dev 3 | Dashboard displays correctly |
| Balance Cards        | Visual balance display with colors   | 1           | Dev 3 | All PTO types shown          |
| Request PTO Modal    | Date picker, type select, validation | 3           | Dev 3 | Form submits correctly       |
| Conflict Warning     | Show warning for detected conflicts  | 0.5         | Dev 3 | Warning displays             |
| My Requests List     | Filterable list of user's requests   | 2           | Dev 3 | List with status filtering   |
| Request Detail View  | Timeline, status, actions            | 1.5         | Dev 1 | Full request info shown      |
| Cancel Request       | Cancel flow with confirmation        | 0.5         | Dev 1 | Cancellation works           |
| Manager Dashboard    | Team overview, pending count         | 1.5         | Dev 1 | Manager sees team stats      |
| Approval Queue       | List of pending approvals            | 2           | Dev 1 | Pending requests listed      |
| Approve/Deny Actions | Action buttons with comment modal    | 1.5         | Dev 1 | Approvals work from UI       |
| Toast Notifications  | Success/error feedback               | 0.5         | Dev 3 | Feedback shown to user       |
| Loading States       | Skeletons, spinners                  | 0.5         | Dev 3 | Loading states work          |

**Sprint 4 Total**: 18 person-days

**Risks & Mitigations**:
| Risk                   | Likelihood | Impact | Mitigation                                 |
| ---------------------- | ---------- | ------ | ------------------------------------------ |
| UI/UX issues           | Medium     | Medium | Iterative review, user feedback            |
| Date picker complexity | Medium     | Low    | Use established library (react-datepicker) |
| Mobile responsiveness  | Low        | Low    | MVP focuses on desktop, basic mobile       |

**Sprint 4 Deliverables**:
- ✅ Employee can view balances and request PTO
- ✅ Employee can view and cancel their requests
- ✅ Manager can view and process approval queue
- ✅ Responsive layout with loading states

---

### Week 5: Sprint 5 - Integration & Polish

**Objectives**: Add calendar view, notifications, and refine the user experience.

| Task               | Description                             | Effort (PD) | Owner | Done Criteria                |
| ------------------ | --------------------------------------- | ----------- | ----- | ---------------------------- |
| Calendar View      | Monthly calendar with PTO events        | 3           | Dev 3 | Calendar displays events     |
| Calendar Filters   | Filter by user, team, type              | 1           | Dev 3 | Filters work                 |
| Holiday Display    | Show holidays on calendar               | 0.5         | Dev 3 | Holidays marked              |
| Email Service      | Email sending infrastructure            | 1.5         | Dev 2 | Emails send via SendGrid/SES |
| Email Templates    | Request submitted, approved, denied     | 2           | Dev 2 | Templates render correctly   |
| Notification Model | In-app notification storage             | 1           | Dev 1 | Notifications stored         |
| Notification API   | Get, mark read endpoints                | 1           | Dev 1 | API works                    |
| Notification UI    | Bell icon, dropdown, unread count       | 2           | Dev 3 | Notifications display        |
| Notification Prefs | User preference settings                | 1           | Dev 1 | Preferences saved            |
| User Profile       | Edit profile, change password           | 1.5         | Dev 3 | Profile editable             |
| Admin Reporting    | Basic usage report (requests by period) | 2           | Dev 1 | Report generates             |
| Error States       | Empty states, error pages               | 1           | Dev 3 | Graceful error handling      |
| A11y Audit         | ARIA labels, keyboard nav               | 1           | Dev 3 | Key flows accessible         |

**Sprint 5 Total**: 18.5 person-days

**Risks & Mitigations**:
| Risk                 | Likelihood | Impact | Mitigation                               |
| -------------------- | ---------- | ------ | ---------------------------------------- |
| Email deliverability | Low        | Medium | Use established service, test thoroughly |
| Calendar performance | Medium     | Low    | Pagination, date range limits            |

**Sprint 5 Deliverables**:
- ✅ Calendar view showing team PTO
- ✅ Email notifications for key events
- ✅ In-app notification system
- ✅ Basic reporting for admins
- ✅ Improved UX with proper empty/error states

---

### Week 6: Sprint 6 - QA & Launch

**Objectives**: Comprehensive testing, bug fixes, documentation, and production deployment.

| Task               | Description                         | Effort (PD) | Owner | Done Criteria               |
| ------------------ | ----------------------------------- | ----------- | ----- | --------------------------- |
| Unit Test Coverage | Backend unit tests (>80% coverage)  | 2           | Dev 2 | Coverage target met         |
| Integration Tests  | API endpoint tests                  | 2           | Dev 1 | Key flows tested            |
| E2E Tests          | Critical user journeys (Playwright) | 2           | Dev 3 | Happy paths pass            |
| Bug Triage         | Identify and prioritize bugs        | 0.5         | All   | Bug list prioritized        |
| Bug Fixes          | Fix critical and high priority bugs | 3           | All   | Critical bugs resolved      |
| Security Review    | Auth, injection, XSS checks         | 1           | Dev 2 | No critical vulnerabilities |
| Performance Review | Load testing, query optimization    | 1           | Dev 2 | Acceptable response times   |
| API Documentation  | OpenAPI spec complete, README       | 1           | Dev 1 | Docs accurate               |
| User Guide         | Basic user documentation            | 1           | Dev 3 | Guide covers core flows     |
| Environment Setup  | Production environment config       | 1           | Dev 2 | Prod env ready              |
| Deployment Scripts | CI/CD for production                | 1           | Dev 1 | Automated deployment        |
| Data Migration     | Seed data, initial users            | 0.5         | Dev 1 | System ready for use        |
| Launch Checklist   | Final verification                  | 0.5         | All   | All items checked           |
| Soft Launch        | Deploy to production                | 0.5         | All   | System live                 |

**Sprint 6 Total**: 17 person-days

**Risks & Mitigations**:
| Risk                     | Likelihood | Impact | Mitigation                         |
| ------------------------ | ---------- | ------ | ---------------------------------- |
| Critical bugs discovered | Medium     | High   | Buffer time, prioritize ruthlessly |
| Deployment issues        | Low        | High   | Staging environment testing        |
| Missing features         | Low        | Medium | Clear MVP scope, defer to post-MVP |

**Sprint 6 Deliverables**:
- ✅ Test coverage meeting targets
- ✅ Critical bugs fixed
- ✅ Documentation complete
- ✅ Production deployment successful
- ✅ **MVP LAUNCHED** 🚀

---

## Effort Summary

| Sprint   | Person-Days | Running Total |
| -------- | ----------- | ------------- |
| Sprint 1 | 14          | 14            |
| Sprint 2 | 16          | 30            |
| Sprint 3 | 15.5        | 45.5          |
| Sprint 4 | 18          | 63.5          |
| Sprint 5 | 18.5        | 82            |
| Sprint 6 | 17          | 99            |

**Total Estimated Effort**: 99 person-days  
**Available Budget**: 90 person-days  
**Variance**: -9 person-days (10% over)

### Contingency Plan
To fit within 90 person-days:
1. Reduce Sprint 5 reporting scope (-2 days)
2. Simplify calendar to basic list view (-2 days)  
3. Reduce test coverage target to 70% (-2 days)
4. Defer notification preferences to post-MVP (-1 day)
5. Use basic email templates (-1 day)
6. Keep small buffer for unknowns (-1 day)

---

## MVP Feature Priority Matrix

| Feature                 | Priority | In MVP | Notes             |
| ----------------------- | -------- | ------ | ----------------- |
| User Authentication     | P0       | ✅      | Required          |
| User Management (Admin) | P0       | ✅      | Required          |
| Role-based Access       | P0       | ✅      | Required          |
| PTO Types Configuration | P0       | ✅      | Required          |
| Policy Configuration    | P0       | ✅      | Required          |
| Balance Tracking        | P0       | ✅      | Required          |
| Accrual Engine          | P0       | ✅      | Required          |
| PTO Request Submission  | P0       | ✅      | Required          |
| Manager Approval        | P0       | ✅      | Required          |
| Employee Dashboard      | P0       | ✅      | Required          |
| Manager Dashboard       | P0       | ✅      | Required          |
| Half-Day Requests       | P1       | ✅      | High value        |
| Email Notifications     | P1       | ✅      | High value        |
| Calendar View           | P1       | ✅      | High value        |
| In-App Notifications    | P2       | ✅      | Medium value      |
| Basic Reporting         | P2       | ✅      | Medium value      |
| Bulk Approval           | P2       | ❌      | Post-MVP          |
| Multi-Level Approval    | P2       | ❌      | Post-MVP          |
| Approval Delegation     | P2       | ❌      | Post-MVP          |
| Carryover Processing    | P1       | ⚠️      | Logic only, no UI |
| Advanced Reporting      | P3       | ❌      | Post-MVP          |
| Calendar Integration    | P3       | ❌      | Post-MVP          |
| SSO/SAML                | P3       | ❌      | Post-MVP          |
| Mobile App              | P4       | ❌      | Post-MVP          |

---

## Post-MVP Roadmap

### Phase 2 (Weeks 7-10)
- Bulk approval actions
- Approval delegation
- Carryover/expiration UI and automation
- Advanced reporting with export
- Team calendar with filters

### Phase 3 (Weeks 11-14)
- Multi-level approval workflows
- Google/Outlook calendar integration
- Slack/Teams notifications
- SSO integration (SAML)

### Phase 4 (Weeks 15-18)
- Mobile-responsive optimization
- Progressive Web App (PWA)
- API for third-party integrations
- Custom reporting builder

---

## Success Metrics

### MVP Launch Criteria
- [ ] All P0 features complete and tested
- [ ] No critical (P0) or high (P1) bugs open
- [ ] Core user flows pass E2E tests
- [ ] Performance: API responses < 500ms (p95)
- [ ] Security: No critical vulnerabilities

### Post-Launch Success Metrics
| Metric                  | Target           | Measurement |
| ----------------------- | ---------------- | ----------- |
| System Uptime           | 99.5%            | Monitoring  |
| API Error Rate          | < 1%             | Logging     |
| User Adoption           | 80% of employees | Analytics   |
| Request Processing Time | < 24 hours       | Metrics     |
| User Satisfaction       | > 4.0/5.0        | Survey      |

---

## Risk Register

| Risk                     | Probability | Impact   | Mitigation                       | Owner |
| ------------------------ | ----------- | -------- | -------------------------------- | ----- |
| Scope creep              | High        | High     | Strict MVP scope, defer requests | PM    |
| Key person unavailable   | Medium      | High     | Knowledge sharing, documentation | Lead  |
| Integration issues       | Medium      | Medium   | Early integration testing        | Dev 2 |
| Performance problems     | Low         | High     | Load testing, indexing strategy  | Dev 2 |
| Security vulnerabilities | Low         | Critical | Security review, OWASP checklist | Dev 2 |
| Unclear requirements     | Medium      | Medium   | Regular stakeholder check-ins    | PM    |
| Technical debt           | High        | Medium   | Code reviews, refactoring time   | Lead  |

---

## Dependencies

### External Dependencies
| Dependency                   | Status | Blocker? | Notes                      |
| ---------------------------- | ------ | -------- | -------------------------- |
| Design mockups               | Needed | Soft     | Can proceed with basic UI  |
| Email service (SendGrid/SES) | Needed | Soft     | Configure before Sprint 5  |
| Production environment       | Needed | Hard     | Required for Sprint 6      |
| Domain/SSL                   | Needed | Hard     | Required for Sprint 6      |
| HR policy details            | Needed | Soft     | Need sample policy configs |

### Internal Dependencies
| Dependency     | Sprint | Dependent On        |
| -------------- | ------ | ------------------- |
| Auth completed | 1      | Project setup       |
| Policies ready | 2      | User management     |
| Requests API   | 3      | Policies, Balances  |
| Frontend       | 4      | All backend APIs    |
| Notifications  | 5      | Requests, Approvals |

---

## Communication Plan

### Daily
- Standup: 15 min, async (Slack) or sync (video)
- Blockers raised immediately

### Weekly
- Sprint planning: Monday, 1 hour
- Demo/review: Friday, 30 min
- Retrospective: Friday, 30 min (bi-weekly)

### Stakeholder Updates
- Weekly status email
- Demo at end of each sprint
- Launch readiness review (Week 5)

---

This timeline provides a realistic path to MVP delivery in 6 weeks with a focused scope and clear priorities. Regular stakeholder communication and strict scope management are critical to success.
