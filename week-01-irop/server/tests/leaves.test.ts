import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app';
import { User, LeaveRequest } from '../src/models';
import { connectTestDb, disconnectTestDb, clearTestDb } from './setup';

describe('Leave Management System', () => {
  let adminToken: string;
  let managerToken: string;
  let employeeToken: string;
  let employeeId: string;

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

    const manager = await User.create({
      name: 'Manager',
      email: 'manager@test.com',
      passwordHash,
      role: 'manager',
      department: 'Engineering',
    });

    const employee = await User.create({
      name: 'Employee',
      email: 'employee@test.com',
      passwordHash,
      role: 'employee',
      department: 'Engineering',
      managerId: manager._id,
      quotas: {
        casual: { total: 10, used: 0 },
        sick: { total: 8, used: 0 },
        annual: { total: 14, used: 0 },
        wfh: { total: 12, used: 0 },
      },
    });
    employeeId = employee._id.toString();

    const [adminLogin, mgrLogin, empLogin] = await Promise.all([
      request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Demo@1234' }),
      request(app).post('/api/auth/login').send({ email: 'manager@test.com', password: 'Demo@1234' }),
      request(app).post('/api/auth/login').send({ email: 'employee@test.com', password: 'Demo@1234' }),
    ]);

    adminToken = adminLogin.body.token;
    managerToken = mgrLogin.body.token;
    employeeToken = empLogin.body.token;
  });

  it('correctly calculates weekdays only (skipping weekend)', async () => {
    // 2027-06-11 is Friday, 2027-06-14 is Monday (Fri, Sat, Sun, Mon = 2 weekdays)
    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        type: 'casual',
        startDate: '2027-06-11',
        endDate: '2027-06-14',
        reason: 'Long weekend',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.days).toBe(2);
  });

  it('rejects overlapping pending or approved leave requests', async () => {
    await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        type: 'casual',
        startDate: '2027-07-05',
        endDate: '2027-07-07',
        reason: 'First leave',
      });

    // Overlapping request
    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        type: 'annual',
        startDate: '2027-07-06',
        endDate: '2027-07-08',
        reason: 'Second overlapping leave',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects leave request if requested days exceed remaining balance', async () => {
    // Sick leave has 8 days total. Try to take 9 weekdays.
    // 2027-08-02 (Mon) to 2027-08-12 (Thu) = 9 weekdays
    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        type: 'sick',
        startDate: '2027-08-02',
        endDate: '2027-08-12',
        reason: 'Extended recovery',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('QUOTA_EXCEEDED');
  });

  it('deducts quota only when leave moves from pending to approved', async () => {
    const applyRes = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        type: 'casual',
        startDate: '2027-09-06',
        endDate: '2027-09-07',
        reason: 'Trip',
      });

    const leaveId = applyRes.body.data._id;

    // Check user quota BEFORE approval: used should still be 0
    let user = await User.findById(employeeId);
    expect(user?.quotas.casual.used).toBe(0);

    // Approve the leave
    const approveRes = await request(app)
      .patch(`/api/leaves/${leaveId}/approve`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ reviewNote: 'Have fun' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('approved');

    // Check user quota AFTER approval: used should now be 2
    user = await User.findById(employeeId);
    expect(user?.quotas.casual.used).toBe(2);

    // Approving twice should fail
    const secondApprove = await request(app)
      .patch(`/api/leaves/${leaveId}/approve`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ reviewNote: 'Again' });

    expect(secondApprove.status).toBe(400);
  });

  it('rejecting or cancelling a leave never deducts quota', async () => {
    const applyRes = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        type: 'annual',
        startDate: '2027-10-04',
        endDate: '2027-10-06',
        reason: 'Rest',
      });

    const leaveId = applyRes.body.data._id;

    // Reject the leave
    const rejectRes = await request(app)
      .patch(`/api/leaves/${leaveId}/reject`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ reviewNote: 'Coverage needed' });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.status).toBe('rejected');

    // Quota should still be 0
    const user = await User.findById(employeeId);
    expect(user?.quotas.annual.used).toBe(0);
  });
});
