import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SAMPLE_USER_EMAILS = ['manager@example.com', 'employee@example.com'];
const SAMPLE_DEPARTMENT_NAMES = ['IT', 'HR', 'Accounts'];

async function main(): Promise<void> {
  const removedUsers: string[] = [];
  const removedDepartments: string[] = [];
  const skippedDepartments: string[] = [];

  await prisma.$transaction(async (tx) => {
    const sampleUsers = await tx.user.findMany({
      where: { email: { in: SAMPLE_USER_EMAILS } },
      include: { employee: true },
    });

    const sampleEmployeeIds = sampleUsers
      .map((u) => u.employee?.id)
      .filter((id): id is string => Boolean(id));

    if (sampleEmployeeIds.length > 0) {
      await tx.employee.updateMany({
        where: { reportingManagerId: { in: sampleEmployeeIds } },
        data: { reportingManagerId: null },
      });
    }

    for (const user of sampleUsers) {
      await tx.user.delete({ where: { id: user.id } });
      removedUsers.push(user.email);
    }

    const candidateDepts = await tx.department.findMany({
      where: { name: { in: SAMPLE_DEPARTMENT_NAMES } },
      include: { _count: { select: { employees: true } } },
    });

    for (const dept of candidateDepts) {
      if (dept._count.employees === 0) {
        await tx.department.delete({ where: { id: dept.id } });
        removedDepartments.push(dept.name);
      } else {
        skippedDepartments.push(`${dept.name} (${dept._count.employees} employee(s))`);
      }
    }
  });

  console.log('Sample cleanup completed.');
  console.log(
    'Removed sample users:',
    removedUsers.length > 0 ? removedUsers.join(', ') : 'none found',
  );
  console.log(
    'Removed empty sample departments:',
    removedDepartments.length > 0 ? removedDepartments.join(', ') : 'none',
  );
  if (skippedDepartments.length > 0) {
    console.log('Skipped non-empty departments:', skippedDepartments.join(', '));
  }
}

main()
  .catch((err) => {
    console.error('Sample cleanup failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
