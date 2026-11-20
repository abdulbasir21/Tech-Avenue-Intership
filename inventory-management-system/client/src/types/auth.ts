export interface AuthUser {
  id: number;
  employeeId: number;
  username: string;
  fullName: string;
  email: string | null;
  role: 'admin' | 'inventory_manager' | 'employee' | string;
  roleName: string;
  department: string;
  departmentId: number;
}

export interface ManagedUser {
  id: number;
  username: string;
  fullName: string;
  email: string | null;
  employeeCode: string;
  role: string;
  roleId: number;
  roleName: string;
  department: string;
  departmentId: number;
  isActive: boolean;
  createdAt: string;
}

export interface RoleOption {
  id: number;
  code: string;
  name: string;
  description: string | null;
}

export interface DepartmentOption {
  id: number;
  name: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
