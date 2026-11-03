import { Asset, User, IAsset } from '../models';
import { CreateAssetInput, UpdateAssetInput } from '../validators/asset.validator';
import { Types } from 'mongoose';

export class AssetService {
  static async list(
    query: { page: number; limit: number; status?: string; q?: string },
    userId: string,
    role: string
  ) {
    const filter: Record<string, unknown> = {};

    if (role === 'employee') {
      filter.assignedTo = new Types.ObjectId(userId);
    }

    if (query.status) filter.status = query.status;

    if (query.q) {
      filter.$or = [
        { name: { $regex: query.q, $options: 'i' } },
        { serialNumber: { $regex: query.q, $options: 'i' } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const [data, total] = await Promise.all([
      Asset.find(filter)
        .skip(skip)
        .limit(query.limit)
        .populate('assignedTo', 'name email department')
        .sort({ createdAt: -1 }),
      Asset.countDocuments(filter),
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

  static async getMyAssets(userId: string) {
    const assets = await Asset.find({ assignedTo: new Types.ObjectId(userId) })
      .populate('assignedTo', 'name email department')
      .sort({ createdAt: -1 });
    return assets;
  }

  static async create(input: CreateAssetInput): Promise<IAsset> {
    if (input.serialNumber) {
      const existing = await Asset.findOne({ serialNumber: input.serialNumber });
      if (existing) {
        throw Object.assign(new Error('Serial number already exists'), {
          statusCode: 409,
          code: 'CONFLICT',
        });
      }
    }

    const asset = new Asset({
      name: input.name,
      kind: input.kind,
      serialNumber: input.serialNumber || undefined,
      status: input.assignedTo ? 'in_use' : (input.status || 'available'),
      assignedTo: input.assignedTo ? new Types.ObjectId(input.assignedTo) : null,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
    });
    await asset.save();

    await asset.populate('assignedTo', 'name email department');
    return asset;
  }

  static async update(id: string, input: UpdateAssetInput): Promise<IAsset> {
    const asset = await Asset.findById(id);
    if (!asset) {
      throw Object.assign(new Error('Asset not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (input.serialNumber && input.serialNumber !== asset.serialNumber) {
      const existing = await Asset.findOne({ serialNumber: input.serialNumber });
      if (existing) {
        throw Object.assign(new Error('Serial number already exists'), {
          statusCode: 409,
          code: 'CONFLICT',
        });
      }
    }

    if (input.name !== undefined) asset.name = input.name;
    if (input.kind !== undefined) asset.kind = input.kind;
    if (input.serialNumber !== undefined) asset.serialNumber = input.serialNumber;
    if (input.status !== undefined) asset.status = input.status;
    if (input.purchaseDate !== undefined) {
      asset.purchaseDate = input.purchaseDate ? new Date(input.purchaseDate) : null;
    }

    await asset.save();
    await asset.populate('assignedTo', 'name email department');
    return asset;
  }

  static async delete(id: string): Promise<void> {
    const asset = await Asset.findById(id);
    if (!asset) {
      throw Object.assign(new Error('Asset not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }
    await asset.deleteOne();
  }

  static async assign(id: string, userId: string): Promise<IAsset> {
    const asset = await Asset.findById(id);
    if (!asset) {
      throw Object.assign(new Error('Asset not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    if (asset.status === 'in_repair') {
      throw Object.assign(new Error('Cannot assign an asset that is in repair'), {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      throw Object.assign(new Error('User not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    asset.assignedTo = new Types.ObjectId(userId);
    asset.status = 'in_use';
    await asset.save();
    await asset.populate('assignedTo', 'name email department');
    return asset;
  }

  static async unassign(id: string): Promise<IAsset> {
    const asset = await Asset.findById(id);
    if (!asset) {
      throw Object.assign(new Error('Asset not found'), { statusCode: 404, code: 'NOT_FOUND' });
    }

    asset.assignedTo = null;
    asset.status = 'available';
    await asset.save();
    await asset.populate('assignedTo', 'name email department');
    return asset;
  }
}
