import 'dotenv/config';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { UserRole, UserStatus } from '@prisma/client';
import app from '../src/app';
import { prisma } from '../src/config/prisma';
import { hashPassword } from '../src/utils/password';

const TEST_RUN_ID = Date.now().toString(36);
const TEST_EMAIL_PREFIX = `test.${TEST_RUN_ID}`;
const TEST_TEMP_PASS = 'TempPass123';
const TEST_NEW_PASS = 'UpdatedPass456';

const createdUserIds: string[] = [];
const createdDepartmentIds: string[] = [];

async function registerSeededOrTestAdmin(): Promise<{
  adminEmail: string;
  adminPassword: string;
  organizationId: string;
}> {
  const organization = await prisma.organization.findFirst({
    orderBy: { createdAt: 'asc' },
  });
  if (!organization) {
    throw new Error('Organization must be seeded before running tests');
  }

  const adminEmail = `${TEST_EMAIL_PREFIX}.admin@example.com`;
  const passwordHash = await hashPassword(TEST_NEW_PASS);

  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      employee: {
        create: {
          organizationId: organization.id,
          employeeCode: `TST-ADM-${TEST_RUN_ID}`.slice(0, 50),
          name: 'Test Suite Admin',
          designation: 'QA Admin',
        },
      },
      preference: {
        create: {
          colorMode: 'LIGHT',
        },
      },
    },
  });

  createdUserIds.push(adminUser.id);
  return {
    adminEmail,
    adminPassword: TEST_NEW_PASS,
    organizationId: organization.id,
  };
}

