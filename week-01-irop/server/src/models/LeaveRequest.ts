import mongoose, { Schema, Document, Types } from 'mongoose';

export type LeaveType = 'casual' | 'sick' | 'annual' | 'wfh';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface ILeaveRequest extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  reviewNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const leaveRequestSchema = new Schema<ILeaveRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      required: true,
      enum: ['casual', 'sick', 'annual', 'wfh'],
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

leaveRequestSchema.index({ userId: 1, status: 1 });

export const LeaveRequest = mongoose.model<ILeaveRequest>(
  'LeaveRequest',
  leaveRequestSchema
);
