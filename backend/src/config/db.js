const mongoose = require('mongoose');
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('MongoDB URI configured: false');
    const error = new Error('MONGODB_URI environment variable is missing.');
    console.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }

  console.log('MongoDB URI configured: true');

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
    return conn;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
