export type UserStatus = 'active' | 'inactive' | 'pending';
export type RequestStatus = 'pending' | 'approved' | 'denied' | 'cancelled';
export type ApprovalStatus = 'pending' | 'approved' | 'denied';
export type AccrualFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
export type LedgerTxnType = 'accrual' | 'debit' | 'adjustment' | 'carryover' | 'expiration';
export type Role = 'developer' | 'tech_lead' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  avatarUrl?: string | null;
  managerId: string | null;
  teamId: string | null;
  hireDate: string;
  timezone?: string;
  status: UserStatus;
  roles: Role[];
  createdAt: string;
  updatedAt?: string;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  leadId: string | null;
  isActive: boolean;
}

export interface PtoType {
  id: string;
  name: string;
  code: string;
  color: string;
  isPaid: boolean;
  requiresApproval: boolean;
  isActive: boolean;
}

export interface Policy {
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
  minIncrementHours: number;
  isActive: boolean;
}

export interface PtoBalance {
  id: string;
  userId: string;
  ptoTypeId: string;
  policyId: string;
  availableHours: number;
  pendingHours: number;
  usedYtd: number;
  accruedYtd: number;
  carryoverHours: number;
  carryoverExpires: string | null;
  ptoTypeName?: string;
  ptoTypeCode?: string;
  ptoTypeColor?: string;
}

export interface BalanceLedgerEntry {
  id: string;
  userId: string;
  ptoTypeId: string;
  transactionType: LedgerTxnType;
  hours: number;
  runningBalance: number;
  effectiveDate: string;
  requestId: string | null;
  adjustedBy: string | null;
  description: string;
  createdAt: string;
  ptoTypeName?: string;
}

export interface PtoRequest {
  id: string;
  requestId: string;
  userId: string;
  ptoTypeId: string;
  startDate: string;
  endDate: string;
  isHalfDayStart: boolean;
  isHalfDayEnd: boolean;
  totalHours: number;
  notes: string | null;
  status: RequestStatus;
  cancelledAt: string | null;
  cancelledBy: string | null;
  createdAt: string;
  updatedAt: string;
  ptoTypeName?: string;
  ptoTypeCode?: string;
  ptoTypeColor?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
}

export interface Approval {
  id: string;
  requestId: string;
  approverId: string;
  status: ApprovalStatus;
  comment: string | null;
  respondedAt: string | null;
  request?: PtoRequest;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  isRecurring: boolean;
  recurrenceRule: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreatePtoRequestDto {
  ptoTypeId: string;
  startDate: string;
  endDate: string;
  isHalfDayStart?: boolean;
  isHalfDayEnd?: boolean;
  notes?: string;
}

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
