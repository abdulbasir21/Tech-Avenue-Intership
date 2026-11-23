import '../../types/express';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { sendSuccess } from '../../utils/response';
import * as employeeService from './employee.service';
import {
  CreateEmployeeInput,
  ListEmployeesQuery,
  ResetEmployeePasswordInput,
  UpdateEmployeeInput,
  UpdateEmployeeStatusInput,
} from './employee.schema';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employee = await employeeService.createEmployee(req.body as CreateEmployeeInput);
    sendSuccess(res, 201, 'Employee created successfully', { employee });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await employeeService.listEmployees(
      req.query as unknown as ListEmployeesQuery,
    );
    sendSuccess(res, 200, 'Employees fetched successfully', result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employee = await employeeService.getEmployeeById(String(req.params.id));
    sendSuccess(res, 200, 'Employee fetched successfully', { employee });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const employee = await employeeService.updateEmployee(
      String(req.params.id),
      req.body as UpdateEmployeeInput,
    );
    sendSuccess(res, 200, 'Employee updated successfully', { employee });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }
    const employee = await employeeService.updateEmployeeStatus(
      String(req.params.id),
      req.body as UpdateEmployeeStatusInput,
      req.user.id,
    );
    sendSuccess(res, 200, 'Employee status updated successfully', { employee });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await employeeService.resetEmployeePassword(
      String(req.params.id),
      req.body as ResetEmployeePasswordInput,
    );
    sendSuccess(res, 200, 'Employee temporary password reset successfully', result);
  } catch (err) {
    next(err);
  }
}
