# React Component Architecture

## Table of Contents

1. [Folder Structure](#folder-structure)
2. [Component Tree](#component-tree)
3. [Route Map](#route-map)
4. [State Management](#state-management)
5. [Cross-Cutting Concerns](#cross-cutting-concerns)
6. [UI Composition Patterns](#ui-composition-patterns)
7. [Reusable UI Primitives](#reusable-ui-primitives)
8. [Form Handling Strategy](#form-handling-strategy)

---

## Folder Structure

```
src/
├── app/                          # Application shell & routing
│   ├── App.tsx                   # Root component, providers
│   ├── routes.tsx                # Route definitions
│   └── providers/                # Global providers
│       ├── AuthProvider.tsx
│       ├── QueryProvider.tsx
│       ├── ThemeProvider.tsx
│       └── NotificationProvider.tsx
│
├── features/                     # Feature modules (domain-driven)
│   ├── auth/
│   │   ├── components/           # Feature-specific components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   └── ResetPasswordForm.tsx
│   │   ├── hooks/                # Feature-specific hooks
│   │   │   ├── useAuth.ts
│   │   │   └── useRefreshToken.ts
│   │   ├── api/                  # API calls for this feature
│   │   │   └── authApi.ts
│   │   ├── types/
│   │   │   └── auth.types.ts
│   │   └── index.ts              # Public exports
│   │
│   ├── pto-requests/
│   │   ├── components/
│   │   │   ├── RequestPtoModal.tsx
│   │   │   ├── RequestList.tsx
│   │   │   ├── RequestCard.tsx
│   │   │   ├── RequestFilters.tsx
│   │   │   ├── RequestTimeline.tsx
│   │   │   └── ConflictWarning.tsx
│   │   ├── hooks/
│   │   │   ├── usePtoRequests.ts
│   │   │   ├── useCreateRequest.ts
│   │   │   ├── useCancelRequest.ts
│   │   │   └── useRequestConflicts.ts
│   │   ├── api/
│   │   │   └── requestsApi.ts
│   │   ├── utils/
│   │   │   ├── dateCalculations.ts
│   │   │   └── conflictDetection.ts
│   │   └── types/
│   │       └── requests.types.ts
│   │
│   ├── approvals/
│   │   ├── components/
│   │   │   ├── ApprovalQueue.tsx
│   │   │   ├── ApprovalCard.tsx
│   │   │   ├── ApprovalActions.tsx
│   │   │   ├── BulkApprovalBar.tsx
│   │   │   └── DelegationSettings.tsx
│   │   ├── hooks/
│   │   │   ├── usePendingApprovals.ts
│   │   │   ├── useApproveRequest.ts
│   │   │   └── useDenyRequest.ts
│   │   └── api/
│   │       └── approvalsApi.ts
│   │
│   ├── balances/
│   │   ├── components/
│   │   │   ├── BalanceCard.tsx
│   │   │   ├── BalanceOverview.tsx
│   │   │   ├── AccrualHistory.tsx
│   │   │   ├── BalanceAdjustmentModal.tsx
│   │   │   └── ExpirationWarning.tsx
│   │   ├── hooks/
│   │   │   ├── useBalances.ts
│   │   │   ├── useBalanceLedger.ts
│   │   │   └── useAdjustBalance.ts
│   │   └── api/
│   │       └── balancesApi.ts
│   │
│   ├── policies/
│   │   ├── components/
│   │   │   ├── PolicyList.tsx
│   │   │   ├── PolicyEditor.tsx
│   │   │   ├── AccrualRuleBuilder.tsx
│   │   │   ├── CarryoverSettings.tsx
│   │   │   ├── PolicyAssignment.tsx
│   │   │   └── AccrualPreview.tsx
│   │   ├── hooks/
│   │   │   ├── usePolicies.ts
│   │   │   ├── usePolicy.ts
│   │   │   └── useAccrualPreview.ts
│   │   └── api/
│   │       └── policiesApi.ts
│   │
│   ├── calendar/
│   │   ├── components/
│   │   │   ├── PtoCalendar.tsx
│   │   │   ├── TeamCalendar.tsx
│   │   │   ├── HolidayManager.tsx
│   │   │   ├── CalendarLegend.tsx
│   │   │   └── CalendarFilters.tsx
│   │   ├── hooks/
│   │   │   ├── useCalendarEvents.ts
│   │   │   └── useHolidays.ts
│   │   └── api/
│   │       └── calendarApi.ts
│   │
│   ├── users/
│   │   ├── components/
│   │   │   ├── UserList.tsx
│   │   │   ├── UserProfile.tsx
│   │   │   ├── UserEditor.tsx
│   │   │   └── RoleManager.tsx
│   │   ├── hooks/
│   │   │   └── useUsers.ts
│   │   └── api/
│   │       └── usersApi.ts
│   │
│   ├── notifications/
│   │   ├── components/
│   │   │   ├── NotificationBell.tsx
│   │   │   ├── NotificationDropdown.tsx
│   │   │   ├── NotificationPreferences.tsx
│   │   │   └── NotificationItem.tsx
│   │   ├── hooks/
│   │   │   └── useNotifications.ts
│   │   └── api/
│   │       └── notificationsApi.ts
│   │
│   ├── reports/
│   │   ├── components/
│   │   │   ├── ReportDashboard.tsx
│   │   │   ├── UsageReport.tsx
│   │   │   ├── BalanceReport.tsx
│   │   │   ├── ReportFilters.tsx
│   │   │   └── ExportButton.tsx
│   │   ├── hooks/
│   │   │   └── useReports.ts
│   │   └── api/
│   │       └── reportsApi.ts
│   │
│   └── dashboard/
│       ├── components/
│       │   ├── EmployeeDashboard.tsx
│       │   ├── ManagerDashboard.tsx
│       │   ├── AdminDashboard.tsx
│       │   ├── QuickActions.tsx
│       │   ├── UpcomingPto.tsx
│       │   └── TeamSnapshot.tsx
│       └── hooks/
│           └── useDashboardData.ts
│
├── entities/                     # Shared business entities
│   ├── user/
│   │   ├── model.ts
│   │   └── types.ts
│   ├── pto-request/
│   │   ├── model.ts
│   │   ├── types.ts
│   │   └── status.ts
│   ├── policy/
│   │   ├── model.ts
│   │   └── types.ts
│   └── balance/
│       ├── model.ts
│       └── types.ts
│
├── shared/                       # Shared utilities & components
│   ├── api/
│   │   ├── client.ts             # Axios instance with interceptors
│   │   ├── errorHandler.ts
│   │   └── types.ts
│   ├── components/
│   │   ├── ui/                   # Base UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── DateRangePicker.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── RadioGroup.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   └── Footer.tsx
│   │   ├── feedback/
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ErrorFallback.tsx
│   │   │   ├── LoadingOverlay.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   └── guards/
│   │       ├── AuthGuard.tsx
│   │       ├── RoleGuard.tsx
│   │       └── FeatureGuard.tsx
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   ├── useClickOutside.ts
│   │   ├── usePagination.ts
│   │   └── useTimezone.ts
│   ├── utils/
│   │   ├── date.ts               # date-fns wrappers, timezone handling
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   ├── permissions.ts
│   │   └── constants.ts
│   ├── types/
│   │   ├── api.types.ts
│   │   ├── common.types.ts
│   │   └── permissions.types.ts
│   └── i18n/
│       ├── config.ts
│       └── locales/
│           ├── en.json
│           └── es.json
│
├── config/
│   ├── env.ts                    # Environment variables
│   ├── queryClient.ts            # React Query config
│   └── routes.ts                 # Route constants
│
└── index.tsx                     # Entry point
```

### Rationale

| Folder      | Purpose                                                |
| ----------- | ------------------------------------------------------ |
| `app/`      | Application bootstrap, global providers, routing shell |
| `features/` | Domain-driven feature modules, each self-contained     |
| `entities/` | Shared business models/types used across features      |
| `shared/`   | Reusable utilities, UI primitives, cross-cutting hooks |
| `config/`   | Application configuration, environment handling        |

This structure follows **Feature-Sliced Design** principles, enabling:

- Clear ownership and boundaries
- Easy code splitting at feature level
- Scalability as features grow
- Simplified testing per feature

---

## Component Tree

```
<App>
├── <QueryProvider>                         # React Query client
│   ├── <AuthProvider>                      # Auth context + token management
│   │   ├── <ThemeProvider>                 # Theme/dark mode
│   │   │   ├── <NotificationProvider>      # Toast notifications
│   │   │   │   ├── <ErrorBoundary>         # Global error boundary
│   │   │   │   │   ├── <BrowserRouter>
│   │   │   │   │   │   ├── <Routes>
│   │   │   │   │   │   │   │
│   │   │   │   │   │   │   ├── [/login] <LoginPage>
│   │   │   │   │   │   │   │   └── <LoginForm>
│   │   │   │   │   │   │   │       ├── <Input name="email" />
│   │   │   │   │   │   │   │       ├── <Input name="password" type="password" />
│   │   │   │   │   │   │   │       └── <Button type="submit">Login</Button>
│   │   │   │   │   │   │   │
│   │   │   │   │   │   │   ├── [/forgot-password] <ForgotPasswordPage>
│   │   │   │   │   │   │   │
│   │   │   │   │   │   │   ├── <AuthGuard>                    # Protected routes
│   │   │   │   │   │   │   │   ├── <AppShell>
│   │   │   │   │   │   │   │   │   ├── <Header>
│   │   │   │   │   │   │   │   │   │   ├── <Logo />
│   │   │   │   │   │   │   │   │   │   ├── <NotificationBell />
│   │   │   │   │   │   │   │   │   │   └── <UserMenu />
│   │   │   │   │   │   │   │   │   ├── <Sidebar>
│   │   │   │   │   │   │   │   │   │   ├── <NavItem to="/dashboard" />
│   │   │   │   │   │   │   │   │   │   ├── <NavItem to="/requests" />
│   │   │   │   │   │   │   │   │   │   ├── <NavItem to="/calendar" />
│   │   │   │   │   │   │   │   │   │   ├── <RoleGuard roles={['manager', 'admin']}>
│   │   │   │   │   │   │   │   │   │   │   └── <NavItem to="/approvals" />
│   │   │   │   │   │   │   │   │   │   ├── <RoleGuard roles={['admin']}>
│   │   │   │   │   │   │   │   │   │   │   ├── <NavItem to="/policies" />
│   │   │   │   │   │   │   │   │   │   │   ├── <NavItem to="/users" />
│   │   │   │   │   │   │   │   │   │   │   └── <NavItem to="/reports" />
│   │   │   │   │   │   │   │   │   │   └── <NavItem to="/settings" />
│   │   │   │   │   │   │   │   │   │
│   │   │   │   │   │   │   │   │   └── <main> {/* Page content */}
│   │   │   │   │   │   │   │   │
│   │   │   │   │   │   │   │   │       ├── [/dashboard] <DashboardPage>
│   │   │   │   │   │   │   │   │       │   ├── <RoleSwitcher> {/* Renders by role */}
│   │   │   │   │   │   │   │   │       │   │   ├── <EmployeeDashboard />
│   │   │   │   │   │   │   │   │       │   │   ├── <ManagerDashboard />
│   │   │   │   │   │   │   │   │       │   │   └── <AdminDashboard />
│   │   │   │   │   │   │   │   │       │
│   │   │   │   │   │   │   │   │       ├── [/requests] <RequestsPage>
│   │   │   │   │   │   │   │   │       │   ├── <PageHeader>
│   │   │   │   │   │   │   │   │       │   │   └── <Button>Request PTO</Button>
│   │   │   │   │   │   │   │   │       │   ├── <BalanceOverview />
│   │   │   │   │   │   │   │   │       │   ├── <RequestFilters />
│   │   │   │   │   │   │   │   │       │   ├── <RequestList />
│   │   │   │   │   │   │   │   │       │   └── <RequestPtoModal /> {/* Portal */}
│   │   │   │   │   │   │   │   │       │
│   │   │   │   │   │   │   │   │       ├── [/requests/:id] <RequestDetailPage>
│   │   │   │   │   │   │   │   │       │   ├── <RequestTimeline />
│   │   │   │   │   │   │   │   │       │   └── <RequestActions />
│   │   │   │   │   │   │   │   │       │
│   │   │   │   │   │   │   │   │       ├── [/calendar] <CalendarPage>
│   │   │   │   │   │   │   │   │       │   ├── <CalendarFilters />
│   │   │   │   │   │   │   │   │       │   ├── <PtoCalendar />
│   │   │   │   │   │   │   │   │       │   └── <CalendarLegend />
│   │   │   │   │   │   │   │   │       │
│   │   │   │   │   │   │   │   │       ├── [/approvals] <ApprovalsPage>
│   │   │   │   │   │   │   │   │       │   ├── <RoleGuard roles={['manager', 'admin']}>
│   │   │   │   │   │   │   │   │       │   │   ├── <BulkApprovalBar />
│   │   │   │   │   │   │   │   │       │   │   └── <ApprovalQueue />
│   │   │   │   │   │   │   │   │       │
│   │   │   │   │   │   │   │   │       ├── [/team] <TeamPage>
│   │   │   │   │   │   │   │   │       │   ├── <TeamCalendar />
│   │   │   │   │   │   │   │   │       │   └── <TeamBalances />
│   │   │   │   │   │   │   │   │       │
│   │   │   │   │   │   │   │   │       ├── [/policies] <PoliciesPage>
│   │   │   │   │   │   │   │   │       │   ├── <RoleGuard roles={['admin']}>
│   │   │   │   │   │   │   │   │       │   │   ├── <PolicyList />
│   │   │   │   │   │   │   │   │       │   │   └── <PolicyEditor /> {/* Modal/Drawer */}
│   │   │   │   │   │   │   │   │       │
│   │   │   │   │   │   │   │   │       ├── [/policies/:id] <PolicyDetailPage>
│   │   │   │   │   │   │   │   │       │   ├── <AccrualRuleBuilder />
│   │   │   │   │   │   │   │   │       │   ├── <CarryoverSettings />
│   │   │   │   │   │   │   │   │       │   └── <PolicyAssignment />
│   │   │   │   │   │   │   │   │       │
│   │   │   │   │   │   │   │   │       ├── [/users] <UsersPage>
│   │   │   │   │   │   │   │   │       │   ├── <RoleGuard roles={['admin']}>
│   │   │   │   │   │   │   │   │       │   │   ├── <UserList />
│   │   │   │   │   │   │   │   │       │   │   └── <UserEditor /> {/* Drawer */}
│   │   │   │   │   │   │   │   │       │
│   │   │   │   │   │   │   │   │       ├── [/users/:id] <UserDetailPage>
│   │   │   │   │   │   │   │   │       │   ├── <UserProfile />
│   │   │   │   │   │   │   │   │       │   ├── <BalanceOverview />
│   │   │   │   │   │   │   │   │       │   └── <BalanceAdjustmentModal />
│   │   │   │   │   │   │   │   │       │
│   │   │   │   │   │   │   │   │       ├── [/reports] <ReportsPage>
│   │   │   │   │   │   │   │   │       │   ├── <RoleGuard roles={['admin', 'manager']}>
│   │   │   │   │   │   │   │   │       │   │   ├── <ReportDashboard />
│   │   │   │   │   │   │   │   │       │   │   ├── <ReportFilters />
│   │   │   │   │   │   │   │   │       │   │   └── <ExportButton />
│   │   │   │   │   │   │   │   │       │
│   │   │   │   │   │   │   │   │       ├── [/settings] <SettingsPage>
│   │   │   │   │   │   │   │   │       │   ├── <Tabs>
│   │   │   │   │   │   │   │   │       │   │   ├── <ProfileSettings />
│   │   │   │   │   │   │   │   │       │   │   ├── <NotificationPreferences />
│   │   │   │   │   │   │   │   │       │   │   └── <RoleGuard roles={['admin']}>
│   │   │   │   │   │   │   │   │       │   │       ├── <HolidayManager />
│   │   │   │   │   │   │   │   │       │   │       └── <CompanySettings />
│   │   │   │   │   │   │   │   │       │
│   │   │   │   │   │   │   │   │       └── [/*] <NotFoundPage>
```

---

## Component Specifications

### Core Page Components

| Component           | Route           | Responsibility                 | Key Props | Internal State      | Data Source                          |
| ------------------- | --------------- | ------------------------------ | --------- | ------------------- | ------------------------------------ |
| `LoginPage`         | `/login`        | Authentication entry point     | -         | form state          | -                                    |
| `DashboardPage`     | `/dashboard`    | Role-based dashboard container | -         | -                   | useAuth (role)                       |
| `EmployeeDashboard` | -               | Employee home view             | -         | -                   | useBalances, useRequests             |
| `ManagerDashboard`  | -               | Manager home view              | -         | -                   | usePendingApprovals, useTeamCalendar |
| `AdminDashboard`    | -               | Admin/HR home view             | -         | -                   | useReports, usePolicies              |
| `RequestsPage`      | `/requests`     | PTO request management         | -         | filters, modal open | useRequests                          |
| `RequestDetailPage` | `/requests/:id` | Single request details         | -         | -                   | useRequest(id)                       |
| `CalendarPage`      | `/calendar`     | Calendar visualization         | -         | view mode, filters  | useCalendarEvents                    |
| `ApprovalsPage`     | `/approvals`    | Approval queue management      | -         | selected items      | usePendingApprovals                  |
| `PoliciesPage`      | `/policies`     | Policy configuration list      | -         | -                   | usePolicies                          |
| `PolicyDetailPage`  | `/policies/:id` | Policy editor                  | -         | form state          | usePolicy(id)                        |
| `UsersPage`         | `/users`        | User management                | -         | search, filters     | useUsers                             |
| `UserDetailPage`    | `/users/:id`    | User profile & balances        | -         | -                   | useUser(id), useBalances(userId)     |
| `ReportsPage`       | `/reports`      | Reporting dashboard            | -         | filters, date range | useReports                           |
| `SettingsPage`      | `/settings`     | User & system settings         | -         | active tab          | useAuth, usePreferences              |

### Feature Components

| Component            | Responsibility              | Key Props                                   | Internal State   | Data Source         |
| -------------------- | --------------------------- | ------------------------------------------- | ---------------- | ------------------- |
| `BalanceCard`        | Display single balance type | `balance: Balance`, `showHistory?: boolean` | -                | -                   |
| `BalanceOverview`    | Display all user balances   | `userId?: string`                           | -                | useBalances         |
| `RequestPtoModal`    | PTO request form            | `isOpen`, `onClose`, `onSuccess`            | form state       | useCreateRequest    |
| `RequestList`        | List of PTO requests        | `filters?: RequestFilters`                  | pagination       | useRequests         |
| `RequestCard`        | Single request summary      | `request: PtoRequest`                       | -                | -                   |
| `ApprovalQueue`      | Pending approvals list      | `filters?: ApprovalFilters`                 | selected         | usePendingApprovals |
| `ApprovalCard`       | Single approval item        | `request`, `onApprove`, `onDeny`            | loading          | -                   |
| `PolicyEditor`       | Policy form (create/edit)   | `policy?: Policy`, `onSave`                 | form state       | -                   |
| `AccrualRuleBuilder` | Configure accrual rules     | `rules`, `onChange`                         | -                | -                   |
| `PtoCalendar`        | Calendar view of PTO        | `userId?`, `teamId?`                        | view mode        | useCalendarEvents   |
| `TeamCalendar`       | Team PTO overview           | `managerId`                                 | date range       | useTeamCalendar     |
| `NotificationBell`   | Notification indicator      | -                                           | dropdown open    | useNotifications    |
| `UserList`           | User management table       | `filters`                                   | pagination, sort | useUsers            |

---

## Route Map

```typescript
// src/config/routes.ts

export const ROUTES = {
  // Public routes
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',
  
  // Protected routes - All roles
  DASHBOARD: '/dashboard',
  REQUESTS: '/requests',
  REQUEST_DETAIL: '/requests/:id',
  CALENDAR: '/calendar',
  SETTINGS: '/settings',
  
  // Protected routes - Manager + Admin
  APPROVALS: '/approvals',
  TEAM: '/team',
  
  // Protected routes - Admin only
  POLICIES: '/policies',
  POLICY_DETAIL: '/policies/:id',
  USERS: '/users',
  USER_DETAIL: '/users/:id',
  REPORTS: '/reports',
  HOLIDAYS: '/settings/holidays',
} as const;
```

### Route Configuration with Code Splitting

```tsx
// src/app/routes.tsx

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from '@/shared/components/guards/AuthGuard';
import { RoleGuard } from '@/shared/components/guards/RoleGuard';
import { AppShell } from '@/shared/components/layout/AppShell';
import { PageSkeleton } from '@/shared/components/ui/Skeleton';

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const RequestsPage = lazy(() => import('@/features/pto-requests/pages/RequestsPage'));
const RequestDetailPage = lazy(() => import('@/features/pto-requests/pages/RequestDetailPage'));
const CalendarPage = lazy(() => import('@/features/calendar/pages/CalendarPage'));
const ApprovalsPage = lazy(() => import('@/features/approvals/pages/ApprovalsPage'));
const PoliciesPage = lazy(() => import('@/features/policies/pages/PoliciesPage'));
const PolicyDetailPage = lazy(() => import('@/features/policies/pages/PolicyDetailPage'));
const UsersPage = lazy(() => import('@/features/users/pages/UsersPage'));
const UserDetailPage = lazy(() => import('@/features/users/pages/UserDetailPage'));
const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage'));
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'));
const NotFoundPage = lazy(() => import('@/shared/components/NotFoundPage'));

export function AppRoutes() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        {/* Protected routes */}
        <Route element={<AuthGuard><AppShell /></AuthGuard>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/requests/:id" element={<RequestDetailPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          
          {/* Manager + Admin routes */}
          <Route element={<RoleGuard roles={['manager', 'admin']} />}>
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/team" element={<TeamPage />} />
          </Route>
          
          {/* Admin only routes */}
          <Route element={<RoleGuard roles={['admin']} />}>
            <Route path="/policies" element={<PoliciesPage />} />
            <Route path="/policies/:id" element={<PolicyDetailPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/:id" element={<UserDetailPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
        </Route>
        
        {/* Redirects & fallback */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
```

---

## State Management

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        State Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │   Server State  │    │   Client State  │                     │
│  │  (React Query)  │    │    (Context)    │                     │
│  ├─────────────────┤    ├─────────────────┤                     │
│  │ • PTO Requests  │    │ • Auth/Session  │                     │
│  │ • Balances      │    │ • Theme         │                     │
│  │ • Policies      │    │ • UI State      │                     │
│  │ • Users         │    │ • Feature Flags │                     │
│  │ • Notifications │    │ • Preferences   │                     │
│  │ • Reports       │    │                 │                     │
│  └─────────────────┘    └─────────────────┘                     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     Local Component State                    ││
│  │  • Form inputs    • Modal open/close    • Pagination        ││
│  │  • Selections     • Filters             • Sorting           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### React Query Configuration

```typescript
// src/config/queryClient.ts

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

// Query key factory for type-safe keys
export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const,
    user: ['auth', 'user'] as const,
  },
  users: {
    all: ['users'] as const,
    list: (filters: object) => ['users', 'list', filters] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  requests: {
    all: ['requests'] as const,
    list: (filters: object) => ['requests', 'list', filters] as const,
    detail: (id: string) => ['requests', 'detail', id] as const,
    myRequests: (userId: string) => ['requests', 'user', userId] as const,
  },
  approvals: {
    pending: (managerId: string) => ['approvals', 'pending', managerId] as const,
  },
  balances: {
    all: ['balances'] as const,
    user: (userId: string) => ['balances', 'user', userId] as const,
    ledger: (userId: string, type: string) => ['balances', 'ledger', userId, type] as const,
  },
  policies: {
    all: ['policies'] as const,
    detail: (id: string) => ['policies', 'detail', id] as const,
    preview: (id: string, params: object) => ['policies', 'preview', id, params] as const,
  },
  calendar: {
    events: (params: object) => ['calendar', 'events', params] as const,
    holidays: (year: number) => ['calendar', 'holidays', year] as const,
  },
  notifications: {
    unread: ['notifications', 'unread'] as const,
    all: ['notifications', 'all'] as const,
  },
  reports: {
    usage: (params: object) => ['reports', 'usage', params] as const,
    balances: (params: object) => ['reports', 'balances', params] as const,
  },
} as const;
```

### Auth Context

```typescript
// src/app/providers/AuthProvider.tsx

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User } from '@/entities/user/types';
import { authApi } from '@/features/auth/api/authApi';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: true, 
        isLoading: false 
      };
    case 'AUTH_FAILURE':
      return { 
        ...state, 
        user: null, 
        isAuthenticated: false, 
        isLoading: false, 
        error: action.payload 
      };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'UPDATE_USER':
      return { 
        ...state, 
        user: state.user ? { ...state.user, ...action.payload } : null 
      };
    default:
      return state;
  }
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await authApi.getSession();
        dispatch({ type: 'AUTH_SUCCESS', payload: user });
      } catch {
        dispatch({ type: 'LOGOUT' });
      }
    };
    initAuth();
  }, []);
  
  const login = async (email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const { user, accessToken, refreshToken } = await authApi.login(email, password);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message });
      throw error;
    }
  };
  
  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch({ type: 'LOGOUT' });
    }
  };
  
  const refreshSession = async () => {
    try {
      const { accessToken, refreshToken } = await authApi.refresh();
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    } catch {
      dispatch({ type: 'LOGOUT' });
    }
  };
  
  const hasRole = (role: string | string[]) => {
    if (!state.user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.some(r => state.user!.roles.includes(r));
  };
  
  const hasPermission = (permission: string) => {
    if (!state.user) return false;
    return state.user.permissions.includes(permission);
  };
  
  return (
    <AuthContext.Provider value={{ 
      ...state, 
      login, 
      logout, 
      refreshSession, 
      hasRole, 
      hasPermission 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

## Cross-Cutting Concerns

### 1. Auth Guard

```tsx
// src/shared/components/guards/AuthGuard.tsx

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { LoadingOverlay } from '@/shared/components/feedback/LoadingOverlay';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return <LoadingOverlay />;
  }
  
  if (!isAuthenticated) {
    // Save intended destination for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
}
```

### 2. Role Guard

```tsx
// src/shared/components/guards/RoleGuard.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';

interface RoleGuardProps {
  roles: string[];
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

export function RoleGuard({ roles, fallback, children }: RoleGuardProps) {
  const { hasRole } = useAuth();
  
  if (!hasRole(roles)) {
    if (fallback) return <>{fallback}</>;
    return <Navigate to="/dashboard" replace />;
  }
  
  return children ? <>{children}</> : <Outlet />;
}
```

### 3. Error Boundary

```tsx
// src/shared/components/feedback/ErrorBoundary.tsx

import { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
    // Could send to error tracking service here
  }
  
  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <ErrorFallback 
          error={this.state.error} 
          onReset={this.handleReset} 
        />
      );
    }
    
    return this.props.children;
  }
}
```

### 4. Feature Flags

```tsx
// src/shared/components/guards/FeatureGuard.tsx

import { createContext, useContext, ReactNode } from 'react';

interface FeatureFlags {
  calendarIntegration: boolean;
  slackNotifications: boolean;
  advancedReporting: boolean;
  multiLevelApproval: boolean;
  halfDayRequests: boolean;
  negativeBalances: boolean;
}

const defaultFlags: FeatureFlags = {
  calendarIntegration: false,
  slackNotifications: false,
  advancedReporting: false,
  multiLevelApproval: false,
  halfDayRequests: true,
  negativeBalances: false,
};

const FeatureFlagContext = createContext<FeatureFlags>(defaultFlags);

export function FeatureFlagProvider({ 
  children, 
  flags 
}: { 
  children: ReactNode; 
  flags?: Partial<FeatureFlags>; 
}) {
  const mergedFlags = { ...defaultFlags, ...flags };
  return (
    <FeatureFlagContext.Provider value={mergedFlags}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  const flags = useContext(FeatureFlagContext);
  return flags[flag];
}

export function FeatureGuard({ 
  flag, 
  children, 
  fallback = null 
}: { 
  flag: keyof FeatureFlags; 
  children: ReactNode; 
  fallback?: ReactNode;
}) {
  const isEnabled = useFeatureFlag(flag);
  return isEnabled ? <>{children}</> : <>{fallback}</>;
}
```

### 5. Loading & Skeleton Strategies

```tsx
// src/shared/components/ui/Skeleton.tsx

import { cn } from '@/shared/utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({ 
  className, 
  variant = 'text', 
  width, 
  height,
  animation = 'pulse' 
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700',
        animation === 'pulse' && 'animate-pulse',
        animation === 'wave' && 'animate-shimmer',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded h-4',
        variant === 'rectangular' && 'rounded-md',
        className
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

// Composable skeleton patterns
export function CardSkeleton() {
  return (
    <div className="p-4 border rounded-lg" aria-label="Loading content">
      <Skeleton className="h-6 w-3/4 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6 mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4" />
        </td>
      ))}
    </tr>
  );
}

export function PageSkeleton() {
  return (
    <div className="p-6 space-y-6" aria-label="Loading page">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
```

### 6. Accessibility (ARIA) Patterns

```tsx
// src/shared/utils/accessibility.ts

// Focus trap hook for modals
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();
    
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);
  
  return containerRef;
}

// Announce to screen readers
export function useAnnounce() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const el = document.createElement('div');
    el.setAttribute('aria-live', priority);
    el.setAttribute('aria-atomic', 'true');
    el.className = 'sr-only';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => document.body.removeChild(el), 1000);
  }, []);
  
  return announce;
}
```

### 7. i18n Setup

```typescript
// src/shared/i18n/config.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import es from './locales/es.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React handles escaping
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;

