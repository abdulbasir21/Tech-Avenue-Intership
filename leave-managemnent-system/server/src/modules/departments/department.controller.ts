import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';
import * as departmentService from './department.service';
import { CreateDepartmentInput, UpdateDepartmentInput } from './department.schema';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const department = await departmentService.createDepartment(req.body as CreateDepartmentInput);
    sendSuccess(res, 201, 'Department created successfully', { department });
  } catch (err) {
    next(err);
  }
}

export async function list(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const departments = await departmentService.listDepartments();
    sendSuccess(res, 200, 'Departments fetched successfully', { departments });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const department = await departmentService.getDepartmentById(String(req.params.id));
    sendSuccess(res, 200, 'Department fetched successfully', { department });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const department = await departmentService.updateDepartment(
      String(req.params.id),
      req.body as UpdateDepartmentInput,
    );
    sendSuccess(res, 200, 'Department updated successfully', { department });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await departmentService.deleteDepartment(String(req.params.id));
    sendSuccess(res, 200, 'Department deleted successfully', null);
  } catch (err) {
    next(err);
  }
}
