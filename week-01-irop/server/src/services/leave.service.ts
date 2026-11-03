import { LeaveRequest, User } from '../models';
import { CreateLeaveInput } from '../validators/leave.validator';
import { Types } from 'mongoose';

/**
 * Count weekdays (Mon–Fri) between two dates inclusive.
 */
export function countWeekdays(start: Date, end: Date): number {
  let count = 0;
  const d = new Date(start);
  d.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  while (d <= endDate) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export class LeaveService {
  static async create(userId: string, input: CreateLeaveInput) {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    // End must be >= start
    if (endDate < startDate) {
      throw Object.assign(new Error('End date must be on or after start date'), {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    // No past-start except WFH today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
      if (!(input.type === 'wfh' && startDate.getTime() === today.getTime())) {
        throw Object.assign(new Error('Start date cannot be in the past'), {
          statusCode: 400,
          code: 'VALIDATION_ERROR',
        });
      }
    }

    const days = countWeekdays(startDate, endDate);
    if (days < 1) {
      throw Object.assign(new Error('Leave must include at least one weekday'), {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    // Check overlapping pending/approved leaves
    const overlap = await LeaveRequest.findOne({
      userId: new Types.ObjectId(userId),
      status: { $in: ['pending', 'approved'] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });

    if (overlap) {
      throw Object.assign(new Error('You have an overlapping leave request'), {
        statusCode: 409,
        code: 'CONFLICT',
      });
    }

    // Check quota
    const user = await User.findById(userId);
    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    const quota = user.quotas[input.type];
    const remaining = quota.total - quota.used;
    if (remaining < days) {
      throw Object.assign(
        new Error(`Insufficient ${input.type} leave balance. Remaining: ${remaining}, Requested: ${days}`),
        { statusCode: 400, code: 'QUOTA_EXCEEDED' }
      );
    }

    const leave = await LeaveRequest.create({
      userId: new Types.ObjectId(userId),
      type: input.type,
      startDate,
      endDate,
      days,
      reason: input.reason,
    });

    return leave;
  }

  static async getMyLeaves(
    userId: string,
    query: { page: number; limit: number; status?: string }
  ) {
    const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId) };
    if (query.status) filter.status = query.status;

    const skip = (query.page - 1) * query.limit;
    const [data, total] = await Promise.all([
      LeaveRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .populate('reviewedBy', 'name email'),
      LeaveRequest.countDocuments(filter),
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

  static async getBalance(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    const leaveTypes = ['casual', 'sick', 'annual', 'wfh'] as const;
    return leaveTypes.map((type) => ({
      type,
      total: user.quotas[type].total,
      used: user.quotas[type].used,
      remaining: user.quotas[type].total - user.quotas[type].used,
    }));
  }

  static async cancel(leaveId: string, userId: string) {
    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) {
      throw Object.assign(new Error('Leave request not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (leave.userId.toString() !== userId) {
      throw Object.assign(new Error('You can only cancel your own leave requests'), {
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    }

    if (leave.status !== 'pending') {
      throw Object.assign(new Error('Only pending leaves can be cancelled'), {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    leave.status = 'cancelled';
    await leave.save();
    return leave;
  }

  static async getTeamLeaves(
    userId: string,
    role: string,
    query: { page: number; limit: number; status?: string }
  ) {
    const filter: Record<string, unknown> = {};

    if (role === 'manager') {
      // Manager sees only their direct reports' leaves
      const teamMembers = await User.find({ managerId: new Types.ObjectId(userId) }).select('_id');
      const memberIds = teamMembers.map((m) => m._id);
      filter.userId = { $in: memberIds };
    }
    // Admin sees all leaves

    if (query.status) filter.status = query.status;

    const skip = (query.page - 1) * query.limit;
    const [data, total] = await Promise.all([
      LeaveRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .populate('userId', 'name email department')
        .populate('reviewedBy', 'name email'),
      LeaveRequest.countDocuments(filter),
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

  static async approve(leaveId: string, reviewerId: string, reviewNote: string) {
    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) {
      throw Object.assign(new Error('Leave request not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (leave.status !== 'pending') {
      throw Object.assign(new Error('Only pending leaves can be approved'), {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    // Cannot approve own leave
    if (leave.userId.toString() === reviewerId) {
      throw Object.assign(new Error('You cannot approve your own leave'), {
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    }

    // Check manager authority
    const reviewer = await User.findById(reviewerId);
    if (!reviewer) {
      throw Object.assign(new Error('Reviewer not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (reviewer.role === 'manager') {
      const leaveOwner = await User.findById(leave.userId);
      if (!leaveOwner || leaveOwner.managerId?.toString() !== reviewerId) {
        throw Object.assign(new Error('You can only approve leaves of your direct reports'), {
          statusCode: 403,
          code: 'FORBIDDEN',
        });
      }
    }

    // Deduct quota atomically with status change
    const leaveOwner = await User.findById(leave.userId);
    if (!leaveOwner) {
      throw Object.assign(new Error('Leave owner not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    const quota = leaveOwner.quotas[leave.type];
    const remaining = quota.total - quota.used;
    if (remaining < leave.days) {
      throw Object.assign(
        new Error(`Insufficient ${leave.type} leave balance for approval`),
        { statusCode: 400, code: 'QUOTA_EXCEEDED' }
      );
    }

    // Atomically update quota
    const quotaField = `quotas.${leave.type}.used`;
    await User.updateOne(
      { _id: leave.userId },
      { $inc: { [quotaField]: leave.days } }
    );

    leave.status = 'approved';
    leave.reviewedBy = new Types.ObjectId(reviewerId);
    leave.reviewedAt = new Date();
    leave.reviewNote = reviewNote || undefined;
    await leave.save();

    return leave;
  }

  static async reject(leaveId: string, reviewerId: string, reviewNote: string) {
    const leave = await LeaveRequest.findById(leaveId);
    if (!leave) {
      throw Object.assign(new Error('Leave request not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (leave.status !== 'pending') {
      throw Object.assign(new Error('Only pending leaves can be rejected'), {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    // Cannot reject own leave
    if (leave.userId.toString() === reviewerId) {
      throw Object.assign(new Error('You cannot reject your own leave'), {
        statusCode: 403,
        code: 'FORBIDDEN',
      });
    }

    // Check manager authority
    const reviewer = await User.findById(reviewerId);
    if (!reviewer) {
      throw Object.assign(new Error('Reviewer not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (reviewer.role === 'manager') {
      const leaveOwner = await User.findById(leave.userId);
      if (!leaveOwner || leaveOwner.managerId?.toString() !== reviewerId) {
        throw Object.assign(new Error('You can only reject leaves of your direct reports'), {
          statusCode: 403,
          code: 'FORBIDDEN',
        });
      }
    }

    // No quota deduction on reject
    leave.status = 'rejected';
    leave.reviewedBy = new Types.ObjectId(reviewerId);
    leave.reviewedAt = new Date();
    leave.reviewNote = reviewNote || undefined;
    await leave.save();

    return leave;
  }
}
