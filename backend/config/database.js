import mongoose from 'mongoose';


const connectDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not set in environment variables');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Serverless-friendly options
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      // Connection pooling for serverless
      maxPoolSize: 10, // Maximum number of connections in pool
      minPoolSize: 1, // Minimum number of connections
      maxIdleTimeMS: 30000, // Close connections after 30s of inactivity
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    
    // Provide more specific error information
    if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.error('💡 Fix: Add 0.0.0.0/0 to MongoDB Atlas Network Access');
    } else if (error.message.includes('authentication')) {
      console.error('💡 Fix: Check username/password in MONGODB_URI');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('💡 Fix: Check MongoDB cluster URL in MONGODB_URI');
    }
    
    // Don't exit in serverless - throw error instead
    throw error;
  }
};

export default connectDB;

