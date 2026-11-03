import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app';
import { User } from '../src/models';
import { connectTestDb, disconnectTestDb, clearTestDb } from './setup';

describe('Auth API', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('allows user to login with valid credentials', async () => {
    const passwordHash = await bcrypt.hash('Password@123', 10);
    await User.create({
      name: 'Test User',
      email: 'user@irop.test',
      passwordHash,
      role: 'employee',
      department: 'Engineering',
      isActive: true,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@irop.test', password: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('user@irop.test');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects invalid password', async () => {
    const passwordHash = await bcrypt.hash('Password@123', 10);
    await User.create({
      name: 'Test User',
      email: 'user@irop.test',
      passwordHash,
      role: 'employee',
      department: 'Engineering',
      isActive: true,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@irop.test', password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('blocks inactive user from logging in', async () => {
    const passwordHash = await bcrypt.hash('Password@123', 10);
    await User.create({
      name: 'Inactive User',
      email: 'inactive@irop.test',
      passwordHash,
      role: 'employee',
      department: 'Engineering',
      isActive: false,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inactive@irop.test', password: 'Password@123' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns current user profile on GET /api/auth/me with valid token', async () => {
    const passwordHash = await bcrypt.hash('Password@123', 10);
    const user = await User.create({
      name: 'Test User',
      email: 'me@irop.test',
      passwordHash,
      role: 'employee',
      department: 'Engineering',
      isActive: true,
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'me@irop.test', password: 'Password@123' });

    const token = loginRes.body.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.name).toBe('Test User');
    expect(meRes.body.user._id).toBe(user._id.toString());
  });

  it('returns 401 when hitting protected route without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
