const mongoose = require('mongoose');

const connectDB = async () => {
  // Skip database connection if no URI provided (for local development)
  if (!process.env.MONGODB_URI) {
    console.log('⚠️  No MONGODB_URI provided - running without database connection');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error);
    console.log('⚠️  Continuing without database connection...');
    // Don't exit - let the app run without database for now
  }
};

module.exports = connectDB; 