import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { getMongoUri } from '../config/env';
import { User, LeaveRequest, Asset, InventoryItem, IUser } from '../models';

/**
 * Helper to get a weekday date offset from today.
 */
function getWeekdayDate(offsetDays: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(0, 0, 0, 0);

  // If Sunday (0), move to Monday (+1)
  if (d.getDay() === 0) {
    d.setDate(d.getDate() + 1);
  } else if (d.getDay() === 6) {
    // If Saturday (6), move to Friday (-1) if negative offset, or Monday (+2) if positive
    d.setDate(d.getDate() + (offsetDays >= 0 ? 2 : -1));
  }
  return d;
}

export async function seedDatabase() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Refusing to run seed in production environment!');
    process.exit(1);
  }

  const mongoUri = getMongoUri();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  console.log('🌱 Starting IROP database seed...');

  // 1. Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    LeaveRequest.deleteMany({}),
    Asset.deleteMany({}),
    InventoryItem.deleteMany({}),
  ]);
  console.log('🧹 Existing collections cleaned.');

  // 2. Hash demo password
  const demoPassword = 'Demo@1234';
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  // 3. Create Managers and Admin first
  const ayesha: IUser = await User.create({
    name: 'Ayesha Khan',
    email: 'admin@irop.demo',
    passwordHash,
    role: 'admin',
    department: 'Operations',
    managerId: undefined,
    isActive: true,
    quotas: {
      casual: { total: 10, used: 0 },
      sick: { total: 8, used: 0 },
      annual: { total: 14, used: 0 },
      wfh: { total: 12, used: 0 },
    },
  });

  const bilal: IUser = await User.create({
    name: 'Bilal Ahmed',
    email: 'bilal@irop.demo',
    passwordHash,
    role: 'manager',
    department: 'Engineering',
    managerId: undefined,
    isActive: true,
    quotas: {
      casual: { total: 10, used: 0 },
      sick: { total: 8, used: 0 },
      annual: { total: 14, used: 0 },
      wfh: { total: 12, used: 0 },
    },
  });

  const sara: IUser = await User.create({
    name: 'Sara Malik',
    email: 'sara@irop.demo',
    passwordHash,
    role: 'manager',
    department: 'QA & Support',
    managerId: undefined,
    isActive: true,
    quotas: {
      casual: { total: 10, used: 0 },
      sick: { total: 8, used: 0 },
      annual: { total: 14, used: 0 },
      wfh: { total: 12, used: 0 },
    },
  });

  // 4. Create Employees with managerId and used quotas reflecting approved leaves
  const usman: IUser = await User.create({
    name: 'Usman Ali',
    email: 'usman@irop.demo',
    passwordHash,
    role: 'employee',
    department: 'Engineering',
    managerId: bilal._id,
    isActive: true,
    quotas: {
      casual: { total: 10, used: 1 }, // 1 Casual used
      sick: { total: 8, used: 0 },
      annual: { total: 14, used: 0 },
      wfh: { total: 12, used: 0 },
    },
  });

  const hina: IUser = await User.create({
    name: 'Hina Raza',
    email: 'hina@irop.demo',
    passwordHash,
    role: 'employee',
    department: 'Engineering',
    managerId: bilal._id,
    isActive: true,
    quotas: {
      casual: { total: 10, used: 0 },
      sick: { total: 8, used: 2 }, // 2 Sick used
      annual: { total: 14, used: 0 },
      wfh: { total: 12, used: 0 },
    },
  });

  const zain: IUser = await User.create({
    name: 'Zain Abbas',
    email: 'zain@irop.demo',
    passwordHash,
    role: 'employee',
    department: 'Engineering',
    managerId: bilal._id,
    isActive: true,
    quotas: {
      casual: { total: 10, used: 0 },
      sick: { total: 8, used: 0 },
      annual: { total: 14, used: 0 },
      wfh: { total: 12, used: 0 },
    },
  });

  const maryam: IUser = await User.create({
    name: 'Maryam Noor',
    email: 'maryam@irop.demo',
    passwordHash,
    role: 'employee',
    department: 'QA & Support',
    managerId: sara._id,
    isActive: true,
    quotas: {
      casual: { total: 10, used: 0 },
      sick: { total: 8, used: 0 },
      annual: { total: 14, used: 0 },
      wfh: { total: 12, used: 1 }, // 1 WFH used
    },
  });

  const daniyal: IUser = await User.create({
    name: 'Daniyal Shah',
    email: 'daniyal@irop.demo',
    passwordHash,
    role: 'employee',
    department: 'QA & Support',
    managerId: sara._id,
    isActive: true,
    quotas: {
      casual: { total: 10, used: 0 },
      sick: { total: 8, used: 0 },
      annual: { total: 14, used: 0 },
      wfh: { total: 12, used: 0 },
    },
  });

  console.log('✅ Created 8 Users.');

  // 5. Create Leaves (7)
  const leaves = [
    {
      userId: usman._id,
      type: 'annual',
      startDate: getWeekdayDate(10),
      endDate: getWeekdayDate(12),
      days: 3,
      reason: 'Family vacation trip',
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: null,
    },
    {
      userId: hina._id,
      type: 'sick',
      startDate: getWeekdayDate(-5),
      endDate: getWeekdayDate(-4),
      days: 2,
      reason: 'Fever and rest prescribed by physician',
      status: 'approved',
      reviewedBy: bilal._id,
      reviewedAt: getWeekdayDate(-5),
      reviewNote: 'Approved. Get well soon.',
    },
    {
      userId: zain._id,
      type: 'casual',
      startDate: getWeekdayDate(3),
      endDate: getWeekdayDate(3),
      days: 1,
      reason: 'Personal urgent appointment',
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: null,
    },
    {
      userId: maryam._id,
      type: 'wfh',
      startDate: getWeekdayDate(-2),
      endDate: getWeekdayDate(-2),
      days: 1,
      reason: 'Home maintenance work',
      status: 'approved',
      reviewedBy: sara._id,
      reviewedAt: getWeekdayDate(-2),
      reviewNote: 'Approved for WFH.',
    },
    {
      userId: daniyal._id,
      type: 'annual',
      startDate: getWeekdayDate(-20),
      endDate: getWeekdayDate(-18),
      days: 3,
      reason: 'Long weekend break',
      status: 'rejected',
      reviewedBy: sara._id,
      reviewedAt: getWeekdayDate(-21),
      reviewNote: 'Critical release week, leave cannot be approved.',
    },
    {
      userId: usman._id,
      type: 'casual',
      startDate: getWeekdayDate(-15),
      endDate: getWeekdayDate(-15),
      days: 1,
      reason: 'Family event',
      status: 'approved',
      reviewedBy: bilal._id,
      reviewedAt: getWeekdayDate(-16),
      reviewNote: 'Approved.',
    },
    {
      userId: bilal._id,
      type: 'annual',
      startDate: getWeekdayDate(20),
      endDate: getWeekdayDate(21),
      days: 2,
      reason: 'Annual family retreat',
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: null,
    },
  ];

  await LeaveRequest.insertMany(leaves);
  console.log('✅ Created 7 Leave Requests.');

  // 6. Create Assets (10)
  const assets = [
    {
      name: 'Dell Latitude 5440',
      serialNumber: 'DL-5440-001',
      kind: 'hardware',
      status: 'in_use',
      assignedTo: usman._id,
      purchaseDate: new Date('2024-01-15'),
    },
    {
      name: 'MacBook Pro 14',
      serialNumber: 'MB-14-002',
      kind: 'hardware',
      status: 'in_use',
      assignedTo: hina._id,
      purchaseDate: new Date('2024-02-10'),
    },
    {
      name: 'Lenovo ThinkPad T14',
      serialNumber: 'LN-T14-003',
      kind: 'hardware',
      status: 'in_use',
      assignedTo: zain._id,
      purchaseDate: new Date('2023-11-20'),
    },
    {
      name: 'Lenovo ThinkPad T14',
      serialNumber: 'LN-T14-004',
      kind: 'hardware',
      status: 'available',
      assignedTo: null,
      purchaseDate: new Date('2023-11-20'),
    },
    {
      name: 'Dell 24" Monitor',
      serialNumber: 'MN-24-005',
      kind: 'hardware',
      status: 'in_use',
      assignedTo: maryam._id,
      purchaseDate: new Date('2023-08-05'),
    },
    {
      name: 'Dell 24" Monitor',
      serialNumber: 'MN-24-006',
      kind: 'hardware',
      status: 'available',
      assignedTo: null,
      purchaseDate: new Date('2023-08-05'),
    },
    {
      name: 'HP ProBook 450',
      serialNumber: 'HP-PB-007',
      kind: 'hardware',
      status: 'in_repair',
      assignedTo: null,
      purchaseDate: new Date('2022-09-12'),
    },
    {
      name: 'Jabra Evolve Headset',
      serialNumber: 'JB-EV-008',
      kind: 'hardware',
      status: 'in_use',
      assignedTo: daniyal._id,
      purchaseDate: new Date('2024-03-01'),
    },
    {
      name: 'JetBrains All Products',
      serialNumber: 'LIC-JB-001',
      kind: 'software',
      status: 'in_use',
      assignedTo: bilal._id,
      purchaseDate: new Date('2024-01-01'),
    },
    {
      name: 'Microsoft 365 Business',
      serialNumber: 'LIC-M365-002',
      kind: 'software',
      status: 'in_use',
      assignedTo: sara._id,
      purchaseDate: new Date('2024-01-01'),
    },
  ];

  await Asset.insertMany(assets);
  console.log('✅ Created 10 Assets.');

  // 7. Create Inventory Items (8)
  const inventoryItems = [
    {
      name: 'HDMI Cable',
      category: 'Cables & Adapters',
      quantity: 25,
      threshold: 10,
      unit: 'pcs',
    },
    {
      name: 'USB-C Charger 65W',
      category: 'Power & Adapters',
      quantity: 4,
      threshold: 5, // Low stock (below)
      unit: 'pcs',
    },
    {
      name: 'Wireless Mouse',
      category: 'Peripherals',
      quantity: 12,
      threshold: 5,
      unit: 'pcs',
    },
    {
      name: 'Keyboard',
      category: 'Peripherals',
      quantity: 6,
      threshold: 6, // Low stock (exact)
      unit: 'pcs',
    },
    {
      name: 'Ethernet Cable Cat6',
      category: 'Networking',
      quantity: 40,
      threshold: 15,
      unit: 'pcs',
    },
    {
      name: 'Laptop Bag',
      category: 'Accessories',
      quantity: 3,
      threshold: 4, // Low stock (below)
      unit: 'pcs',
    },
    {
      name: 'A4 Paper Ream',
      category: 'Stationery',
      quantity: 30,
      threshold: 10,
      unit: 'reams',
    },
    {
      name: 'Whiteboard Markers',
      category: 'Stationery',
      quantity: 2,
      threshold: 5, // Low stock (below)
      unit: 'packs',
    },
  ];

  await InventoryItem.insertMany(inventoryItems);
  console.log('✅ Created 8 Inventory Items.');

  // Print Demo Logins Table
  console.log('\n======================================================');
  console.log('🎉 IROP SEED COMPLETED SUCCESSFULLY');
  console.log('======================================================');
  console.log('All accounts password: Demo@1234');
  console.log('------------------------------------------------------');
  console.log('| Role     | Name         | Email            |');
  console.log('------------------------------------------------------');
  console.log(`| Admin    | ${ayesha.name}  | ${ayesha.email}  |`);
  console.log(`| Manager  | ${bilal.name}  | ${bilal.email}  |`);
  console.log(`| Manager  | ${sara.name}   | ${sara.email}   |`);
  console.log(`| Employee | ${usman.name}    | ${usman.email}  |`);
  console.log(`| Employee | ${hina.name}    | ${hina.email}   |`);
  console.log(`| Employee | ${zain.name}   | ${zain.email}   |`);
  console.log(`| Employee | ${maryam.name}  | ${maryam.email} |`);
  console.log(`| Employee | ${daniyal.name} | ${daniyal.email}|`);
  console.log('======================================================\n');
}

seedDatabase()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