// Sample locale file structure
// src/shared/i18n/locales/en.json
/*
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "loading": "Loading...",
    "error": "An error occurred"
  },
  "auth": {
    "login": "Log In",
    "logout": "Log Out",
    "email": "Email",
    "password": "Password"
  },
  "pto": {
    "vacation": "Vacation",
    "sick": "Sick Leave",
    "personal": "Personal Day",
    "balance": "Balance",
    "request": "Request PTO",
    "approve": "Approve",
    "deny": "Deny"
  },
  "dates": {
    "today": "Today",
    "days": "{{count}} day",
    "days_plural": "{{count}} days"
  }
}
*/
```

---

## UI Composition Patterns

### 1. Compound Components (Modal Example)

```tsx
// src/shared/components/ui/Modal.tsx

import { createContext, useContext, ReactNode } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { Fragment } from 'react';
import { X } from 'lucide-react';

interface ModalContextValue {
  onClose: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) throw new Error('Modal components must be used within Modal');
  return context;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

function ModalRoot({ isOpen, onClose, children, size = 'md' }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };
  
  return (
    <ModalContext.Provider value={{ onClose }}>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog onClose={onClose} className="relative z-50">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </TransitionChild>
          
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel 
                className={`w-full ${sizeClasses[size]} bg-white dark:bg-gray-800 
                           rounded-xl shadow-xl`}
              >
                {children}
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </ModalContext.Provider>
  );
}

