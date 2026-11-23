import 'dotenv/config';
import bcrypt from 'bcrypt';
import { ColorMode, PrismaClient, UserRole, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();
const BCRYPT_COST = 12;

export const SAMPLE_EMAILS = {
  manager: 'manager@example.com',
  employee: 'employee@example.com',
} as const;

export const SAMPLE_DEPARTMENTS = ['IT', 'HR', 'Accounts'] as const;

const PERMISSIONS: Array<{ key: string; module: string; description: string }> = [
  { key: 'leave.apply', module: 'leave', description: 'Submit leave requests' },
  { key: 'leave.view_own', module: 'leave', description: 'View own leave requests and balances' },
  { key: 'leave.cancel_own', module: 'leave', description: 'Cancel own pending leave requests' },
  { key: 'leave.approve', module: 'leave', description: 'Approve or reject team leave requests' },
  { key: 'leave.view_team', module: 'leave', description: 'View team leave requests' },
  { key: 'leave.view_all', module: 'leave', description: 'View all organization leave requests' },
  { key: 'team.calendar', module: 'team', description: 'View team leave calendar' },
  { key: 'reports.view', module: 'reports', description: 'View leave reports' },
  { key: 'reports.export', module: 'reports', description: 'Export leave reports' },
  { key: 'employees.manage', module: 'employees', description: 'Manage employees and departments' },
  { key: 'leave_types.manage', module: 'leave_types', description: 'Manage leave types and policies' },
  { key: 'balances.manage', module: 'balances', description: 'Manage employee leave balances' },
  { key: 'holidays.manage', module: 'holidays', description: 'Manage public holidays' },
  { key: 'settings.manage', module: 'settings', description: 'Manage application and theme settings' },
];

const MANAGER_PERMISSIONS = [
  'leave.apply',
  'leave.view_own',
  'leave.cancel_own',
  'leave.approve',
  'leave.view_team',
  'team.calendar',
  'reports.view',
  'reports.export',
];

const EMPLOYEE_PERMISSIONS = [
  'leave.apply',
  'leave.view_own',
  'leave.cancel_own',
  'team.calendar',
];

async function main(): Promise<void> {
  const orgName = process.env.SEED_ORG_NAME?.trim() || 'Demo Organization';
  const adminEmail = (process.env.SEED_ADMIN_EMAIL?.trim() || 'admin@example.com').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD?.trim();
  const samplePassword = process.env.SEED_SAMPLE_PASSWORD?.trim();

  if (!adminPassword || !samplePassword) {
    throw new Error('SEED_ADMIN_PASSWORD and SEED_SAMPLE_PASSWORD must be set in .env before seeding');
  }

  // 1. Organization
  let organization = await prisma.organization.findFirst({
    orderBy: { createdAt: 'asc' },
  });
  if (!organization) {
    organization = await prisma.organization.create({
      data: { name: orgName },
    });
  } else if (organization.name !== orgName) {
    organization = await prisma.organization.update({
      where: { id: organization.id },
      data: { name: orgName },
    });
  }

  // 2. Sample Departments (IT, HR, Accounts)
  const deptMap = new Map<string, string>();
  for (const deptName of SAMPLE_DEPARTMENTS) {
    const dept = await prisma.department.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: deptName,
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        name: deptName,
        description: `${deptName} Department`,
      },
    });
    deptMap.set(deptName, dept.id);
  }

  // 3. Admin User + Employee + Preference
  const adminPasswordHash = await bcrypt.hash(adminPassword, BCRYPT_COST);
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      mustChangePassword: true,
    },
  });

  await prisma.employee.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      organizationId: organization.id,
      departmentId: deptMap.get('HR') ?? null,
      employeeCode: 'EMP-0001',
      name: 'System Administrator',
      designation: 'Administrator',
      joinDate: new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1)),
    },
  });

  await prisma.userPreference.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      colorMode: ColorMode.LIGHT,
    },
  });

  // 4. Sample Manager & Employee + Preferences
  const samplePasswordHash = await bcrypt.hash(samplePassword, BCRYPT_COST);

  const managerUser = await prisma.user.upsert({
    where: { email: SAMPLE_EMAILS.manager },
    update: {},
    create: {
      email: SAMPLE_EMAILS.manager,
      passwordHash: samplePasswordHash,
      role: UserRole.MANAGER,
      status: UserStatus.ACTIVE,
      mustChangePassword: true,
    },
  });

  const managerEmployee = await prisma.employee.upsert({
    where: { userId: managerUser.id },
    update: {},
    create: {
      userId: managerUser.id,
      organizationId: organization.id,
      departmentId: deptMap.get('IT') ?? null,
      employeeCode: 'EMP-0002',
      name: 'Sample Manager',
      designation: 'Engineering Manager',
      joinDate: new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1)),
    },
  });

  await prisma.userPreference.upsert({
    where: { userId: managerUser.id },
    update: {},
    create: {
      userId: managerUser.id,
      colorMode: ColorMode.LIGHT,
    },
  });

  const employeeUser = await prisma.user.upsert({
    where: { email: SAMPLE_EMAILS.employee },
    update: {},
    create: {
      email: SAMPLE_EMAILS.employee,
      passwordHash: samplePasswordHash,
      role: UserRole.EMPLOYEE,
      status: UserStatus.ACTIVE,
      mustChangePassword: true,
    },
  });

  await prisma.employee.upsert({
    where: { userId: employeeUser.id },
    update: {},
    create: {
      userId: employeeUser.id,
      organizationId: organization.id,
      departmentId: deptMap.get('IT') ?? null,
      reportingManagerId: managerEmployee.id,
      employeeCode: 'EMP-0003',
      name: 'Sample Employee',
      designation: 'Software Engineer',
      joinDate: new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1)),
    },
  });

  await prisma.userPreference.upsert({
    where: { userId: employeeUser.id },
    update: {},
    create: {
      userId: employeeUser.id,
      colorMode: ColorMode.LIGHT,
    },
  });

  // 5. Permissions & Role Permissions
  const permissionIdByKey = new Map<string, string>();
  for (const perm of PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        module: perm.module,
        description: perm.description,
      },
      create: perm,
    });
    permissionIdByKey.set(perm.key, record.id);
  }

  for (const key of MANAGER_PERMISSIONS) {
    const permissionId = permissionIdByKey.get(key);
    if (!permissionId) continue;
    await prisma.rolePermission.upsert({
      where: {
        role_permissionId: {
          role: UserRole.MANAGER,
          permissionId,
        },
      },
      update: {},
      create: {
        role: UserRole.MANAGER,
        permissionId,
      },
    });
  }

  for (const key of EMPLOYEE_PERMISSIONS) {
    const permissionId = permissionIdByKey.get(key);
    if (!permissionId) continue;
    await prisma.rolePermission.upsert({
      where: {
        role_permissionId: {
          role: UserRole.EMPLOYEE,
          permissionId,
        },
      },
      update: {},
      create: {
        role: UserRole.EMPLOYEE,
        permissionId,
      },
    });
  }

  // 6. Leave Types & Leave Policies
  const effectiveFrom = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));
  const leaveConfigs = [
    { name: 'Annual', quota: 20, requiresDocument: false },
    { name: 'Sick', quota: 10, requiresDocument: true },
    { name: 'Casual', quota: 8, requiresDocument: false },
  ];

  for (const cfg of leaveConfigs) {
    const leaveType = await prisma.leaveType.upsert({
      where: { name: cfg.name },
      update: {},
      create: {
        name: cfg.name,
        isPaid: true,
        isActive: true,
      },
    });

    await prisma.leavePolicy.upsert({
      where: {
        leaveTypeId_effectiveFrom: {
          leaveTypeId: leaveType.id,
          effectiveFrom,
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        leaveTypeId: leaveType.id,
        yearlyQuota: cfg.quota,
        allowHalfDay: true,
        requiresDocument: cfg.requiresDocument,
        excludeWeekends: true,
        excludePublicHolidays: true,
        allowNegativeBalance: false,
        allowCarryForward: false,
        leaveYearStartMonth: 1,
        effectiveFrom,
        isActive: true,
      },
    });
  }

  // 7. Theme Presets & App Settings
  const lightGreen = await prisma.themePreset.upsert({
    where: { name: 'Light Green' },
    update: {},
    create: {
      name: 'Light Green',
      primaryColor: '#16A34A',
      secondaryColor: '#DCFCE7',
      accentColor: '#15803D',
      hoverColor: '#166534',
      isDefault: true,
    },
  });

  await prisma.themePreset.upsert({
    where: { name: 'Dark Green' },
    update: {},
    create: {
      name: 'Dark Green',
      primaryColor: '#22C55E',
      secondaryColor: '#14532D',
      accentColor: '#4ADE80',
      hoverColor: '#16A34A',
      isDefault: false,
    },
  });

  await prisma.appSetting.upsert({
    where: { organizationId: organization.id },
    update: {},
    create: {
      organizationId: organization.id,
      primaryColor: lightGreen.primaryColor,
      secondaryColor: lightGreen.secondaryColor,
      accentColor: lightGreen.accentColor,
      hoverColor: lightGreen.hoverColor,
      fontSize: '14px',
      language: 'en',
      sidebarStyle: 'expanded',
      activePresetId: lightGreen.id,
    },
  });

  console.log('Database seed completed successfully.');
  console.log(`Organization: ${organization.name}`);
  console.log(`Seeded admin email: ${adminEmail}`);
  console.log(`Seeded sample accounts: ${SAMPLE_EMAILS.manager}, ${SAMPLE_EMAILS.employee}`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
