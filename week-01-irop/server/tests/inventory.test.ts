import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app';
import { User, InventoryItem } from '../src/models';
import { connectTestDb, disconnectTestDb, clearTestDb } from './setup';

describe('Inventory Management System', () => {
  let adminToken: string;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    const passwordHash = await bcrypt.hash('Demo@1234', 10);
    await User.create({
      name: 'Admin',
      email: 'admin@test.com',
      passwordHash,
      role: 'admin',
      department: 'Operations',
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Demo@1234' });

    adminToken = loginRes.body.token;
  });

  it('adjusts quantity by +1 and -1 correctly', async () => {
    const item = await InventoryItem.create({
      name: 'HDMI Adapter',
      category: 'Cables',
      quantity: 5,
      threshold: 3,
      unit: 'pcs',
    });

    // Increment +1
    const incRes = await request(app)
      .patch(`/api/inventory/${item._id}/adjust`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ delta: 1 });

    expect(incRes.status).toBe(200);
    expect(incRes.body.data.quantity).toBe(6);

    // Decrement -1
    const decRes = await request(app)
      .patch(`/api/inventory/${item._id}/adjust`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ delta: -1 });

    expect(decRes.status).toBe(200);
    expect(decRes.body.data.quantity).toBe(5);
  });

  it('cannot decrement quantity below 0', async () => {
    const item = await InventoryItem.create({
      name: 'Empty Item',
      category: 'Cables',
      quantity: 0,
      threshold: 5,
      unit: 'pcs',
    });

    const res = await request(app)
      .patch(`/api/inventory/${item._id}/adjust`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ delta: -1 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('correctly calculates isLowStock virtual', async () => {
    // 1. Below threshold -> isLowStock = true
    const itemBelow = await InventoryItem.create({
      name: 'Item Below',
      category: 'Misc',
      quantity: 3,
      threshold: 5,
      unit: 'pcs',
    });
    expect(itemBelow.isLowStock).toBe(true);

    // 2. Exact threshold -> isLowStock = true
    const itemExact = await InventoryItem.create({
      name: 'Item Exact',
      category: 'Misc',
      quantity: 5,
      threshold: 5,
      unit: 'pcs',
    });
    expect(itemExact.isLowStock).toBe(true);

    // 3. Above threshold -> isLowStock = false
    const itemAbove = await InventoryItem.create({
      name: 'Item Above',
      category: 'Misc',
      quantity: 6,
      threshold: 5,
      unit: 'pcs',
    });
    expect(itemAbove.isLowStock).toBe(false);
  });
});
