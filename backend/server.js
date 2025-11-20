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

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Product routes
app.use("/api/products", productRoutes);
app.get('/', (req, res) => {
  res.send('Api Working!');
});

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