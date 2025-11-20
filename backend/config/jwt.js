// Centralized JWT configuration
// This ensures the same secret is used everywhere

import dotenv from 'dotenv';
dotenv.config();

// Get JWT_SECRET from environment
// IMPORTANT: This must be the same value used for both signing and verifying
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-in-production') {
  console.warn('⚠️  WARNING: JWT_SECRET is not set or using default value!');
  console.warn('⚠️  Set JWT_SECRET in your .env file for security.');
  console.warn('⚠️  Using fallback secret (NOT SECURE FOR PRODUCTION)');
}

// Use fallback only in development
const SECRET = JWT_SECRET || (process.env.NODE_ENV === 'production' 
  ? null 
  : 'your-secret-key-change-in-production');

if (!SECRET) {
  throw new Error('JWT_SECRET must be set in production! Add it to your .env file.');
}

export const jwtConfig = {
  secret: SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

// Log the secret length (not the actual secret) for debugging
console.log(`🔐 JWT Config loaded: Secret length=${SECRET.length}, Expires in=${jwtConfig.expiresIn}`);

