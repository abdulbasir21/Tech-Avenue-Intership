import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { seedDatabase } from '../src/seed/seed';
import { User, LeaveRequest, Asset, InventoryItem } from '../src/models';
import { connectTestDb, disconnectTestDb } from './setup';

describe('Database Seed Script', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  it('running seed twice yields identical counts and correct quota used values', async () => {
    // Run 1
    await seedDatabase();

    const users1 = await User.find();
    const leaves1 = await LeaveRequest.find();
    const assets1 = await Asset.find();
    const inventory1 = await InventoryItem.find();

    expect(users1.length).toBe(8);
    expect(leaves1.length).toBe(7);
    expect(assets1.length).toBe(10);
    expect(inventory1.length).toBe(8);

    // Verify quota used values
    const usman1 = await User.findOne({ email: 'usman@irop.demo' });
    expect(usman1?.quotas.casual.used).toBe(1);
    expect(usman1?.quotas.sick.used).toBe(0);

    const hina1 = await User.findOne({ email: 'hina@irop.demo' });
    expect(hina1?.quotas.sick.used).toBe(2);

    const maryam1 = await User.findOne({ email: 'maryam@irop.demo' });
    expect(maryam1?.quotas.wfh.used).toBe(1);

    // Run 2 (verify idempotency)
    await seedDatabase();

    const users2 = await User.find();
    const leaves2 = await LeaveRequest.find();
    const assets2 = await Asset.find();
    const inventory2 = await InventoryItem.find();

    expect(users2.length).toBe(8);
    expect(leaves2.length).toBe(7);
    expect(assets2.length).toBe(10);
    expect(inventory2.length).toBe(8);

    const usman2 = await User.findOne({ email: 'usman@irop.demo' });
    expect(usman2?.quotas.casual.used).toBe(1);
  });
});
