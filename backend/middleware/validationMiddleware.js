import { body, validationResult } from 'express-validator';

// Middleware to sanitize and validate input
export const sanitizeInput = (req, res, next) => {
  // Sanitize string inputs
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        // Remove potentially dangerous characters
        req.body[key] = req.body[key]
          .trim()
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .replace(/on\w+\s*=/gi, ''); // Remove event handlers
      }
    });
  }
  next();
};

// Validation middleware wrapper
export const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      ok: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  };
};

// Common validation rules
export const productValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 200 })
    .withMessage('Product name must be less than 200 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Product code is required')
    .isLength({ max: 50 })
    .withMessage('Product code must be less than 50 characters'),
  body('category')
    .isIn(['frames', 'lenses', 'eyedrop', 'accessories'])
    .withMessage('Invalid category'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('amountInStock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock amount must be a non-negative integer'),
];

export const orderValidation = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must have at least one item'),
  body('items.*.productId')
    .notEmpty()
    .withMessage('Product ID is required for each item'),
  body('items.*.qty')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('customer.fullName')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required'),
  body('customer.phone')
    .trim()
    .notEmpty()
    .withMessage('Customer phone is required'),
  body('customer.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address'),
];

export const appointmentValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('service')
    .notEmpty()
    .withMessage('Service selection is required'),
  body('date')
    .isISO8601()
    .withMessage('Valid date is required'),
  body('slot')
    .notEmpty()
    .withMessage('Time slot is required'),
];

