// server/index.js
import express from "express";

import cors from "cors";

import { nanoid } from "nanoid";

import bodyParser from "body-parser";

import dotenv from "dotenv";

import connectDB from "./config/database.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { sanitizeInput } from "./middleware/validationMiddleware.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB (with retry logic for serverless)
let dbConnected = false;
const connectDBWithRetry = async () => {
  if (dbConnected) return;
  
  try {
    await connectDB();
    dbConnected = true;
  } catch (error) {
    console.error('Database connection error:', error);
    // Don't exit in serverless - let the function handle it
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      process.exit(1);
    }
  }
};

// Connect immediately (for local dev) or on first request (for serverless)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  connectDBWithRetry();
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
app.options('*', cors());

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
      console.error('Failed to connect to database:', error);
      return res.status(503).json({
        error: 'Database connection failed',
        message: 'Please check your MongoDB connection string'
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
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
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