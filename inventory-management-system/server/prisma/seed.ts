import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function upsertUserWithEmployee(params: {
  employeeCode: string;
  fullName: string;
  email: string;
  phone?: string;
  departmentId: number;
  username: string;
  password: string;
  roleId: number;
}) {
  const existingEmpByEmail = await prisma.employee.findFirst({
    where: {
      email: { equals: params.email, mode: 'insensitive' },
      NOT: { employeeCode: params.employeeCode },
    },
  });

  const employee = existingEmpByEmail
    ? await prisma.employee.update({
        where: { id: existingEmpByEmail.id },
        data: {
          fullName: params.fullName,
          departmentId: params.departmentId,
          isActive: true,
        },
      })
    : await prisma.employee.upsert({
        where: { employeeCode: params.employeeCode },
        update: {
          fullName: params.fullName,
          email: params.email,
          departmentId: params.departmentId,
          isActive: true,
        },
        create: {
          employeeCode: params.employeeCode,
          fullName: params.fullName,
          email: params.email,
          phone: params.phone ?? null,
          departmentId: params.departmentId,
          isActive: true,
        },
      });

  const passwordHash = await bcrypt.hash(params.password, 10);

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username: params.username }, { employeeId: employee.id }],
    },
  });

  if (existingUser) {
    return prisma.user.update({
      where: { id: existingUser.id },
      data: {
        username: params.username,
        passwordHash,
        roleId: params.roleId,
        employeeId: employee.id,
        isActive: true,
      },
    });
  }

  return prisma.user.create({
    data: {
      username: params.username,
      passwordHash,
      roleId: params.roleId,
      employeeId: employee.id,
      isActive: true,
    },
  });
}

async function warmupConnection() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

async function main() {
  console.log('--- Starting Database Seeding ---');
  await warmupConnection();

  const adminUsername = (process.env.ADMIN_USERNAME || 'admin').trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 8) {
    throw new Error('ADMIN_PASSWORD must be configured in server/.env (min 8 characters)');
  }

  // 1. Roles
  const roles = [
    {
      code: 'admin',
      name: 'Administrator',
      description: 'Full system administration and user management access.',
    },
    {
      code: 'inventory_manager',
      name: 'Inventory Manager',
      description: 'Manages suppliers, purchase orders, stock receipts, and approvals.',
    },
    {
      code: 'employee',
      name: 'Employee',
      description: 'Company employee who requests office supplies and consumables.',
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name, description: role.description },
      create: role,
    });
  }
  console.log('✓ Roles seeded: admin, inventory_manager, employee');

  // 2. Departments
  const departments = [
    { name: 'Information Technology' },
    { name: 'Human Resources' },
    { name: 'Finance & Accounts' },
    { name: 'Operations' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: { isActive: true },
      create: dept,
    });
  }
  console.log('✓ Departments seeded');

  // 3. Units of Measure
  const units = [
    { code: 'pcs', name: 'Pieces', allowsDecimal: false },
    { code: 'box', name: 'Box', allowsDecimal: false },
    { code: 'ream', name: 'Ream', allowsDecimal: false },
    { code: 'pack', name: 'Pack', allowsDecimal: false },
  ];

  for (const unit of units) {
    await prisma.unit.upsert({
      where: { code: unit.code },
      update: { name: unit.name, allowsDecimal: unit.allowsDecimal },
      create: unit,
    });
  }
  console.log('✓ Units seeded');

  // 4. Categories
  const categories = [
    { name: 'IT Consumables', description: 'Keyboards, mice, cables, flash drives' },
    { name: 'Office Supplies', description: 'Pens, staplers, paper clips, binders' },
    { name: 'Paper & Printing', description: 'A4 printing paper, printer toners, cartridges' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: cat,
    });
  }
  console.log('✓ Categories seeded');

  // 5. Lookup prerequisite records for users (sequential to avoid cold pool spikes)
  const itDept = await prisma.department.findUniqueOrThrow({ where: { name: 'Information Technology' } });
  const opsDept = await prisma.department.findUniqueOrThrow({ where: { name: 'Operations' } });
  const hrDept = await prisma.department.findUniqueOrThrow({ where: { name: 'Human Resources' } });
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: 'admin' } });
  const managerRole = await prisma.role.findUniqueOrThrow({ where: { code: 'inventory_manager' } });
  const employeeRole = await prisma.role.findUniqueOrThrow({ where: { code: 'employee' } });

  // 6. Seed Admin + Demo Manager & Employee Users
  const adminUser = await upsertUserWithEmployee({
    employeeCode: 'EMP-001',
    fullName: 'System Admin',
    email: 'admin@example.com',
    phone: '+1-555-0100',
    departmentId: itDept.id,
    username: adminUsername,
    password: adminPassword,
    roleId: adminRole.id,
  });

  const managerUser = await upsertUserWithEmployee({
    employeeCode: 'EMP-002',
    fullName: 'Sarah Manager',
    email: 'manager@example.com',
    phone: '+1-555-0101',
    departmentId: opsDept.id,
    username: 'manager',
    password: 'Manager@12345',
    roleId: managerRole.id,
  });

  const employeeUser = await upsertUserWithEmployee({
    employeeCode: 'EMP-003',
    fullName: 'Alex Employee',
    email: 'employee@example.com',
    phone: '+1-555-0102',
    departmentId: hrDept.id,
    username: 'employee',
    password: 'Employee@12345',
    roleId: employeeRole.id,
  });

  console.log(`✓ Users seeded: ${adminUser.username} (admin), ${managerUser.username} (inventory_manager), ${employeeUser.username} (employee)`);
  console.log('--- Database Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
