import assert from 'node:assert/strict';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import app from '../src/app';
import { env } from '../src/config/env';
import { prisma } from '../src/config/prisma';

async function warmupDatabase() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

async function loginAndGetCookie(
  baseUrl: string,
  username: string,
  password: string
): Promise<{ status: number; body: any; cookie: string; rawSetCookie: string }> {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const body = await res.json();
  const rawSetCookie = res.headers.get('set-cookie') || '';
  const cookie = rawSetCookie.split(';')[0] || '';
  return { status: res.status, body, cookie, rawSetCookie };
}

async function main() {
  console.log('===============================================================');
  console.log('     PHASE 1 & 2 AUTH + USER MANAGEMENT API VERIFICATION      ');
  console.log('===============================================================\n');

  await warmupDatabase();

  const server: http.Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const port = (server.address() as AddressInfo).port;
  const baseUrl = `http://localhost:${port}/api`;
  let createdUserId: number | null = null;
  let createdAuditLogId: bigint | null = null;

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.equal(healthRes.status, 200);
    console.log('✓ GET /api/health -> 200');

    // 2. Admin login + cookie flags + no passwordHash
    const adminLogin = await loginAndGetCookie(baseUrl, env.ADMIN_USERNAME, env.ADMIN_PASSWORD);
    assert.equal(adminLogin.status, 200);
    assert.equal(adminLogin.body.success, true);
    assert.equal(adminLogin.body.data.user.role, 'admin');
    assert.ok(adminLogin.rawSetCookie.includes('HttpOnly'), 'Cookie must be HttpOnly');
    assert.ok(adminLogin.rawSetCookie.includes('SameSite=Lax'), 'Cookie must be SameSite=Lax');
    assert.ok(!JSON.stringify(adminLogin.body).includes('passwordHash'));
    assert.ok(!JSON.stringify(adminLogin.body).includes('password_hash'));
    console.log('✓ POST /api/auth/login (admin) -> 200 + HttpOnly/SameSite=Lax cookie');

    // 3. /me with & without cookie
    const meWithCookie = await fetch(`${baseUrl}/auth/me`, {
      headers: { Cookie: adminLogin.cookie },
    });
    assert.equal(meWithCookie.status, 200);
    const meWithoutCookie = await fetch(`${baseUrl}/auth/me`);
    assert.equal(meWithoutCookie.status, 401);
    console.log('✓ GET /api/auth/me -> 200 with cookie, 401 without cookie');

    // 4. Logout clears cookie
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Cookie: adminLogin.cookie },
    });
    assert.equal(logoutRes.status, 200);
    const clearedSetCookie = logoutRes.headers.get('set-cookie') || '';
    assert.ok(clearedSetCookie.includes('ims_token=;'), 'Logout must clear cookie');
    console.log('✓ POST /api/auth/logout -> clears ims_token cookie');

    // 5. Wrong password & nonexistent user -> generic 401
    for (const [u, p] of [
      [env.ADMIN_USERNAME, 'WrongPassword999'],
      ['nonexistent_user_xyz', 'SomePass123'],
    ]) {
      const bad = await loginAndGetCookie(baseUrl, u, p);
      assert.equal(bad.status, 401);
      assert.equal(bad.body.success, false);
      assert.equal(bad.body.message, 'Invalid username or password');
    }
    console.log('✓ Wrong password & unknown username -> generic 401');

    // 6. Demo logins + 403 RBAC checks
    const managerLogin = await loginAndGetCookie(baseUrl, 'manager', 'Manager@12345');
    assert.equal(managerLogin.status, 200);
    assert.equal(managerLogin.body.data.user.role, 'inventory_manager');

    const employeeLogin = await loginAndGetCookie(baseUrl, 'employee', 'Employee@12345');
    assert.equal(employeeLogin.status, 200);
    assert.equal(employeeLogin.body.data.user.role, 'employee');

    for (const path of ['/users', '/roles', '/departments']) {
      const unauth = await fetch(`${baseUrl}${path}`);
      assert.equal(unauth.status, 401, `Expected 401 for unauthenticated ${path}`);

      const mgrForbidden = await fetch(`${baseUrl}${path}`, {
        headers: { Cookie: managerLogin.cookie },
      });
      assert.equal(mgrForbidden.status, 403, `Expected 403 for manager on ${path}`);

      const empForbidden = await fetch(`${baseUrl}${path}`, {
        headers: { Cookie: employeeLogin.cookie },
      });
      assert.equal(empForbidden.status, 403, `Expected 403 for employee on ${path}`);
    }
    console.log('✓ Unauthenticated -> 401; non-admin (manager/employee) -> 403 on admin routes');

    // 7. Admin GET /roles & /departments
    const rolesRes = await fetch(`${baseUrl}/roles`, { headers: { Cookie: adminLogin.cookie } });
    const deptsRes = await fetch(`${baseUrl}/departments`, { headers: { Cookie: adminLogin.cookie } });
    assert.equal(rolesRes.status, 200);
    assert.equal(deptsRes.status, 200);
    const rolesJson = await rolesRes.json();
    const deptsJson = await deptsRes.json();
    const empRole = rolesJson.data.roles.find((r: any) => r.code === 'employee');
    const mgrRole = rolesJson.data.roles.find((r: any) => r.code === 'inventory_manager');
    const opsDept = deptsJson.data.departments.find((d: any) => d.name === 'Operations');
    assert.ok(empRole && mgrRole && opsDept);
    console.log('✓ GET /api/roles & GET /api/departments -> 200');

    // 8. Admin GET /users (pagination + filters + no hash leak)
    const usersListRes = await fetch(`${baseUrl}/users?page=1&limit=10&search=admin&role=admin&status=active`, {
      headers: { Cookie: adminLogin.cookie },
    });
    assert.equal(usersListRes.status, 200);
    const usersListJson = await usersListRes.json();
    assert.ok(usersListJson.data.users.length >= 1);
    assert.ok(usersListJson.data.pagination.total >= 1);
    assert.ok(!JSON.stringify(usersListJson).includes('passwordHash'));
    assert.ok(!JSON.stringify(usersListJson).includes('password_hash'));
    console.log('✓ GET /api/users (search, filter, pagination, no passwordHash) -> 200');

    // 9. Admin POST /api/users (create + validation errors)
    const testUsername = `verify_user_${Date.now()}`;
    const testEmail = `${testUsername}@example.com`;
    const createRes = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminLogin.cookie,
      },
      body: JSON.stringify({
        fullName: 'Verify Tester',
        email: testEmail,
        username: testUsername,
        password: 'TestUser@123',
        roleId: empRole.id,
        departmentId: opsDept.id,
      }),
    });
    assert.equal(createRes.status, 201);
    const createJson = await createRes.json();
    createdUserId = createJson.data.user.id;
    assert.ok(createdUserId);
    assert.ok(!JSON.stringify(createJson).includes('passwordHash'));
    console.log(`✓ POST /api/users -> 201 (ID: ${createdUserId}, no passwordHash)`);

    // Duplicate username -> 409
    const dupUserRes = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
      body: JSON.stringify({
        fullName: 'Dup User',
        email: `other_${testEmail}`,
        username: testUsername,
        password: 'TestUser@123',
        roleId: empRole.id,
        departmentId: opsDept.id,
      }),
    });
    assert.equal(dupUserRes.status, 409);

    // Duplicate email -> 409
    const dupEmailRes = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
      body: JSON.stringify({
        fullName: 'Dup Email',
        email: testEmail,
        username: `other_${testUsername}`,
        password: 'TestUser@123',
        roleId: empRole.id,
        departmentId: opsDept.id,
      }),
    });
    assert.equal(dupEmailRes.status, 409);

    // Short password -> 400
    const shortPassRes = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
      body: JSON.stringify({
        fullName: 'Short Pass',
        email: `short_${testEmail}`,
        username: `short_${testUsername}`,
        password: '123',
        roleId: empRole.id,
        departmentId: opsDept.id,
      }),
    });
    assert.equal(shortPassRes.status, 400);
    console.log('✓ Duplicate username (409), duplicate email (409), short password (400) rejected');

    // 10. PATCH /api/users/:id (edit details + password + deactivate)
    const patchRes = await fetch(`${baseUrl}/users/${createdUserId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
      body: JSON.stringify({
        fullName: 'Verify Tester Updated',
        roleId: mgrRole.id,
        password: 'NewPassword@456',
      }),
    });
    assert.equal(patchRes.status, 200);
    const patchJson = await patchRes.json();
    assert.equal(patchJson.data.user.fullName, 'Verify Tester Updated');
    assert.equal(patchJson.data.user.role, 'inventory_manager');

    // New password logs in and gets valid session
    const newPassLogin = await loginAndGetCookie(baseUrl, testUsername, 'NewPassword@456');
    assert.equal(newPassLogin.status, 200);

    // Deactivate user -> login fails AND existing cookie /me fails!
    const deactivateRes = await fetch(`${baseUrl}/users/${createdUserId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
      body: JSON.stringify({ isActive: false }),
    });
    assert.equal(deactivateRes.status, 200);

    const inactiveLogin = await loginAndGetCookie(baseUrl, testUsername, 'NewPassword@456');
    assert.equal(inactiveLogin.status, 401);
    const inactiveMe = await fetch(`${baseUrl}/auth/me`, {
      headers: { Cookie: newPassLogin.cookie },
    });
    assert.equal(inactiveMe.status, 401);
    console.log('✓ PATCH /api/users/:id (edit, password change, deactivate blocks login & active cookie)');

    // 11. Admin self-protection checks
    const adminId = adminLogin.body.data.user.id;
    const selfDeactivate = await fetch(`${baseUrl}/users/${adminId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
      body: JSON.stringify({ isActive: false }),
    });
    assert.equal(selfDeactivate.status, 400);

    const selfDemote = await fetch(`${baseUrl}/users/${adminId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
      body: JSON.stringify({ roleId: empRole.id }),
    });
    assert.equal(selfDemote.status, 400);

    const selfDelete = await fetch(`${baseUrl}/users/${adminId}`, {
      method: 'DELETE',
      headers: { Cookie: adminLogin.cookie },
    });
    assert.equal(selfDelete.status, 400);
    console.log('✓ Admin self-deactivate, self-demote, self-delete all blocked (400)');

    // 12. Restricted delete + clean delete
    const tempAudit = await prisma.auditLog.create({
      data: {
        userId: createdUserId,
        action: 'create',
        entityType: 'users',
        entityId: BigInt(createdUserId),
      },
    });
    createdAuditLogId = tempAudit.id;

    const restrictedDel = await fetch(`${baseUrl}/users/${createdUserId}`, {
      method: 'DELETE',
      headers: { Cookie: adminLogin.cookie },
    });
    assert.equal(restrictedDel.status, 409);
    const restrictedJson = await restrictedDel.json();
    assert.equal(restrictedJson.code, 'DELETE_RESTRICTED');
    console.log('✓ DELETE /api/users/:id with history -> 409 DELETE_RESTRICTED');

    await prisma.auditLog.delete({ where: { id: createdAuditLogId } });
    createdAuditLogId = null;

    const cleanDel = await fetch(`${baseUrl}/users/${createdUserId}`, {
      method: 'DELETE',
      headers: { Cookie: adminLogin.cookie },
    });
    assert.equal(cleanDel.status, 200);
    createdUserId = null;
    console.log('✓ DELETE /api/users/:id without history -> 200 (user & employee removed)');

    // 13. Theme Settings API checks (public GET, admin-only PUT, validation, persistence)
    const initialThemeRes = await fetch(`${baseUrl}/theme`);
    assert.equal(initialThemeRes.status, 200);
    const initialThemeJson = await initialThemeRes.json();
    const originalTheme = initialThemeJson.data;
    console.log(`✓ GET /api/theme (public) -> 200 (activeTheme: ${originalTheme.activeTheme})`);

    try {
      // Unauthenticated PUT -> 401
      const unauthPut = await fetch(`${baseUrl}/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeTheme: 'emerald' }),
      });
      assert.equal(unauthPut.status, 401);

      // Non-admin PUT -> 403
      const mgrPut = await fetch(`${baseUrl}/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: managerLogin.cookie },
        body: JSON.stringify({ activeTheme: 'emerald' }),
      });
      assert.equal(mgrPut.status, 403);

      const empPut = await fetch(`${baseUrl}/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: employeeLogin.cookie },
        body: JSON.stringify({ activeTheme: 'emerald' }),
      });
      assert.equal(empPut.status, 403);
      console.log('✓ PUT /api/theme -> 401 unauth, 403 for manager/employee');

      // Invalid theme name -> 400
      const badTheme = await fetch(`${baseUrl}/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
        body: JSON.stringify({ activeTheme: 'neon' }),
      });
      assert.equal(badTheme.status, 400);

      // Invalid hex -> 400
      const badHex = await fetch(`${baseUrl}/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
        body: JSON.stringify({ activeTheme: 'custom', customPrimaryColor: 'not-a-hex' }),
      });
      assert.equal(badHex.status, 400);

      // Custom without color -> 400
      const missingColor = await fetch(`${baseUrl}/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
        body: JSON.stringify({ activeTheme: 'custom' }),
      });
      assert.equal(missingColor.status, 400);
      console.log('✓ PUT /api/theme -> 400 on invalid theme, invalid hex, and custom without color');

      // Save emerald -> persists
      const setEmerald = await fetch(`${baseUrl}/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
        body: JSON.stringify({ activeTheme: 'emerald' }),
      });
      assert.equal(setEmerald.status, 200);
      const getEmerald = await (await fetch(`${baseUrl}/theme`)).json();
      assert.equal(getEmerald.data.activeTheme, 'emerald');
      assert.equal(getEmerald.data.customPrimaryColor, null);

      // Save custom -> persists
      const setCustom = await fetch(`${baseUrl}/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
        body: JSON.stringify({ activeTheme: 'custom', customPrimaryColor: '#0f766e' }),
      });
      assert.equal(setCustom.status, 200);
      const getCustom = await (await fetch(`${baseUrl}/theme`)).json();
      assert.equal(getCustom.data.activeTheme, 'custom');
      assert.equal(getCustom.data.customPrimaryColor, '#0F766E');
      console.log('✓ PUT /api/theme -> preset & custom theme changes persist across GET /api/theme');
    } finally {
      // Restore original theme
      await fetch(`${baseUrl}/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: adminLogin.cookie },
        body: JSON.stringify({
          activeTheme: originalTheme.activeTheme,
          customPrimaryColor: originalTheme.customPrimaryColor,
        }),
      });
    }

    console.log('\n===============================================================');
    console.log('       ALL PHASE 1 & PHASE 2 VERIFICATION CHECKS PASSED       ');
    console.log('===============================================================');
  } finally {
    if (createdAuditLogId !== null) {
      await prisma.auditLog.delete({ where: { id: createdAuditLogId } }).catch(() => {});
    }
    if (createdUserId !== null) {
      const u = await prisma.user.findUnique({ where: { id: createdUserId } }).catch(() => null);
      if (u) {
        await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
        await prisma.employee.delete({ where: { id: u.employeeId } }).catch(() => {});
      }
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  });
