import mongoose from 'mongoose';
import { app } from './app';
import { env, getMongoUri } from './config/env';

const PORT = env.PORT || 5000;

async function startServer() {
  try {
    const mongoUri = getMongoUri();
    await mongoose.connect(mongoUri);
    console.log(` Connected to MongoDB (${mongoose.connection.name})`);

    const server = app.listen(PORT, () => {
      console.log(` Server is running on port ${PORT} [${env.NODE_ENV}]`);
    });

    const shutdown = async () => {
      console.log('\nShutting down gracefully...');
      server.close(async () => {
        await mongoose.disconnect();
        console.log('MongoDB disconnected. Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
