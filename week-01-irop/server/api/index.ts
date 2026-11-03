import mongoose from 'mongoose';
import { app } from '../src/app';
import { getMongoUri } from '../src/config/env';

let isConnected = false;

export default async function handler(req: any, res: any) {
  if (!isConnected || mongoose.connection.readyState === 0) {
    const mongoUri = getMongoUri();
    await mongoose.connect(mongoUri);
    isConnected = true;
  }
  return app(req, res);
}
