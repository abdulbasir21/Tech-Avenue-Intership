export interface AuthenticatedUser {
  id: number;
  employeeId: number;
  username: string;
  fullName: string;
  email: string | null;
  role: string;
  roleName: string;
  department: string;
  departmentId: number;
}
