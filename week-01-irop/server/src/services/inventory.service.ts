import { InventoryItem } from '../models';
import {
  CreateInventoryInput,
  UpdateInventoryInput,
} from '../validators/inventory.validator';

export class InventoryService {
  static async list(query: { page: number; limit: number }) {
    const skip = (query.page - 1) * query.limit;
    const [data, total] = await Promise.all([
      InventoryItem.find()
        .skip(skip)
        .limit(query.limit)
        .sort({ name: 1 }),
      InventoryItem.countDocuments(),
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

  static async create(input: CreateInventoryInput) {
    const existing = await InventoryItem.findOne({ name: input.name });
    if (existing) {
      throw Object.assign(new Error('Inventory item with this name already exists'), {
        statusCode: 409,
        code: 'CONFLICT',
      });
    }

    const item = await InventoryItem.create(input);
    return item;
  }

  static async update(id: string, input: UpdateInventoryInput) {
    const item = await InventoryItem.findById(id);
    if (!item) {
      throw Object.assign(new Error('Inventory item not found'), {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }

    if (input.name && input.name !== item.name) {
      const existing = await InventoryItem.findOne({ name: input.name });
      if (existing) {
        throw Object.assign(new Error('Inventory item with this name already exists'), {
          statusCode: 409,
          code: 'CONFLICT',
        });
      }
    }

    if (input.name !== undefined) item.name = input.name;
    if (input.category !== undefined) item.category = input.category;
    if (input.quantity !== undefined) item.quantity = input.quantity;
    if (input.threshold !== undefined) item.threshold = input.threshold;
    if (input.unit !== undefined) item.unit = input.unit;

    await item.save();
    return item;
  }

  static async delete(id: string) {
    const item = await InventoryItem.findById(id);
    if (!item) {
      throw Object.assign(new Error('Inventory item not found'), {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }
    await item.deleteOne();
  }

  static async adjust(id: string, delta: number) {
    const item = await InventoryItem.findById(id);
    if (!item) {
      throw Object.assign(new Error('Inventory item not found'), {
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    }

    const newQty = item.quantity + delta;
    if (newQty < 0) {
      throw Object.assign(new Error('Quantity cannot go below 0'), {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    item.quantity = newQty;
    await item.save();
    return item;
  }
}
