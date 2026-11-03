const mongoose = require('mongoose');
const { app } = require('../dist/app');

let isConnected = false;

module.exports = async (req, res) => {
  try {
    if (!isConnected || mongoose.connection.readyState === 0) {
      const uri = process.env.MONGODB_URI;
      if (!uri) {
        return res.status(500).json({
          error: 'MONGODB_URI environment variable is not configured on Vercel',
          hint: 'Go to Vercel Project Settings -> Environment Variables and add MONGODB_URI',
        });
      }
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      isConnected = true;
    }
    return app(req, res);
  } catch (err) {
    console.error('Serverless execution error:', err);
    return res.status(500).json({
      error: 'Database connection failed',
      message: err.message,
      hint: 'Check if MongoDB Atlas Network Access has 0.0.0.0/0 (allow from anywhere) enabled.',
    });
  }
};
