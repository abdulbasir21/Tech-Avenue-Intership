import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQuota {
  total: number;
  used: number;
}

export interface IQuotas {
  casual: IQuota;
  sick: IQuota;
  annual: IQuota;
  wfh: IQuota;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: 'employee' | 'manager' | 'admin';
  department: string;
  managerId?: Types.ObjectId | null;
  isActive: boolean;
  quotas: IQuotas;
  createdAt: Date;
  updatedAt: Date;
}

const quotaSchema = new Schema<IQuota>(
  {
    total: { type: Number, required: true, min: 0 },
    used: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      required: true,
      enum: ['employee', 'manager', 'admin'],
    },
    department: { type: String, required: true, trim: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
    quotas: {
      type: {
        casual: { type: quotaSchema, default: () => ({ total: 10, used: 0 }) },
        sick: { type: quotaSchema, default: () => ({ total: 8, used: 0 }) },
        annual: { type: quotaSchema, default: () => ({ total: 14, used: 0 }) },
        wfh: { type: quotaSchema, default: () => ({ total: 12, used: 0 }) },
      },
      default: () => ({
        casual: { total: 10, used: 0 },
        sick: { total: 8, used: 0 },
        annual: { total: 14, used: 0 },
        wfh: { total: 12, used: 0 },
      }),
    },
  },
  { timestamps: true }
);

// Email unique index is declared on the field definition above

// Never return passwordHash in JSON
userSchema.set('toJSON', {
  transform(_doc, ret) {
    const obj = ret as unknown as Record<string, unknown>;
    delete obj.passwordHash;
    return obj;
  },
});

export const User = mongoose.model<IUser>('User', userSchema);
