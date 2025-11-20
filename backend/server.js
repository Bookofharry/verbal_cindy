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

// Connect to MongoDB
connectDB();

const app = express();

// CORS configuration - Restrict to specific origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : process.env.FRONTEND_URL 
    ? [process.env.FRONTEND_URL]
    : process.env.NODE_ENV === 'production'
      ? [] // No default in production - must be set
      : ['http://localhost:5173', 'http://localhost:3000']; // Development defaults

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.) in development
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Input sanitization middleware (apply to all routes)
app.use(sanitizeInput);


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


// Export the app for Vercel serverless functions
export default app;

// Only start the server if not in a serverless environment (local development)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`API running on :${PORT}`);
  });
}