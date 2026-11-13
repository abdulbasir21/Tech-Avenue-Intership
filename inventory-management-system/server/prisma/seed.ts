import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

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
      update: {},
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

  // 5. Admin Employee and User
  const itDept = await prisma.department.findUnique({
    where: { name: 'Information Technology' },
  });
  const adminRole = await prisma.role.findUnique({
    where: { code: 'admin' },
  });

  if (!itDept || !adminRole) {
    throw new Error('Prerequisite Department or Role not found for Admin seeding.');
  }

  const adminEmployee = await prisma.employee.upsert({
    where: { employeeCode: 'EMP-001' },
    update: {
      fullName: 'System Administrator',
      email: 'admin@company.com',
      departmentId: itDept.id,
    },
    create: {
      employeeCode: 'EMP-001',
      fullName: 'System Administrator',
      email: 'admin@company.com',
      phone: '+1-555-0100',
      departmentId: itDept.id,
      isActive: true,
    },
  });

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash('Admin@123456', saltRounds);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash,
      roleId: adminRole.id,
      employeeId: adminEmployee.id,
      isActive: true,
    },
    create: {
      username: 'admin',
      passwordHash,
      roleId: adminRole.id,
      employeeId: adminEmployee.id,
      isActive: true,
    },
  });

  console.log(`✓ Admin user seeded (username: ${adminUser.username}) linked to Employee ${adminEmployee.employeeCode}`);
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