describe('Leave Management System - User Management API', () => {
  let adminEmail = '';
  let adminPassword = '';
  let adminToken = '';
  let adminEmployeeId = '';
  let testDeptId = '';
  let managerEmployeeId = '';
  let managerEmail = '';
  let employeeId = '';
  let employeeEmail = '';
  let employeeToken = '';

  beforeAll(async () => {
    const admin = await registerSeededOrTestAdmin();
    adminEmail = admin.adminEmail;
    adminPassword = admin.adminPassword;

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: adminEmail,
      password: adminPassword,
      rememberMe: true,
    });

    expect(loginRes.status).toBe(200);
    adminToken = loginRes.body.data.accessToken;
    adminEmployeeId = loginRes.body.data.user.employee.id;
  });

  afterAll(async () => {
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          ...(createdUserIds.length > 0 ? [{ id: { in: createdUserIds } }] : []),
          { email: { startsWith: TEST_EMAIL_PREFIX } },
        ],
      },
      select: { id: true },
    });
    const allTestUserIds = testUsers.map((u) => u.id);

    if (allTestUserIds.length > 0) {
      const emps = await prisma.employee.findMany({
        where: { userId: { in: allTestUserIds } },
        select: { id: true },
      });
      const empIds = emps.map((e) => e.id);
      if (empIds.length > 0) {
        await prisma.employee.updateMany({
          where: { reportingManagerId: { in: empIds } },
          data: { reportingManagerId: null },
        });
      }
      await prisma.emailLog.deleteMany({
        where: { toEmail: { startsWith: TEST_EMAIL_PREFIX } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: allTestUserIds } },
      });
    }

    if (createdDepartmentIds.length > 0) {
      await prisma.department.deleteMany({
        where: { id: { in: createdDepartmentIds } },
      });
    }

    await prisma.$disconnect();
  });

  describe('Auth & Must-Change-Password & Inactive Flows', () => {
    it('logs in successfully with valid credentials and returns expected payload', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: adminEmail,
        password: adminPassword,
        rememberMe: false,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeTypeOf('string');
      expect(res.body.data.refreshToken).toBeTypeOf('string');
      expect(res.body.data.user.email).toBe(adminEmail);
      expect(res.body.data.user.role).toBe('ADMIN');
      expect(res.body.data.user.mustChangePassword).toBe(false);
      expect(res.body.data.user.employee.id).toBe(adminEmployeeId);
    });

    it('returns the exact same error message for wrong email and wrong password', async () => {
      const wrongEmailRes = await request(app).post('/api/v1/auth/login').send({
        email: `nonexistent.${TEST_RUN_ID}@example.com`,
        password: adminPassword,
      });
      const wrongPassRes = await request(app).post('/api/v1/auth/login').send({
        email: adminEmail,
        password: 'WrongPassword999',
      });

      expect(wrongEmailRes.status).toBe(401);
      expect(wrongPassRes.status).toBe(401);
      expect(wrongEmailRes.body.success).toBe(false);
      expect(wrongPassRes.body.success).toBe(false);
      expect(wrongEmailRes.body.message).toBe(wrongPassRes.body.message);
    });

    it('refreshes access token with a valid refreshToken', async () => {
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: adminEmail,
        password: adminPassword,
      });

      const refreshRes = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: loginRes.body.data.refreshToken,
      });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.accessToken).toBeTypeOf('string');
    });

    it('enforces must_change_password lock on other routes while allowing /auth/me and /auth/change-password', async () => {
      const deptRes = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Dept-${TEST_RUN_ID}`, description: 'Test engineering dept' });

      expect(deptRes.status).toBe(201);
      testDeptId = deptRes.body.data.department.id;
      createdDepartmentIds.push(testDeptId);

      managerEmail = `${TEST_EMAIL_PREFIX}.manager@example.com`;
      const createMgrRes = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'QA Manager',
          email: managerEmail,
          departmentId: testDeptId,
          role: 'MANAGER',
          temporaryPassword: TEST_TEMP_PASS,
          designation: 'Engineering Manager',
        });

      expect(createMgrRes.status).toBe(201);
      managerEmployeeId = createMgrRes.body.data.employee.id;
      createdUserIds.push(createMgrRes.body.data.employee.userId);
      expect(createMgrRes.body.data.employee.employeeCode).toMatch(/^EMP-\d{4}$/);
      expect(createMgrRes.body.data.employee.mustChangePassword).toBe(true);

      const mgrLogin = await request(app).post('/api/v1/auth/login').send({
        email: managerEmail,
        password: TEST_TEMP_PASS,
      });
      expect(mgrLogin.status).toBe(200);
      expect(mgrLogin.body.data.user.mustChangePassword).toBe(true);
      const mgrToken = mgrLogin.body.data.accessToken;

      // Blocked on /departments when mustChangePassword = true
      const blockedDept = await request(app)
        .get('/api/v1/departments')
        .set('Authorization', `Bearer ${mgrToken}`);
      expect(blockedDept.status).toBe(403);
      expect(blockedDept.body.code).toBe('MUST_CHANGE_PASSWORD');

      // Allowed on /auth/me
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${mgrToken}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.data.user.email).toBe(managerEmail);

      // Allowed on /auth/change-password
      const changeRes = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${mgrToken}`)
        .send({
          currentPassword: TEST_TEMP_PASS,
          newPassword: TEST_NEW_PASS,
        });
      expect(changeRes.status).toBe(200);

      // Unblocked after changing password
      const unblockedDept = await request(app)
        .get('/api/v1/departments')
        .set('Authorization', `Bearer ${mgrToken}`);
      expect(unblockedDept.status).toBe(200);
    });
  });

  describe('Employees CRUD, Validations & Permissions', () => {
    it('creates an EMPLOYEE with auto-generated employeeCode and reports to manager', async () => {
      employeeEmail = `${TEST_EMAIL_PREFIX}.emp@example.com`;
      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'QA Employee',
          email: employeeEmail,
          departmentId: testDeptId,
          reportingManagerId: managerEmployeeId,
          role: 'EMPLOYEE',
          temporaryPassword: TEST_TEMP_PASS,
          joinDate: '2026-03-01',
        });

      expect(res.status).toBe(201);
      employeeId = res.body.data.employee.id;
      createdUserIds.push(res.body.data.employee.userId);
      expect(res.body.data.employee.reportingManagerId).toBe(managerEmployeeId);
      expect(res.body.data.employee.passwordHash).toBeUndefined();
    });

    it('rejects duplicate email on employee creation with 409', async () => {
      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duplicate User',
          email: employeeEmail,
          role: 'EMPLOYEE',
          temporaryPassword: TEST_TEMP_PASS,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('rejects EMPLOYEE as reportingManagerId and ADMIN with reportingManagerId', async () => {
      const badManagerRes = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Bad Manager Target',
          email: `${TEST_EMAIL_PREFIX}.badmgr@example.com`,
          role: 'EMPLOYEE',
          reportingManagerId: employeeId,
          temporaryPassword: TEST_TEMP_PASS,
        });

      expect(badManagerRes.status).toBe(400);

      const adminWithMgrRes = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin With Mgr',
          email: `${TEST_EMAIL_PREFIX}.admmgr@example.com`,
          role: 'ADMIN',
          reportingManagerId: managerEmployeeId,
          temporaryPassword: TEST_TEMP_PASS,
        });

      expect(adminWithMgrRes.status).toBe(400);
    });

    it('prevents an employee from being set as their own reporting manager', async () => {
      const res = await request(app)
        .patch(`/api/v1/employees/${managerEmployeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reportingManagerId: managerEmployeeId });

      expect(res.status).toBe(400);
    });

    it('lists employees with search, filters, pagination, sorting, and no passwordHash', async () => {
      const res = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          search: TEST_EMAIL_PREFIX,
          departmentId: testDeptId,
          role: 'EMPLOYEE',
          status: 'ACTIVE',
          page: 1,
          limit: 5,
          sortBy: 'name',
          sortOrder: 'asc',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(5);
      for (const item of res.body.data.items) {
        expect(item.passwordHash).toBeUndefined();
        expect(item.password_hash).toBeUndefined();
        expect(item.email).toBeTypeOf('string');
        expect(item.role).toBe('EMPLOYEE');
        expect(item.status).toBe('ACTIVE');
      }
    });

    it('blocks EMPLOYEE role from /employees (403) while allowing GET /departments (200)', async () => {
      const empLogin = await request(app).post('/api/v1/auth/login').send({
        email: employeeEmail,
        password: TEST_TEMP_PASS,
      });
      employeeToken = empLogin.body.data.accessToken;

      const changeRes = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ currentPassword: TEST_TEMP_PASS, newPassword: TEST_NEW_PASS });
      expect(changeRes.status).toBe(200);

      const empForbidden = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(empForbidden.status).toBe(403);

      const deptAllowed = await request(app)
        .get('/api/v1/departments')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(deptAllowed.status).toBe(200);
    });

    it('blocks Admin from deactivating themselves and blocks INACTIVE users from logging in or using tokens', async () => {
      const selfDeactivateRes = await request(app)
        .patch(`/api/v1/employees/${adminEmployeeId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INACTIVE' });

      expect(selfDeactivateRes.status).toBe(400);

      const deactivateEmpRes = await request(app)
        .patch(`/api/v1/employees/${employeeId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INACTIVE' });
      expect(deactivateEmpRes.status).toBe(200);
      expect(deactivateEmpRes.body.data.employee.status).toBe('INACTIVE');

      const inactiveLogin = await request(app).post('/api/v1/auth/login').send({
        email: employeeEmail,
        password: TEST_NEW_PASS,
      });
      expect(inactiveLogin.status).toBe(403);
      expect(inactiveLogin.body.code).toBe('ACCOUNT_INACTIVE');

      const inactiveMe = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${employeeToken}`);
      expect(inactiveMe.status).toBe(403);
      expect(inactiveMe.body.code).toBe('ACCOUNT_INACTIVE');

      // Reactivate for OTP tests
      const reactivateRes = await request(app)
        .patch(`/api/v1/employees/${employeeId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ACTIVE' });
      expect(reactivateRes.status).toBe(200);
    });

    it('allows admin reset-password and restores mustChangePassword=true', async () => {
      const resetRes = await request(app)
        .post(`/api/v1/employees/${employeeId}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ temporaryPassword: 'ResetTemp99' });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.data.mustChangePassword).toBe(true);

      const loginAfterReset = await request(app).post('/api/v1/auth/login').send({
        email: employeeEmail,
        password: 'ResetTemp99',
      });
      expect(loginAfterReset.status).toBe(200);
      expect(loginAfterReset.body.data.user.mustChangePassword).toBe(true);
    });
  });

  describe('OTP Password Reset Rules (Generic, Expiry, 5 Attempts, Single Use)', () => {
    it('returns identical response for existing and non-existing email on forgot-password', async () => {
      const existingRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: employeeEmail });
      const missingRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: `nobody.${TEST_RUN_ID}@example.com` });

      expect(existingRes.status).toBe(200);
      expect(missingRes.status).toBe(200);
      expect(existingRes.body.message).toBe(missingRes.body.message);
    });

    it('rejects expired OTP codes', async () => {
      const empUser = await prisma.user.findUnique({ where: { email: employeeEmail } });
      expect(empUser).toBeTruthy();

      const otp = '123456';
      await prisma.otpCode.updateMany({
        where: { userId: empUser!.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      await prisma.otpCode.create({
        data: {
          userId: empUser!.id,
          otpHash: await hashPassword(otp),
          expiresAt: new Date(Date.now() - 60 * 1000),
          attempts: 0,
        },
      });

      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: employeeEmail, otp });

      expect(res.status).toBe(400);
      expect(res.body.message.toLowerCase()).toContain('expired');
    });

    it('blocks OTP after 5 wrong attempts', async () => {
      const empUser = await prisma.user.findUnique({ where: { email: employeeEmail } });
      const validOtp = '654321';

      await prisma.otpCode.updateMany({
        where: { userId: empUser!.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      await prisma.otpCode.create({
        data: {
          userId: empUser!.id,
          otpHash: await hashPassword(validOtp),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          attempts: 0,
        },
      });

      for (let i = 0; i < 5; i++) {
        const wrongRes = await request(app)
          .post('/api/v1/auth/verify-otp')
          .send({ email: employeeEmail, otp: '000000' });
        expect(wrongRes.status).toBe(400);
      }

      // Even the valid OTP is now blocked
      const lockedRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: employeeEmail, otp: validOtp });
      expect(lockedRes.status).toBe(400);
      expect(lockedRes.body.message.toLowerCase()).toContain('maximum');
    });

    it('verifies valid OTP once (single-use) and resets password', async () => {
      const empUser = await prisma.user.findUnique({ where: { email: employeeEmail } });
      const validOtp = '789012';

      await prisma.otpCode.updateMany({
        where: { userId: empUser!.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      await prisma.otpCode.create({
        data: {
          userId: empUser!.id,
          otpHash: await hashPassword(validOtp),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          attempts: 0,
        },
      });

      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: employeeEmail, otp: validOtp });
      expect(verifyRes.status).toBe(200);
      const resetToken = verifyRes.body.data.resetToken;
      expect(resetToken).toBeTypeOf('string');

      // Second attempt with same OTP fails (single-use)
      const reuseRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ email: employeeEmail, otp: validOtp });
      expect(reuseRes.status).toBe(400);

      const resetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ resetToken, newPassword: 'FinalPassword789' });
      expect(resetRes.status).toBe(200);

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: employeeEmail, password: 'FinalPassword789' });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.user.mustChangePassword).toBe(false);
    });
  });

  describe('Departments & Swagger Spec', () => {
    it('blocks deleting a department with employees (409) and allows deleting an empty one (200)', async () => {
      const nonEmptyDelete = await request(app)
        .delete(`/api/v1/departments/${testDeptId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(nonEmptyDelete.status).toBe(409);

      const emptyCreate = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `EmptyDept-${TEST_RUN_ID}`, description: 'Temporary empty dept' });
      expect(emptyCreate.status).toBe(201);
      const emptyDeptId = emptyCreate.body.data.department.id;

      const patchRes = await request(app)
        .patch(`/api/v1/departments/${emptyDeptId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Updated description' });
      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.department.description).toBe('Updated description');

      const emptyDelete = await request(app)
        .delete(`/api/v1/departments/${emptyDeptId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(emptyDelete.status).toBe(200);
    });

    it('serves OpenAPI 3.0 spec at /api-docs.json', async () => {
      const specRes = await request(app).get('/api-docs.json');
      expect(specRes.status).toBe(200);
      expect(specRes.body.openapi).toMatch(/^3\.0/);
      expect(specRes.body.paths['/api/v1/auth/login']).toBeDefined();
      expect(specRes.body.paths['/api/v1/employees']).toBeDefined();
      expect(specRes.body.paths['/api/v1/departments']).toBeDefined();
    });
  });
});