function ModalHeader({ children }: { children: ReactNode }) {
  const { onClose } = useModalContext();
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <DialogTitle className="text-lg font-semibold">{children}</DialogTitle>
      <button
        onClick={onClose}
        className="p-1 hover:bg-gray-100 rounded-full"
        aria-label="Close modal"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

function ModalBody({ children }: { children: ReactNode }) {
  return <div className="p-4">{children}</div>;
}

function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end gap-2 p-4 border-t bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
      {children}
    </div>
  );
}

// Export as compound component
export const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
});

// Usage example:
/*
<Modal isOpen={isOpen} onClose={handleClose} size="lg">
  <Modal.Header>Request PTO</Modal.Header>
  <Modal.Body>
    <RequestPtoForm />
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={handleClose}>Cancel</Button>
    <Button type="submit" form="pto-form">Submit Request</Button>
  </Modal.Footer>
</Modal>
*/
```

### 2. Headless Component Pattern (Dropdown)

```tsx
// src/shared/components/ui/Dropdown.tsx

import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import { Fragment, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownOption {
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, options, onSelect, align = 'left' }: DropdownProps) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton as={Fragment}>{trigger}</MenuButton>
      
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems 
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} 
                     mt-2 w-56 origin-top-${align} rounded-md bg-white 
                     shadow-lg ring-1 ring-black/5 focus:outline-none z-10`}
        >
          <div className="py-1">
            {options.map((option) => (
              <MenuItem key={option.value} disabled={option.disabled}>
                {({ active }) => (
                  <button
                    onClick={() => onSelect(option.value)}
                    className={`
                      ${active ? 'bg-gray-100' : ''}
                      ${option.danger ? 'text-red-600' : 'text-gray-900'}
                      ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                      flex w-full items-center gap-2 px-4 py-2 text-sm
                    `}
                  >
                    {option.icon}
                    {option.label}
                  </button>
                )}
              </MenuItem>
            ))}
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
}
```

