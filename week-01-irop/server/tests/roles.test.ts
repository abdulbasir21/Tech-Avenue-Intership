import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app';
import { User, LeaveRequest } from '../src/models';
import { connectTestDb, disconnectTestDb, clearTestDb } from './setup';

describe('Role-Based Access Control', () => {
  let adminToken: string;
  let managerToken: string;
  let employeeToken: string;
  let manager1Id: string;
  let manager2Id: string;
  let emp1Id: string;
  let emp2Id: string;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    const passwordHash = await bcrypt.hash('Demo@1234', 10);

    const admin = await User.create({
      name: 'Admin',
      email: 'admin@test.com',
      passwordHash,
      role: 'admin',
      department: 'Operations',
    });

    const m1 = await User.create({
      name: 'Manager 1',
      email: 'm1@test.com',
      passwordHash,
      role: 'manager',
      department: 'Engineering',
    });
    manager1Id = m1._id.toString();

    const m2 = await User.create({
      name: 'Manager 2',
      email: 'm2@test.com',
      passwordHash,
      role: 'manager',
      department: 'Marketing',
    });
    manager2Id = m2._id.toString();

    const e1 = await User.create({
      name: 'Employee 1',
      email: 'e1@test.com',
      passwordHash,
      role: 'employee',
      department: 'Engineering',
      managerId: m1._id,
    });
    emp1Id = e1._id.toString();

    const e2 = await User.create({
      name: 'Employee 2',
      email: 'e2@test.com',
      passwordHash,
      role: 'employee',
      department: 'Marketing',
      managerId: m2._id,
    });
    emp2Id = e2._id.toString();

    const [adminLogin, m1Login, e1Login] = await Promise.all([
      request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Demo@1234' }),
      request(app).post('/api/auth/login').send({ email: 'm1@test.com', password: 'Demo@1234' }),
      request(app).post('/api/auth/login').send({ email: 'e1@test.com', password: 'Demo@1234' }),
    ]);

    adminToken = adminLogin.body.token;
    managerToken = m1Login.body.token;
    employeeToken = e1Login.body.token;
  });

  it('employee cannot access admin-only user management routes (403)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('employee cannot access inventory routes (403)', async () => {
    const res = await request(app)
      .get('/api/inventory')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('manager cannot create or delete assets (admin only) (403)', async () => {
    const res = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'Dell Lap', kind: 'hardware' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('manager cannot approve leave of someone outside their team', async () => {
    // Leave belongs to e2 whose manager is m2, but m1 attempts to approve it
    const leave = await LeaveRequest.create({
      userId: emp2Id,
      type: 'casual',
      startDate: new Date('2027-05-10'),
      endDate: new Date('2027-05-10'),
      days: 1,
      reason: 'Personal work',
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/leaves/${leave._id}/approve`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ reviewNote: 'Trying to approve' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('nobody can approve their own leave', async () => {
    const leave = await LeaveRequest.create({
      userId: manager1Id,
      type: 'annual',
      startDate: new Date('2027-06-14'),
      endDate: new Date('2027-06-15'),
      days: 2,
      reason: 'Manager vacation',
      status: 'pending',
    });

    const res = await request(app)
      .patch(`/api/leaves/${leave._id}/approve`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ reviewNote: 'Approving my own leave' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
