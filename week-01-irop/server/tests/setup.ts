import mongoose from 'mongoose';
import { getMongoUri } from '../src/config/env';

// Force NODE_ENV to test
process.env.NODE_ENV = 'test';

export async function connectTestDb() {
  if (mongoose.connection.readyState === 0) {
    const uri = getMongoUri();
    await mongoose.connect(uri);
  }
}

export async function disconnectTestDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export async function clearTestDb() {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}
