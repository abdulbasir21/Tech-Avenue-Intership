import { UserRole, UserStatus } from '@prisma/client';

export interface AuthenticatedEmployee {
  id: string;
  organizationId: string;
  departmentId: string | null;
  reportingManagerId: string | null;
  employeeCode: string;
  name: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
  employee: AuthenticatedEmployee | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
