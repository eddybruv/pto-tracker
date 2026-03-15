/**
 * In-memory mock database for development without PostgreSQL
 * Data resets on server restart
 */

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import type { 
  User, Role, PtoType, Policy, PtoBalance, PtoRequest, Holiday, Team,
  RequestStatus, AccrualFrequency
} from '../types/index.js';

// ============================================
// INTERNAL TYPES (with password field)
// ============================================

interface MockUser extends User {
  _passwordHash: string; // Internal field for mock auth
}

// ============================================
// MOCK DATA STORE
// ============================================

export const mockData = {
  users: [] as MockUser[],
  roles: [] as { id: string; name: Role; description: string }[],
  userRoles: [] as { userId: string; roleId: string }[],
  refreshTokens: [] as { id: string; user_id: string; token: string; expires_at: Date }[],
  ptoTypes: [] as PtoType[],
  policies: [] as Policy[],
  policyAssignments: [] as { policyId: string; userId?: string; teamId?: string }[],
  ptoBalances: [] as PtoBalance[],
  ptoRequests: [] as PtoRequest[],
  approvals: [] as { id: string; requestId: string; approverId: string; status: string; comment?: string; actedAt?: Date }[],
  holidays: [] as Holiday[],
  teams: [] as Team[],
};

// ============================================
// SEED INITIAL DATA
// ============================================