---

## Reusable UI Primitives

### Button Component

```tsx
// src/shared/components/ui/Button.tsx

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading, 
    leftIcon, 
    rightIcon, 
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
      link: 'text-blue-600 hover:underline focus:ring-blue-500 p-0',
    };
    
    const sizes = {
      sm: 'text-sm px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-6 py-3 gap-2',
    };
    
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### DataTable Component

```tsx
// src/shared/components/ui/DataTable.tsx

import { ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  isLoading?: boolean;
  emptyState?: {
    title: string;
    description?: string;
    action?: ReactNode;
  };
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  onRowClick?: (row: T) => void;
  selectedRows?: Set<string>;
  onSelectRow?: (id: string) => void;
  onSelectAll?: () => void;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  isLoading,
  emptyState,
  sortField,
  sortDirection,
  onSort,
  pagination,
  onRowClick,
  selectedRows,
  onSelectRow,
  onSelectAll,
}: DataTableProps<T>) {
  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;
    
    if (sortField !== column.key) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    }
    
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4" /> 
      : <ChevronDown className="w-4 h-4" />;
  };
  
  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton className="h-4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  
  if (data.length === 0 && emptyState) {
    return (
      <EmptyState 
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
      />
    );
  }
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full" role="grid">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {onSelectRow && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows?.size === data.length}
                    onChange={onSelectAll}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th 
                  key={column.key}
                  className="px-4 py-3 text-left text-sm font-medium text-gray-600"
                  style={{ width: column.width }}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => onSort?.(column.key)}
                      className="flex items-center gap-1 hover:text-gray-900"
                      aria-sort={
                        sortField === column.key 
                          ? sortDirection === 'asc' ? 'ascending' : 'descending'
                          : 'none'
                      }
                    >
                      {column.header}
                      {renderSortIcon(column)}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const id = String(row[keyField]);
              const isSelected = selectedRows?.has(id);
              
              return (
                <tr 
                  key={id}
                  className={`border-t hover:bg-gray-50 dark:hover:bg-gray-800 
                             ${onRowClick ? 'cursor-pointer' : ''}
                             ${isSelected ? 'bg-blue-50' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {onSelectRow && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectRow(id)}
                        aria-label={`Select row ${id}`}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-sm">
                      {column.render 
                        ? column.render(row) 
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {pagination && (
        <div className="px-4 py-3 border-t bg-gray-50">
          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}
    </div>
  );
}
```

### DatePicker Component

```tsx
// src/shared/components/ui/DatePicker.tsx

import { forwardRef } from 'react';
import ReactDatePicker from 'react-datepicker';
import { Calendar } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import 'react-datepicker/dist/react-datepicker.css';

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  excludeDates?: Date[];
  highlightDates?: Date[];
  disabled?: boolean;
  error?: string;
  filterDate?: (date: Date) => boolean;
  showTimeSelect?: boolean;
  dateFormat?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ 
    value, 
    onChange, 
    placeholder = 'Select date',
    minDate,
    maxDate,
    excludeDates,
    highlightDates,
    disabled,
    error,
    filterDate,
    showTimeSelect,
    dateFormat = 'MM/dd/yyyy',
  }, ref) => {
    return (
      <div className="relative">
        <ReactDatePicker
          selected={value}
          onChange={onChange}
          placeholderText={placeholder}
          minDate={minDate}
          maxDate={maxDate}
          excludeDates={excludeDates}
          highlightDates={highlightDates}
          disabled={disabled}
          filterDate={filterDate}
          showTimeSelect={showTimeSelect}
          dateFormat={showTimeSelect ? 'MM/dd/yyyy h:mm aa' : dateFormat}
          className={cn(
            'w-full px-3 py-2 pl-10 border rounded-md focus:outline-none focus:ring-2',
            error 
              ? 'border-red-500 focus:ring-red-200' 
              : 'border-gray-300 focus:ring-blue-200',
            disabled && 'bg-gray-100 cursor-not-allowed'
          )}
          calendarClassName="shadow-lg border-0"
          showPopperArrow={false}
          aria-invalid={!!error}
          aria-describedby={error ? 'date-error' : undefined}
        />
        <Calendar 
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" 
          aria-hidden="true"
        />
        {error && (
          <p id="date-error" className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
```

---

## Form Handling Strategy

### React Hook Form + Zod

```typescript
// src/features/pto-requests/components/RequestPtoForm.tsx

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addDays, isWeekend, isBefore, startOfToday } from 'date-fns';
import { Button } from '@/shared/components/ui/Button';
import { DateRangePicker } from '@/shared/components/ui/DateRangePicker';
import { Select } from '@/shared/components/ui/Select';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { requestsApi } from '../api/requestsApi';
import { queryKeys } from '@/config/queryClient';
import { useHolidays } from '@/features/calendar/hooks/useHolidays';
import { useBalances } from '@/features/balances/hooks/useBalances';
import { calculateBusinessDays } from '../utils/dateCalculations';

// Validation schema with Zod
const ptoRequestSchema = z.object({
  ptoTypeId: z.string().min(1, 'Please select a PTO type'),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date({
    required_error: 'End date is required',
  }),
  isHalfDayStart: z.boolean().default(false),
  isHalfDayEnd: z.boolean().default(false),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
}).refine(
  (data) => !isBefore(data.endDate, data.startDate),
  {
    message: 'End date cannot be before start date',
    path: ['endDate'],
  }
).refine(
  (data) => !isBefore(data.startDate, startOfToday()),
  {
    message: 'Cannot request PTO for past dates',
    path: ['startDate'],
  }
);

type PtoRequestFormData = z.infer<typeof ptoRequestSchema>;

interface RequestPtoFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function RequestPtoForm({ onSuccess, onCancel }: RequestPtoFormProps) {
  const queryClient = useQueryClient();
  const { data: balances } = useBalances();
  const { data: holidays } = useHolidays(new Date().getFullYear());
  
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<PtoRequestFormData>({
    resolver: zodResolver(ptoRequestSchema),
    defaultValues: {
      ptoTypeId: '',
      isHalfDayStart: false,
      isHalfDayEnd: false,
      notes: '',
    },
  });
  
  const watchedValues = watch();
  
  // Calculate requested days
  const requestedDays = useMemo(() => {
    if (!watchedValues.startDate || !watchedValues.endDate) return 0;
    
    return calculateBusinessDays(
      watchedValues.startDate,
      watchedValues.endDate,
      holidays?.map(h => new Date(h.date)) || [],
      watchedValues.isHalfDayStart,
      watchedValues.isHalfDayEnd
    );
  }, [watchedValues.startDate, watchedValues.endDate, 
      watchedValues.isHalfDayStart, watchedValues.isHalfDayEnd, holidays]);
  
  // Get selected balance
  const selectedBalance = balances?.find(b => b.typeId === watchedValues.ptoTypeId);
  const remainingBalance = selectedBalance 
    ? selectedBalance.available - requestedDays 
    : null;
  
  const createRequest = useMutation({
    mutationFn: requestsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.balances.all });
      onSuccess();
    },
    onError: (error: any) => {
      if (error.response?.data?.code === 'OVERLAP_CONFLICT') {
        setError('startDate', { 
          message: 'This date range overlaps with an existing request' 
        });
      } else if (error.response?.data?.code === 'INSUFFICIENT_BALANCE') {
        setError('ptoTypeId', { 
          message: 'Insufficient balance for this request' 
        });
      }
    },
  });
  
  const onSubmit = (data: PtoRequestFormData) => {
    createRequest.mutate(data);
  };
  
  const ptoTypeOptions = balances?.map(b => ({
    value: b.typeId,
    label: `${b.typeName} (${b.available} days available)`,
  })) || [];
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} id="pto-form" className="space-y-4">
      {/* PTO Type Select */}
      <div>
        <label htmlFor="ptoTypeId" className="block text-sm font-medium mb-1">
          PTO Type <span className="text-red-500">*</span>
        </label>
        <Controller
          name="ptoTypeId"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              id="ptoTypeId"
              options={ptoTypeOptions}
              placeholder="Select PTO type"
              error={errors.ptoTypeId?.message}
            />
          )}
        />
      </div>
      
      {/* Date Range */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Date Range <span className="text-red-500">*</span>
        </label>
        <Controller
          name="startDate"
          control={control}
          render={({ field: startField }) => (
            <Controller
              name="endDate"
              control={control}
              render={({ field: endField }) => (
                <DateRangePicker
                  startDate={startField.value}
                  endDate={endField.value}
                  onStartChange={startField.onChange}
                  onEndChange={endField.onChange}
                  minDate={startOfToday()}
                  filterDate={(date) => !isWeekend(date)}
                  excludeDates={holidays?.map(h => new Date(h.date))}
                  error={errors.startDate?.message || errors.endDate?.message}
                />
              )}
            />
          )}
        />
      </div>
      
      {/* Half-day options */}
      <div className="flex gap-4">
        <Controller
          name="isHalfDayStart"
          control={control}
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onChange={field.onChange}
              label="Half day (start)"
            />
          )}
        />
        <Controller
          name="isHalfDayEnd"
          control={control}
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onChange={field.onChange}
              label="Half day (end)"
            />
          )}
        />
      </div>
      
      {/* Request summary */}
      {requestedDays > 0 && (
        <div 
          className={`p-3 rounded-md ${
            remainingBalance !== null && remainingBalance < 0 
              ? 'bg-red-50 border border-red-200' 
              : 'bg-blue-50 border border-blue-200'
          }`}
          role="status"
          aria-live="polite"
        >
          <p className="text-sm">
            <strong>Requesting:</strong> {requestedDays} day{requestedDays !== 1 ? 's' : ''}
          </p>
          {remainingBalance !== null && (
            <p className={`text-sm ${remainingBalance < 0 ? 'text-red-600' : ''}`}>
              <strong>Remaining balance:</strong> {remainingBalance} days
              {remainingBalance < 0 && ' (requires approval for negative balance)'}
            </p>
          )}
        </div>
      )}
      
      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-1">
          Notes (optional)
        </label>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              id="notes"
              placeholder="Add any notes for your manager..."
              rows={3}
              maxLength={500}
              error={errors.notes?.message}
            />
          )}
        />
      </div>
      
      {/* Form actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          isLoading={isSubmitting || createRequest.isPending}
          disabled={requestedDays === 0}
        >
          Submit Request
        </Button>
      </div>
    </form>
  );
}
```

### Form Validation Utilities

```typescript
// src/shared/utils/validation.ts

import { z } from 'zod';

// Common validation schemas
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const requiredString = (field: string) =>
  z.string().min(1, `${field} is required`);

export const optionalString = z.string().optional();

export const positiveNumber = (field: string) =>
  z.number().positive(`${field} must be positive`);

export const dateSchema = z.date({
  required_error: 'Date is required',
  invalid_type_error: 'Invalid date',
});

export const futureDateSchema = dateSchema.refine(
  (date) => date > new Date(),
  { message: 'Date must be in the future' }
);

// PTO-specific validations
export const ptoHoursSchema = z
  .number()
  .min(0.5, 'Minimum 0.5 hours')
  .max(8, 'Maximum 8 hours per day')
  .multipleOf(0.5, 'Hours must be in 0.5 increments');

export const balanceAdjustmentSchema = z.object({
  userId: z.string().uuid(),
  ptoTypeId: z.string().uuid(),
  hours: z.number(),
  reason: z.string().min(1, 'Reason is required').max(255),
  effectiveDate: dateSchema,
});
```

---

## API Client Setup

```typescript
// src/shared/api/client.ts

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authApi } from '@/features/auth/api/authApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const { accessToken, refreshToken } = await authApi.refresh();
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

// Typed API error
export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, string[]>;
}

export function isApiError(error: unknown): error is AxiosError<ApiError> {
  return axios.isAxiosError(error);
}
```

---

## Summary

This React architecture provides:

1. **Scalable folder structure** using Feature-Sliced Design
2. **Efficient state management** with React Query for server state and Context for client state
3. **Strong typing** with TypeScript throughout
4. **Robust form handling** using React Hook Form + Zod validation
5. **Accessible components** with proper ARIA attributes and keyboard navigation
6. **Code splitting** for optimal bundle sizes
7. **Comprehensive UI primitives** that are composable and reusable
8. **Cross-cutting concerns** handled systematically (auth, errors, loading, i18n)

The component tree and route map provide a clear overview of the application structure, while the detailed component specifications ensure implementation consistency.
