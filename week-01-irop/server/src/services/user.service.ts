import bcrypt from 'bcryptjs';
import { User, IUser } from '../models';
import { CreateUserInput, UpdateUserInput } from '../validators/user.validator';
import { Types } from 'mongoose';

export class UserService {
  static async list(query: {
    page: number;
    limit: number;
    role?: string;
    department?: string;
    search?: string;
  }) {
    const filter: Record<string, unknown> = {};
    if (query.role) filter.role = query.role;
    if (query.department) filter.department = query.department;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const [data, total] = await Promise.all([
      User.find(filter).skip(skip).limit(query.limit).sort({ name: 1 }),
      User.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    };
  }

  static async create(input: CreateUserInput): Promise<IUser> {
    const existing = await User.findOne({ email: input.email.toLowerCase() });
    if (existing) {
      throw Object.assign(new Error('Email already exists'), { statusCode: 409, code: 'CONFLICT' });
    }

    if (input.managerId) {
      const manager = await User.findById(input.managerId);
      if (!manager) {
        throw Object.assign(new Error('Manager not found'), { statusCode: 404, code: 'NOT_FOUND' });
      }
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      department: input.department,
      managerId: input.managerId ? new Types.ObjectId(input.managerId) : undefined,
    });

    return user;
  }

  static async update(
    id: string,
    input: UpdateUserInput,
    currentUserId: string
  ): Promise<IUser> {
    const user = await User.findById(id);
    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    // Business rule: Admin cannot deactivate or demote themselves if they are the last admin
    if (id === currentUserId) {
      if (input.isActive === false || (input.role && input.role !== 'admin')) {
        const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
        if (adminCount <= 1) {
          throw Object.assign(
            new Error('Cannot deactivate or demote the last active admin'),
            { statusCode: 400, code: 'VALIDATION_ERROR' }
          );
        }
      }
    }

    if (input.managerId !== undefined) {
      if (input.managerId) {
        const manager = await User.findById(input.managerId);
        if (!manager) {
          throw Object.assign(new Error('Manager not found'), { statusCode: 404, code: 'NOT_FOUND' });
        }
      }
      user.managerId = input.managerId
        ? new Types.ObjectId(input.managerId)
        : null;
    }

    if (input.name !== undefined) user.name = input.name;
    if (input.role !== undefined) user.role = input.role;
    if (input.department !== undefined) user.department = input.department;
    if (input.isActive !== undefined) user.isActive = input.isActive;

    if (input.quotas) {
      const leaveTypes = ['casual', 'sick', 'annual', 'wfh'] as const;
      for (const lt of leaveTypes) {
        if (input.quotas[lt]) {
          if (input.quotas[lt]!.total !== undefined) {
            user.quotas[lt].total = input.quotas[lt]!.total!;
          }
          if (input.quotas[lt]!.used !== undefined) {
            user.quotas[lt].used = input.quotas[lt]!.used!;
          }
        }
      }
      user.markModified('quotas');
    }

    await user.save();
    return user;
  }

  static async resetPassword(id: string, newPassword: string): Promise<void> {
    const user = await User.findById(id).select('+passwordHash');
    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
  }
}
