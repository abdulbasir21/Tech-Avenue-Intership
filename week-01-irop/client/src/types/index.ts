export const ROLES = ['employee', 'manager', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export interface Quota {
  total: number;
  used: number;
}

export interface Quotas {
  casual: Quota;
  sick: Quota;
  annual: Quota;
  wfh: Quota;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  managerId?: string | { _id: string; name: string; email: string } | null;
  isActive: boolean;
  quotas: Quotas;
  createdAt: string;
  updatedAt: string;
}

export const LEAVE_TYPES = ['casual', 'sick', 'annual', 'wfh'] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  _id: string;
  userId: string | { _id: string; name: string; email: string; department: string };
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: { _id: string; name: string; email: string } | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  type: LeaveType;
  total: number;
  used: number;
  remaining: number;
}

export type AssetKind = 'hardware' | 'software';
export type AssetStatus = 'in_use' | 'available' | 'in_repair';

export interface Asset {
  _id: string;
  name: string;
  kind: AssetKind;
  serialNumber?: string;
  status: AssetStatus;
  assignedTo?: { _id: string; name: string; email: string; department: string } | null;
  purchaseDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  _id: string;
  name: string;
  category: string;
  quantity: number;
  threshold: number;
  unit: string;
  isLowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{ path: string; message: string }>;
  };
}
