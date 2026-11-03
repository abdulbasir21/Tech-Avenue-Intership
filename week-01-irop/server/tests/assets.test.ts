import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app';
import { User, Asset } from '../src/models';
import { connectTestDb, disconnectTestDb, clearTestDb } from './setup';

describe('Asset Management System', () => {
  let adminToken: string;
  let employee1Token: string;
  let employee2Token: string;
  let employee1Id: string;
  let employee2Id: string;

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

    const emp1 = await User.create({
      name: 'Emp One',
      email: 'emp1@test.com',
      passwordHash,
      role: 'employee',
      department: 'Engineering',
    });
    employee1Id = emp1._id.toString();

    const emp2 = await User.create({
      name: 'Emp Two',
      email: 'emp2@test.com',
      passwordHash,
      role: 'employee',
      department: 'Engineering',
    });
    employee2Id = emp2._id.toString();

    const [admLogin, e1Login, e2Login] = await Promise.all([
      request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Demo@1234' }),
      request(app).post('/api/auth/login').send({ email: 'emp1@test.com', password: 'Demo@1234' }),
      request(app).post('/api/auth/login').send({ email: 'emp2@test.com', password: 'Demo@1234' }),
    ]);

    adminToken = admLogin.body.token;
    employee1Token = e1Login.body.token;
    employee2Token = e2Login.body.token;
  });

  it('allows searching assets by serial number and name', async () => {
    await Asset.create([
      { name: 'ThinkPad T14', serialNumber: 'TP-100', kind: 'hardware', status: 'available' },
      { name: 'Dell Latitude 5440', serialNumber: 'DL-200', kind: 'hardware', status: 'available' },
      { name: 'MacBook Pro', serialNumber: 'MB-300', kind: 'hardware', status: 'available' },
    ]);

    // Search by serial number
    const resSerial = await request(app)
      .get('/api/assets?q=DL-200')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resSerial.status).toBe(200);
    expect(resSerial.body.data.length).toBe(1);
    expect(resSerial.body.data[0].name).toBe('Dell Latitude 5440');

    // Search by name
    const resName = await request(app)
      .get('/api/assets?q=ThinkPad')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resName.status).toBe(200);
    expect(resName.body.data.length).toBe(1);
    expect(resName.body.data[0].serialNumber).toBe('TP-100');
  });

  it('filters assets by status', async () => {
    await Asset.create([
      { name: 'A1', serialNumber: 'S-01', kind: 'hardware', status: 'in_use' },
      { name: 'A2', serialNumber: 'S-02', kind: 'hardware', status: 'available' },
      { name: 'A3', serialNumber: 'S-03', kind: 'hardware', status: 'in_repair' },
    ]);

    const res = await request(app)
      .get('/api/assets?status=in_repair')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].serialNumber).toBe('S-03');
  });

  it('assigning an asset sets status in_use, unassigning sets available', async () => {
    const asset = await Asset.create({
      name: 'Monitor',
      serialNumber: 'MN-999',
      kind: 'hardware',
      status: 'available',
    });

    // Assign
    const assignRes = await request(app)
      .patch(`/api/assets/${asset._id}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: employee1Id });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.data.status).toBe('in_use');
    expect(assignRes.body.data.assignedTo._id).toBe(employee1Id);

    // Unassign
    const unassignRes = await request(app)
      .patch(`/api/assets/${asset._id}/unassign`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(unassignRes.status).toBe(200);
    expect(unassignRes.body.data.status).toBe('available');
    expect(unassignRes.body.data.assignedTo).toBeNull();
  });

  it('cannot assign an asset that is in_repair', async () => {
    const asset = await Asset.create({
      name: 'Broken Laptop',
      serialNumber: 'BR-111',
      kind: 'hardware',
      status: 'in_repair',
    });

    const res = await request(app)
      .patch(`/api/assets/${asset._id}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: employee1Id });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('employee sees only their own assigned assets', async () => {
    await Asset.create([
      { name: 'Emp1 Asset', serialNumber: 'E1-01', kind: 'hardware', status: 'in_use', assignedTo: employee1Id },
      { name: 'Emp2 Asset', serialNumber: 'E2-02', kind: 'hardware', status: 'in_use', assignedTo: employee2Id },
      { name: 'Unassigned Asset', serialNumber: 'UN-03', kind: 'hardware', status: 'available' },
    ]);

    const res = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${employee1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].serialNumber).toBe('E1-01');
  });
});
