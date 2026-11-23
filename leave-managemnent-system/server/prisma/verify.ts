import 'dotenv/config';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EXPECTED_TABLES = [
  'app_settings',
  'departments',
  'email_logs',
  'employees',
  'leave_balances',
  'leave_policies',
  'leave_requests',
  'leave_types',
  'notifications',
  'organizations',
  'otp_codes',
  'permissions',
  'public_holidays',
  'role_permissions',
  'theme_presets',
  'user_preferences',
  'users',
].sort();

const EXPECTED_ENUMS: Record<string, string[]> = {
  color_mode: ['LIGHT', 'DARK'],
  email_status: ['SENT', 'FAILED'],
  half_day_session: ['FIRST_HALF', 'SECOND_HALF'],
  leave_status: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
  notification_type: [
    'LEAVE_SUBMITTED',
    'LEAVE_APPROVED',
    'LEAVE_REJECTED',
    'LEAVE_CANCELLED',
    'BALANCE_UPDATED',
  ],
  user_role: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
  user_status: ['ACTIVE', 'INACTIVE'],
};

interface TableRow {
  table_name: string;
}

interface EnumRow {
  enum_name: string;
  enum_values: string[];
}

interface ConstraintRow {
  table_name: string;
  constraint_name: string;
  definition: string;
}

async function main(): Promise<void> {
  // 1. Verify tables
  const tables = await prisma.$queryRaw<TableRow[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;

  const tableNames = tables.map((t) => t.table_name);
  const domainTables = tableNames.filter((name) => name !== '_prisma_migrations').sort();

  console.log('\n=== TABLES ===');
  for (const name of tableNames) {
    console.log(` - ${name}`);
  }

  assert.ok(tableNames.includes('_prisma_migrations'), 'Expected _prisma_migrations table to exist');
  assert.equal(domainTables.length, 17, `Expected 17 domain tables, found ${domainTables.length}`);
  assert.deepEqual(domainTables, EXPECTED_TABLES, 'Domain tables do not match expected schema');

  // 2. Verify enums
  const enumRows = await prisma.$queryRaw<EnumRow[]>`
    SELECT t.typname AS enum_name,
           ARRAY_AGG(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname
    ORDER BY t.typname
  `;

  console.log('\n=== ENUMS ===');
  const actualEnums: Record<string, string[]> = {};
  for (const row of enumRows) {
    actualEnums[row.enum_name] = row.enum_values;
    console.log(` - ${row.enum_name}: [${row.enum_values.join(', ')}]`);
  }

  assert.deepEqual(
    Object.keys(actualEnums).sort(),
    Object.keys(EXPECTED_ENUMS).sort(),
    'Enum names mismatch',
  );
  for (const [enumName, expectedVals] of Object.entries(EXPECTED_ENUMS)) {
    assert.deepEqual(
      actualEnums[enumName],
      expectedVals,
      `Enum values mismatch for ${enumName}`,
    );
  }

  // 3. Verify CHECK constraints
  const constraints = await prisma.$queryRaw<ConstraintRow[]>`
    SELECT conrelid::regclass::text AS table_name,
           conname AS constraint_name,
           pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE contype = 'c'
      AND connamespace = 'public'::regnamespace
    ORDER BY table_name, constraint_name
  `;

  console.log('\n=== CHECK CONSTRAINTS ===');
  for (const c of constraints) {
    console.log(` - ${c.table_name}.${c.constraint_name}: ${c.definition}`);
  }

  const leaveRequestChecks = constraints.filter((c) => c.table_name === 'leave_requests');
  const leaveBalanceChecks = constraints.filter((c) => c.table_name === 'leave_balances');
  const otpCodeChecks = constraints.filter((c) => c.table_name === 'otp_codes');

  assert.ok(
    leaveRequestChecks.length >= 4,
    `Expected at least 4 CHECK constraints on leave_requests, found ${leaveRequestChecks.length}`,
  );
  assert.ok(
    leaveBalanceChecks.length >= 1,
    `Expected at least 1 CHECK constraint on leave_balances, found ${leaveBalanceChecks.length}`,
  );
  assert.ok(
    otpCodeChecks.length >= 1,
    `Expected at least 1 CHECK constraint on otp_codes, found ${otpCodeChecks.length}`,
  );

  // 4. Verify row counts
  const counts = {
    organizations: await prisma.organization.count(),
    departments: await prisma.department.count(),
    users: await prisma.user.count(),
    employees: await prisma.employee.count(),
    user_preferences: await prisma.userPreference.count(),
    permissions: await prisma.permission.count(),
    role_permissions: await prisma.rolePermission.count(),
    otp_codes: await prisma.otpCode.count(),
    leave_types: await prisma.leaveType.count(),
    leave_policies: await prisma.leavePolicy.count(),
    leave_balances: await prisma.leaveBalance.count(),
    leave_requests: await prisma.leaveRequest.count(),
    public_holidays: await prisma.publicHoliday.count(),
    notifications: await prisma.notification.count(),
    email_logs: await prisma.emailLog.count(),
    theme_presets: await prisma.themePreset.count(),
    app_settings: await prisma.appSetting.count(),
  };

  console.log('\n=== ROW COUNTS ===');
  for (const [table, count] of Object.entries(counts)) {
    console.log(` - ${table}: ${count}`);
  }

  assert.ok(counts.organizations >= 1, 'Expected at least 1 organization');
  assert.ok(counts.departments >= 3, 'Expected at least 3 departments');
  assert.ok(counts.users >= 3, 'Expected at least 3 users (Admin, Manager, Employee)');
  assert.ok(counts.employees >= 3, 'Expected at least 3 employees');
  assert.ok(counts.user_preferences >= 3, 'Expected at least 3 user_preferences');
  assert.equal(counts.permissions, 14, 'Expected 14 permissions');
  assert.equal(counts.role_permissions, 12, 'Expected 12 role_permissions (8 Manager + 4 Employee)');
  assert.ok(counts.leave_types >= 3, 'Expected at least 3 leave_types');
  assert.ok(counts.leave_policies >= 3, 'Expected at least 3 leave_policies');
  assert.ok(counts.theme_presets >= 2, 'Expected at least 2 theme_presets');
  assert.ok(counts.app_settings >= 1, 'Expected at least 1 app_settings');

  console.log('\nDB VERIFICATION PASSED (all assertions succeeded).');
}

main()
  .catch((err) => {
    console.error('\nDB VERIFICATION FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
