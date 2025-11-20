import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import Admin from '../models/Admin.js';
import { jwtConfig } from '../config/jwt.js';

const router = express.Router();

// POST /api/auth/login - Admin login
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          ok: false,
          error: 'Validation failed',
          details: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Find admin by email
      const admin = await Admin.findOne({ email: email.toLowerCase() });
      if (!admin) {
        return res.status(401).json({
          ok: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        });
      }

      // Check if admin is active
      if (!admin.isActive) {
        return res.status(403).json({
          ok: false,
          error: 'Account disabled',
          message: 'Your account has been disabled. Please contact support.',
        });
      }

      // Compare password
      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          ok: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        });
      }

      // Update last login
      admin.lastLogin = new Date();
      await admin.save();

      // Generate JWT token
      const token = jwt.sign(
        {
          id: admin._id,
          email: admin.email,
          role: admin.role,
        },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expiresIn }
      );

      res.json({
        ok: true,
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role,
        },
        message: 'Login successful',
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        ok: false,
        error: 'Server error',
        message: 'An error occurred during login. Please try again.',
      });
    }
  }
);

// POST /api/auth/verify - Verify token
router.post('/verify', async (req, res) => {
  try {
    // Try to get token from Authorization header first, then from body
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : req.body?.token;

    console.log('🔍 Token verification request received');
    console.log('Token present:', !!token);
    console.log('Token length:', token?.length);
    console.log('Token starts with eyJ:', token?.startsWith('eyJ'));

    if (!token) {
      console.error('❌ No token provided');
      return res.status(401).json({
        ok: false,
        error: 'No token provided',
        message: 'Please provide a valid authentication token',
      });
    }

    // Verify JWT token
    let decoded;
    try {
      console.log('🔐 Verifying token with secret length:', jwtConfig.secret.length);
      decoded = jwt.verify(token, jwtConfig.secret);
      console.log('✅ Token decoded successfully:', decoded.id);
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError.name, jwtError.message);
      console.error('❌ Token preview:', token.substring(0, 50) + '...');
      console.error('❌ Secret length:', jwtConfig.secret.length);
      
      if (jwtError.name === 'JsonWebTokenError') {
        // Check if it's a signature error specifically
        if (jwtError.message.includes('signature')) {
          console.error('❌ SIGNATURE MISMATCH: The JWT_SECRET used to sign the token does not match the one used to verify it.');
          console.error('❌ This usually means:');
          console.error('   1. JWT_SECRET changed between login and verification');
          console.error('   2. Backend was restarted with different JWT_SECRET');
          console.error('   3. Multiple backend instances with different secrets');
          return res.status(401).json({
            ok: false,
            error: 'Invalid token signature',
            message: 'Token signature is invalid. This usually means the server was restarted. Please login again.',
          });
        }
        return res.status(401).json({
          ok: false,
          error: 'Invalid token',
          message: 'Token is invalid. Please login again.',
        });
      }
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          ok: false,
          error: 'Token expired',
          message: 'Your session has expired. Please login again.',
        });
      }
      throw jwtError;
    }
    
    // Check if admin still exists and is active
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      console.error('❌ Admin not found with ID:', decoded.id);
      return res.status(401).json({
        ok: false,
        error: 'Invalid token',
        message: 'Admin account not found',
      });
    }

    if (!admin.isActive) {
      console.error('❌ Admin account disabled:', admin.email);
      return res.status(401).json({
        ok: false,
        error: 'Account disabled',
        message: 'Your account has been disabled',
      });
    }

    console.log('✅ Token verified successfully for admin:', admin.email);

    res.json({
      ok: true,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('❌ Token verification error:', error);
    res.status(500).json({
      ok: false,
      error: 'Server error',
      message: error.message || 'An error occurred during token verification',
    });
  }
});

export default router;

