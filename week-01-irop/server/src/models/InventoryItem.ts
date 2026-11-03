import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IInventoryItem extends Document {
  _id: Types.ObjectId;
  name: string;
  category: string;
  quantity: number;
  threshold: number;
  unit: string;
  isLowStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    threshold: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

inventoryItemSchema.virtual('isLowStock').get(function (this: IInventoryItem) {
  return this.quantity <= this.threshold;
});

export const InventoryItem = mongoose.model<IInventoryItem>(
  'InventoryItem',
  inventoryItemSchema
);
