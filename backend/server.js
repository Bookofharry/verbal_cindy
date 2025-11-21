// server/index.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

// Load environment variables FIRST before any other imports that might need them
dotenv.config();

// Import routes and configs (import these after dotenv.config())
import connectDB from "./config/database.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { sanitizeInput } from "./middleware/validationMiddleware.js";

// Check critical environment variables
const requiredEnvVars = ['MONGODB_URI'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('⚠️  Please set these in Vercel environment variables');
}

// Connect to MongoDB (with retry logic for serverless)
let dbConnected = false;
let dbConnectionError = null;

const connectDBWithRetry = async () => {
  if (dbConnected) return;
  if (dbConnectionError) throw dbConnectionError; // Don't retry if we know it will fail
  
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not set in environment variables');
    }
    await connectDB();
    dbConnected = true;
    dbConnectionError = null;
  } catch (error) {
    console.error('Database connection error:', error.message);
    dbConnectionError = error;
    // Don't exit in serverless - throw error instead
    throw error;
  }
};

// Connect immediately (for local dev) or on first request (for serverless)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  connectDBWithRetry().catch(err => {
    console.error('Initial database connection failed:', err.message);
  });
}

const app = express();

// CORS configuration - Restrict to specific origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : process.env.FRONTEND_URL 
    ? [process.env.FRONTEND_URL.trim()]
    : process.env.NODE_ENV === 'production'
      ? [] // No default in production - must be set
      : ['http://localhost:5173', 'http://localhost:3000']; // Development defaults

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.) in development
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // In production on Vercel, if no origins are configured, allow all (for initial setup)
    // TODO: Set ALLOWED_ORIGINS in Vercel environment variables
    if (allowedOrigins.length === 0) {
      console.warn('⚠️  WARNING: No ALLOWED_ORIGINS set. Allowing all origins. Set ALLOWED_ORIGINS in Vercel for security.');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests explicitly
// Express 5 doesn't support '*' wildcard, so we handle OPTIONS in CORS middleware instead
// The cors() middleware already handles OPTIONS requests automatically

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Input sanitization middleware (apply to all routes)
app.use(sanitizeInput);


// Ensure DB connection before handling requests (for serverless)
app.use(async (req, res, next) => {
  if (!dbConnected) {
    try {
      await connectDBWithRetry();
    } catch (error) {
      console.error('Failed to connect to database:', error.message);
      return res.status(503).json({
        error: 'Database connection failed',
        message: error.message || 'Please check your MongoDB connection string and environment variables',
        hint: 'Make sure MONGODB_URI is set in Vercel environment variables'
      });
    }
  }
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Auth routes (public)
app.use("/api/auth", authRoutes);

// Product routes
app.use("/api/products", productRoutes);

// Appointment routes
app.use("/api/appointments", appointmentRoutes);

// Order routes
app.use("/api/orders", orderRoutes);


// Error handling middleware (should be last)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
    path: req.path,
    method: req.method
  });
  
  // Don't send stack trace in production
  const errorResponse = {
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { 
      stack: err.stack,
      details: err
    })
  };
  
  res.status(err.status || 500).json(errorResponse);
});

// Catch-all for unhandled promise rejections in serverless
// CRITICAL: These handlers prevent the function from crashing
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('❌ Reason:', reason);
  // Don't exit in serverless - log and continue
  // The error will be caught by Express error handler
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('❌ Stack:', error.stack);
  // In serverless, we can't exit - just log
  // Vercel will handle the function failure
});

// Export the app for Vercel serverless functions
export default app;

// Only start the server if not in a serverless environment (local development)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`API running on :${PORT}`);
  });
}