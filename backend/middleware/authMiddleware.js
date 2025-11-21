import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { jwtConfig } from '../config/jwt.js';

// Middleware to authenticate admin requests
export const authenticateAdmin = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        ok: false,
        error: 'Unauthorized',
        message: 'No token provided. Please login.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    let decoded;
    try {
      // Check if JWT secret is configured
      if (!jwtConfig.secret) {
        console.error('❌ JWT_SECRET is not configured!');
        return res.status(500).json({
          ok: false,
          error: 'Server configuration error',
          message: 'JWT_SECRET is not set. Please configure it in environment variables.',
        });
      }
      
      decoded = jwt.verify(token, jwtConfig.secret);
    } catch (error) {
      console.error('JWT verification error:', {
        name: error.name,
        message: error.message,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'no token',
        secretLength: jwtConfig.secret ? jwtConfig.secret.length : 0,
      });
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          ok: false,
          error: 'Token expired',
          message: 'Your session has expired. Please login again.',
        });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          ok: false,
          error: 'Invalid token',
          message: 'Invalid authentication token. This may happen if JWT_SECRET changed. Please login again.',
        });
      }
      return res.status(401).json({
        ok: false,
        error: 'Token verification failed',
        message: 'Unable to verify token. Please login again.',
      });
    }

    // Check if admin exists and is active
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({
        ok: false,
        error: 'Admin not found',
        message: 'Admin account does not exist.',
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        ok: false,
        error: 'Account disabled',
        message: 'Your account has been disabled.',
      });
    }

    // Attach admin info to request
    req.admin = {
      id: admin._id,
      email: admin.email,
      role: admin.role,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      ok: false,
      error: 'Server error',
      message: 'An error occurred during authentication.',
    });
  }
};

