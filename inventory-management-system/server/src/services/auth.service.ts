import { prisma } from '../config/prisma';
import { AuthenticatedUser } from '../types/auth';
import { AppError } from '../utils/AppError';
import { signAuthToken } from '../utils/jwt';
import { comparePassword } from '../utils/password';

export async function loginWithCredentials(
  username: string,
  password: string
): Promise<{ token: string; user: AuthenticatedUser }> {
  const normalizedUsername = username.trim();

  const user = await prisma.user.findFirst({
    where: {
      username: {
        equals: normalizedUsername,
        mode: 'insensitive',
      },
    },
    include: {
      role: true,
      employee: {
        include: {
          department: true,
        },
      },
    },
  });

  if (!user || !user.isActive || !user.employee.isActive) {
    throw new AppError('Invalid username or password', 401);
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    throw new AppError('Invalid username or password', 401);
  }

  const sanitizedUser: AuthenticatedUser = {
    id: user.id,
    employeeId: user.employeeId,
    username: user.username,
    fullName: user.employee.fullName,
    email: user.employee.email,
    role: user.role.code,
    roleName: user.role.name,
    department: user.employee.department.name,
    departmentId: user.employee.departmentId,
  };

  const token = signAuthToken({ sub: user.id, role: user.role.code });
  return { token, user: sanitizedUser };
}
