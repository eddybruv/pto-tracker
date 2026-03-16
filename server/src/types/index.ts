// Shared types for the PTO Tracker API

// ============ Enums ============

export type UserStatus = 'active' | 'inactive' | 'pending';
export type RequestStatus = 'pending' | 'approved' | 'denied' | 'cancelled';
export type ApprovalStatus = 'pending' | 'approved' | 'denied';
export type AccrualFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
export type LedgerTxnType = 'accrual' | 'debit' | 'adjustment' | 'carryover' | 'expiration';
export type Role = 'developer' | 'tech_lead' | 'admin';

// ============ Base Types ============

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDelete {
  deletedAt: Date | null;
}

// ============ Domain Models ============

export interface User extends Timestamps, SoftDelete {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl: string | null;
  managerId: string | null;
  teamId: string | null;
  hireDate: Date;
  timezone: string;
  status: UserStatus;
  lastLoginAt: Date | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
}

export interface Team extends Timestamps {
  id: string;
  name: string;
  code: string;
  leadId: string | null;
  isActive: boolean;
}

export interface UserRole {
  userId: string;
  roleId: string;
  roleName: Role;
  assignedAt: Date;
  assignedBy: string | null;
}

export interface PtoType extends Timestamps {
  id: string;
  name: string;
  code: string;
  color: string;
  isPaid: boolean;
  requiresApproval: boolean;
  isActive: boolean;
}

export interface Policy extends Timestamps {
  id: string;
  name: string;
  ptoTypeId: string;
  accrualRate: number;
  accrualFrequency: AccrualFrequency;
  maxAccrual: number | null;
  carryoverCap: number | null;
  carryoverExpiryMonths: number | null;
  allowNegative: boolean;
  maxNegative: number;
  probationDays: number;
  minIncrementDays: number;
  isActive: boolean;
}

export interface PolicyAssignment extends Timestamps {
  id: string;
  userId: string;
  policyId: string;
  effectiveDate: Date;
  endDate: Date | null;
}

export interface PtoBalance extends Timestamps {
  id: string;
  userId: string;
  ptoTypeId: string;
  policyId: string;
  availableDays: number;
  pendingDays: number;
  usedYtd: number;
  accruedYtd: number;
  carryoverDays: number;
  carryoverExpires: Date | null;
}

export interface BalanceLedger {
  id: string;
  userId: string;
  ptoTypeId: string;
  transactionType: LedgerTxnType;
  days: number;
  runningBalance: number;
  effectiveDate: Date;
  requestId: string | null;
  adjustedBy: string | null;
  description: string;
  createdAt: Date;
}

export interface PtoRequest extends Timestamps {
  id: string;
  userId: string;
  ptoTypeId: string;
  startDate: Date;
  endDate: Date;
  isHalfDayStart: boolean;
  isHalfDayEnd: boolean;
  totalDays: number;
  notes: string | null;
  status: RequestStatus;
  cancelledAt: Date | null;
  cancelledBy: string | null;
}

export interface Approval extends Timestamps {
  id: string;
  requestId: string;
  approverId: string;
  status: ApprovalStatus;
  comment: string | null;
  respondedAt: Date | null;
}

export interface Holiday extends Timestamps {
  id: string;
  name: string;
  date: Date;
  isRecurring: boolean;
  recurrenceRule: string | null;
}

// ============ API Response Types ============

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============ Auth Types ============

export interface TokenPayload {
  userId: string;
  email: string;
  roles: Role[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: Omit<User, 'passwordHash' | 'passwordResetToken' | 'passwordResetExpires'>;
  tokens: AuthTokens;
  roles: Role[];
}

// ============ Request DTOs ============

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  managerId?: string;
  teamId?: string;
  hireDate: string;
  timezone?: string;
  roles?: Role[];
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  managerId?: string | null;
  teamId?: string | null;
  timezone?: string;
  status?: UserStatus;
}

export interface CreatePtoRequestDto {
  ptoTypeId: string;
  startDate: string;
  endDate: string;
  isHalfDayStart?: boolean;
  isHalfDayEnd?: boolean;
  notes?: string;
}

export interface ApprovalDecisionDto {
  status: 'approved' | 'denied';
  comment?: string;
}
