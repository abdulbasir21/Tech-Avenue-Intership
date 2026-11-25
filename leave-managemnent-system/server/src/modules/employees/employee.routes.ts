import { Router } from 'express';
import { authenticate, requirePermission } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import * as employeeController from './employee.controller';
import {
  createEmployeeSchema,
  employeeIdParamSchema,
  listEmployeesQuerySchema,
  resetEmployeePasswordSchema,
  updateEmployeeSchema,
  updateEmployeeStatusSchema,
} from './employee.schema';

const router = Router();

router.use(authenticate, requirePermission('employees.manage'));

/**
 * @openapi
 * /api/v1/employees:
 *   post:
 *     tags: [Employees]
 *     summary: Create a new employee account
 *     description: Creates user, employee, and user_preferences in a single transaction. Requires permission `employees.manage` (ADMIN bypasses). Sets mustChangePassword=true and auto-generates employeeCode if omitted.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEmployeeRequest'
 *     responses:
 *       201:
 *         description: Employee created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmployeeSingleResponse'
 *       400:
 *         description: Invalid reporting manager rule (e.g. ADMIN with manager, inactive/non-manager reporting manager)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (missing employees.manage permission or MUST_CHANGE_PASSWORD)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenErrorResponse'
 *       404:
 *         description: Department or reporting manager not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Duplicate email or employee code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 */
router.post('/', validate({ body: createEmployeeSchema }), employeeController.create);

/**
 * @openapi
 * /api/v1/employees:
 *   get:
 *     tags: [Employees]
 *     summary: List employees with search, filters, pagination, and sorting
 *     description: Returns paginated employees with email, role, and status (never password_hash). Requires permission `employees.manage` (ADMIN bypasses).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or employeeCode
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: role
 *         schema:
 *           $ref: '#/components/schemas/UserRole'
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/UserStatus'
 *       - in: query
 *         name: reportingManagerId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, employeeCode, joinDate, createdAt, email, role, status]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Employees fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmployeeListResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (missing employees.manage permission or MUST_CHANGE_PASSWORD)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenErrorResponse'
 *       422:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 */
router.get('/', validate({ query: listEmployeesQuerySchema }), employeeController.list);

/**
 * @openapi
 * /api/v1/employees/{id}:
 *   get:
 *     tags: [Employees]
 *     summary: Get single employee by ID
 *     description: Fetches detailed employee profile without passwordHash. Requires permission `employees.manage` (ADMIN bypasses).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Employee fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmployeeSingleResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenErrorResponse'
 *       404:
 *         description: Employee not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Invalid employee ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 */
router.get(
  '/:id',
  validate({ params: employeeIdParamSchema }),
  employeeController.getById,
);

/**
 * @openapi
 * /api/v1/employees/{id}:
 *   patch:
 *     tags: [Employees]
 *     summary: Update employee profile, department, manager, or role
 *     description: Updates employee details. Enforces self-manager prevention and ADMIN no-manager constraint. Requires permission `employees.manage` (ADMIN bypasses).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateEmployeeRequest'
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmployeeSingleResponse'
 *       400:
 *         description: Invalid reporting manager assignment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenErrorResponse'
 *       404:
 *         description: Employee, department, or manager not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Duplicate email or employee code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 */
router.patch(
  '/:id',
  validate({ params: employeeIdParamSchema, body: updateEmployeeSchema }),
  employeeController.update,
);

/**
 * @openapi
 * /api/v1/employees/{id}/status:
 *   patch:
 *     tags: [Employees]
 *     summary: Activate or deactivate an employee account
 *     description: Sets user status to ACTIVE or INACTIVE. Administrators cannot deactivate themselves. Requires permission `employees.manage` (ADMIN bypasses).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateEmployeeStatusRequest'
 *     responses:
 *       200:
 *         description: Employee status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmployeeSingleResponse'
 *       400:
 *         description: Cannot deactivate own account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenErrorResponse'
 *       404:
 *         description: Employee not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 */
router.patch(
  '/:id/status',
  validate({ params: employeeIdParamSchema, body: updateEmployeeStatusSchema }),
  employeeController.updateStatus,
);

/**
 * @openapi
 * /api/v1/employees/{id}/reset-password:
 *   post:
 *     tags: [Employees]
 *     summary: Admin reset of an employee's temporary password
 *     description: Sets a new temporary password for the employee and forces mustChangePassword=true on next login. Requires permission `employees.manage` (ADMIN bypasses).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetEmployeePasswordRequest'
 *     responses:
 *       200:
 *         description: Employee temporary password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResetEmployeePasswordResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenErrorResponse'
 *       404:
 *         description: Employee not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 */
router.post(
  '/:id/reset-password',
  validate({ params: employeeIdParamSchema, body: resetEmployeePasswordSchema }),
  employeeController.resetPassword,
);

export default router;
