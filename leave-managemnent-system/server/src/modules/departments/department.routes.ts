import { Router } from 'express';
import { authenticate, requirePermission } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import * as departmentController from './department.controller';
import {
  createDepartmentSchema,
  departmentIdParamSchema,
  updateDepartmentSchema,
} from './department.schema';

const router = Router();

/**
 * @openapi
 * /api/v1/departments:
 *   get:
 *     tags: [Departments]
 *     summary: List all departments with employee count
 *     description: Accessible to any authenticated active user (no special permission required, useful for dropdowns). Blocked if mustChangePassword is true.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Departments fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DepartmentListResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Account INACTIVE or MUST_CHANGE_PASSWORD
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForbiddenErrorResponse'
 */
router.get('/', authenticate, departmentController.list);

/**
 * @openapi
 * /api/v1/departments:
 *   post:
 *     tags: [Departments]
 *     summary: Create a new department
 *     description: Creates a department under the organization. Requires permission `employees.manage` (ADMIN bypasses).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDepartmentRequest'
 *     responses:
 *       201:
 *         description: Department created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DepartmentSingleResponse'
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
 *       409:
 *         description: Department name already exists
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
  '/',
  authenticate,
  requirePermission('employees.manage'),
  validate({ body: createDepartmentSchema }),
  departmentController.create,
);

/**
 * @openapi
 * /api/v1/departments/{id}:
 *   get:
 *     tags: [Departments]
 *     summary: Get single department by ID
 *     description: Fetches a department and its employee count. Requires permission `employees.manage` (ADMIN bypasses).
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
 *         description: Department fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DepartmentSingleResponse'
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
 *         description: Department not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Invalid department ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('employees.manage'),
  validate({ params: departmentIdParamSchema }),
  departmentController.getById,
);

/**
 * @openapi
 * /api/v1/departments/{id}:
 *   patch:
 *     tags: [Departments]
 *     summary: Update department
 *     description: Updates department name or description. Requires permission `employees.manage` (ADMIN bypasses).
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
 *             $ref: '#/components/schemas/UpdateDepartmentRequest'
 *     responses:
 *       200:
 *         description: Department updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DepartmentSingleResponse'
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
 *         description: Department not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Department name already exists
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
  authenticate,
  requirePermission('employees.manage'),
  validate({ params: departmentIdParamSchema, body: updateDepartmentSchema }),
  departmentController.update,
);

/**
 * @openapi
 * /api/v1/departments/{id}:
 *   delete:
 *     tags: [Departments]
 *     summary: Delete an empty department
 *     description: Deletes a department if it has zero assigned employees. Returns 409 Conflict if employees still belong to it. Requires permission `employees.manage` (ADMIN bypasses).
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
 *         description: Department deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NullDataSuccessResponse'
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
 *         description: Department not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Department still has assigned employees
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Invalid department ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('employees.manage'),
  validate({ params: departmentIdParamSchema }),
  departmentController.remove,
);

export default router;