async function seedData(): Promise<void> {
  const now = new Date();

  // Roles
  mockData.roles = [
    { id: uuidv4(), name: 'developer', description: 'Regular developer' },
    { id: uuidv4(), name: 'tech_lead', description: 'Tech lead - can approve requests' },
    { id: uuidv4(), name: 'admin', description: 'Administrator' },
  ];

  // Teams
  const frontendTeamId = uuidv4();
  const backendTeamId = uuidv4();
  const platformTeamId = uuidv4();

  mockData.teams = [
    { id: frontendTeamId, name: 'Frontend', code: 'FE', leadId: null, isActive: true, createdAt: now, updatedAt: now },
    { id: backendTeamId, name: 'Backend', code: 'BE', leadId: null, isActive: true, createdAt: now, updatedAt: now },
    { id: platformTeamId, name: 'Platform', code: 'PL', leadId: null, isActive: true, createdAt: now, updatedAt: now },
  ];

  // Create users
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Admin user
  const adminId = uuidv4();
  mockData.users.push({
    id: adminId,
    email: 'admin@company.com',
    passwordHash: hashedPassword,
    _passwordHash: hashedPassword,
    firstName: 'Admin',
    lastName: 'User',
    displayName: 'Admin User',
    avatarUrl: null,
    managerId: null,
    teamId: null,
    hireDate: new Date('2024-01-01'),
    timezone: 'America/New_York',
    status: 'active',
    lastLoginAt: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });

  const adminRole = mockData.roles.find(r => r.name === 'admin')!;
  mockData.userRoles.push({ userId: adminId, roleId: adminRole.id });

  // Tech Lead
  const leadId = uuidv4();
  mockData.users.push({
    id: leadId,
    email: 'lead@company.com',
    passwordHash: hashedPassword,
    _passwordHash: hashedPassword,
    firstName: 'Tech',
    lastName: 'Lead',
    displayName: 'Tech Lead',
    avatarUrl: null,
    managerId: adminId,
    teamId: frontendTeamId,
    hireDate: new Date('2024-03-15'),
    timezone: 'America/New_York',
    status: 'active',
    lastLoginAt: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });

  const leadRole = mockData.roles.find(r => r.name === 'tech_lead')!;
  mockData.userRoles.push({ userId: leadId, roleId: leadRole.id });

  // Update team lead
  const frontendTeam = mockData.teams.find(t => t.id === frontendTeamId);
  if (frontendTeam) frontendTeam.leadId = leadId;

  // Developer
  const devId = uuidv4();
  mockData.users.push({
    id: devId,
    email: 'dev@company.com',
    passwordHash: hashedPassword,
    _passwordHash: hashedPassword,
    firstName: 'Test',
    lastName: 'Developer',
    displayName: 'Test Developer',
    avatarUrl: null,
    managerId: leadId,
    teamId: frontendTeamId,
    hireDate: new Date('2024-06-01'),
    timezone: 'America/New_York',
    status: 'active',
    lastLoginAt: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });

  const devRole = mockData.roles.find(r => r.name === 'developer')!;
  mockData.userRoles.push({ userId: devId, roleId: devRole.id });

  // PTO Types
  const vacationId = uuidv4();
  const sickId = uuidv4();
  const personalId = uuidv4();

  mockData.ptoTypes = [
    { id: vacationId, name: 'Vacation', code: 'VAC', color: '#4CAF50', isPaid: true, requiresApproval: true, isActive: true, createdAt: now, updatedAt: now },
    { id: sickId, name: 'Sick Leave', code: 'SICK', color: '#F44336', isPaid: true, requiresApproval: false, isActive: true, createdAt: now, updatedAt: now },
    { id: personalId, name: 'Personal', code: 'PER', color: '#2196F3', isPaid: true, requiresApproval: true, isActive: true, createdAt: now, updatedAt: now },
  ];

  // Default Policy
  const policyId = uuidv4();
  const policy: Policy = {
    id: policyId,
    name: 'Standard PTO Policy',
    ptoTypeId: vacationId,
    accrualRate: 10, // 10 hours per month
    accrualFrequency: 'monthly' as AccrualFrequency,
    maxAccrual: 200,
    carryoverCap: 40,
    carryoverExpiryMonths: 3,
    allowNegative: false,
    maxNegative: 0,
    probationDays: 90,
    minIncrementHours: 4,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  mockData.policies.push(policy);

  // Assign policy to all users
  mockData.users.forEach(user => {
    mockData.policyAssignments.push({ policyId: policyId, userId: user.id });
  });

  // Initial balances for each user
  mockData.users.forEach(user => {
    // Vacation balance
    mockData.ptoBalances.push({
      id: uuidv4(),
      userId: user.id,
      ptoTypeId: vacationId,
      policyId: policyId,
      availableHours: 120,
      pendingHours: 0,
      usedYtd: 0,
      accruedYtd: 120,
      carryoverHours: 0,
      carryoverExpires: null,
      createdAt: now,
      updatedAt: now,
    });
    // Sick leave balance
    mockData.ptoBalances.push({
      id: uuidv4(),
      userId: user.id,
      ptoTypeId: sickId,
      policyId: policyId,
      availableHours: 80,
      pendingHours: 0,
      usedYtd: 0,
      accruedYtd: 80,
      carryoverHours: 0,
      carryoverExpires: null,
      createdAt: now,
      updatedAt: now,
    });
  });

  // Sample holidays for 2026
  mockData.holidays = [
    { id: uuidv4(), name: "New Year's Day", date: new Date('2026-01-01'), isRecurring: true, recurrenceRule: null, createdAt: now, updatedAt: now },
    { id: uuidv4(), name: 'MLK Day', date: new Date('2026-01-19'), isRecurring: false, recurrenceRule: null, createdAt: now, updatedAt: now },
    { id: uuidv4(), name: "Presidents' Day", date: new Date('2026-02-16'), isRecurring: false, recurrenceRule: null, createdAt: now, updatedAt: now },
    { id: uuidv4(), name: 'Memorial Day', date: new Date('2026-05-25'), isRecurring: false, recurrenceRule: null, createdAt: now, updatedAt: now },
    { id: uuidv4(), name: 'Independence Day', date: new Date('2026-07-03'), isRecurring: true, recurrenceRule: null, createdAt: now, updatedAt: now },
    { id: uuidv4(), name: 'Labor Day', date: new Date('2026-09-07'), isRecurring: false, recurrenceRule: null, createdAt: now, updatedAt: now },
    { id: uuidv4(), name: 'Thanksgiving', date: new Date('2026-11-26'), isRecurring: false, recurrenceRule: null, createdAt: now, updatedAt: now },
    { id: uuidv4(), name: 'Christmas', date: new Date('2026-12-25'), isRecurring: true, recurrenceRule: null, createdAt: now, updatedAt: now },
  ];

  // Sample PTO request
  mockData.ptoRequests.push({
    id: uuidv4(),
    userId: devId,
    ptoTypeId: vacationId,
    startDate: new Date('2026-02-10'),
    endDate: new Date('2026-02-12'),
    isHalfDayStart: false,
    isHalfDayEnd: false,
    totalHours: 24,
    notes: 'Family vacation',
    status: 'pending' as RequestStatus,
    cancelledAt: null,
    cancelledBy: null,
    createdAt: now,
    updatedAt: now,
  });
}

// ============================================
// HELPER FUNCTIONS FOR MOCK OPERATIONS
// ============================================

export const mockDb = {
  // Users
  findUserByEmail: (email: string) => 
    mockData.users.find(u => u.email === email && u.deletedAt === null),
  
  findUserById: (id: string) => 
    mockData.users.find(u => u.id === id && u.deletedAt === null),

  createUser: (user: MockUser) => {
    mockData.users.push(user);
    return user;
  },

  assignRole: (userId: string, roleName: Role) => {
    const role = mockData.roles.find(r => r.name === roleName);
    if (role) {
      mockData.userRoles.push({ userId, roleId: role.id });
    }
  },

  getUserRoles: (userId: string): Role[] => {
    const roleIds = mockData.userRoles
      .filter(ur => ur.userId === userId)
      .map(ur => ur.roleId);
    return mockData.roles
      .filter(r => roleIds.includes(r.id))
      .map(r => r.name);
  },

  // Refresh tokens
  saveRefreshToken: (userId: string, token: string, expiresAt: Date) => {
    mockData.refreshTokens.push({ id: uuidv4(), user_id: userId, token, expires_at: expiresAt });
  },

  findRefreshToken: (token: string) =>
    mockData.refreshTokens.find(t => t.token === token && t.expires_at > new Date()),

  deleteRefreshToken: (token: string) => {
    const idx = mockData.refreshTokens.findIndex(t => t.token === token);
    if (idx > -1) mockData.refreshTokens.splice(idx, 1);
  },

  deleteUserRefreshTokens: (userId: string) => {
    mockData.refreshTokens = mockData.refreshTokens.filter(t => t.user_id !== userId);
  },

  // PTO Types
  getAllPtoTypes: () => mockData.ptoTypes.filter(t => t.isActive),

  // Policies  
  getAllPolicies: () => mockData.policies.filter(p => p.isActive),

  // Balances
  getUserBalances: (userId: string) =>
    mockData.ptoBalances.filter(b => b.userId === userId),

  // Requests
  getUserRequests: (userId: string) =>
    mockData.ptoRequests.filter(r => r.userId === userId),

  getPendingApprovals: (approverId: string) => {
    // Get requests from team members if user is a tech lead
    const user = mockData.users.find(u => u.id === approverId);
    if (!user) return [];
    
    const roles = mockDb.getUserRoles(approverId);
    if (roles.includes('admin')) {
      return mockData.ptoRequests.filter(r => r.status === 'pending');
    }
    if (roles.includes('tech_lead')) {
      const teamMembers = mockData.users
        .filter(u => u.teamId === user.teamId && u.id !== approverId)
        .map(u => u.id);
      return mockData.ptoRequests.filter(r => r.status === 'pending' && teamMembers.includes(r.userId));
    }
    return [];
  },

  // Holidays
  getAllHolidays: (year?: number) => {
    if (year) {
      return mockData.holidays.filter(h => h.date.getFullYear() === year);
    }
    return mockData.holidays;
  },

  // Teams
  getAllTeams: () => mockData.teams.filter(t => t.isActive),

  // Generic getters
  getAllUsers: () => mockData.users
    .filter(u => u.deletedAt === null)
    .map(({ _passwordHash: _, passwordHash: __, ...user }) => user),
};

// Initialize mock data on import
let initialized = false;
export async function initMockDb(): Promise<void> {
  if (!initialized) {
    await seedData();
    initialized = true;
    console.log('📦 Mock database initialized with seed data');
    console.log('   Test accounts (password: admin123):');
    console.log('   - admin@company.com (admin)');
    console.log('   - lead@company.com (tech_lead)');
    console.log('   - dev@company.com (developer)');
  }
}
