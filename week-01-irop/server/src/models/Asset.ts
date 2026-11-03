import mongoose, { Schema, Document, Types } from 'mongoose';

export type AssetKind = 'hardware' | 'software';
export type AssetStatus = 'in_use' | 'available' | 'in_repair';

export interface IAsset extends Document {
  _id: Types.ObjectId;
  name: string;
  kind: AssetKind;
  serialNumber?: string;
  status: AssetStatus;
  assignedTo?: Types.ObjectId | null;
  purchaseDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const assetSchema = new Schema<IAsset>(
  {
    name: { type: String, required: true, trim: true },
    kind: {
      type: String,
      required: true,
      enum: ['hardware', 'software'],
    },
    serialNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['in_use', 'available', 'in_repair'],
      default: 'available',
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    purchaseDate: { type: Date, default: null },
  },
  { timestamps: true }
);

// Text index for search on name and serialNumber
assetSchema.index({ name: 'text', serialNumber: 'text' });

export const Asset = mongoose.model<IAsset>('Asset', assetSchema);
