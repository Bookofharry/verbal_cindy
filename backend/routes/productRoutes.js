import express from 'express';
import multer from 'multer';
import Product from '../models/Product.js';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';
import { authenticateAdmin } from '../middleware/authMiddleware.js';
import { validate, productValidation } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Configure multer for memory storage (we'll upload directly to Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'dcindy-products', // Organize images in a folder
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};

// GET /api/products/search - Search products
router.get('/search', async (req, res) => {
  try {
    const { q, category } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Build search query - search in name, description, code, and category
    const searchRegex = new RegExp(q.trim(), 'i'); // Case-insensitive
    
    const query = {
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { code: searchRegex },
        { category: searchRegex }
      ]
    };

    // Add category filter if provided
    if (category) {
      query.category = category;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    
    res.json(products);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

// GET /api/products - Get all products (with optional category filter)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};

    const products = await Product.find(query).sort({ createdAt: -1 });
    
    // Cache products for 30 seconds (balance between freshness and performance)
    // Products change infrequently, so short cache is safe
    res.set({
      'Cache-Control': 'public, max-age=30, s-maxage=30, stale-while-revalidate=60',
      'ETag': `"${products.length}-${Date.now()}"`, // Simple ETag for cache validation
    });
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products - Create new product (Admin only)
router.post('/', authenticateAdmin, upload.single('image'), validate(productValidation), async (req, res) => {
  try {
    const {
      name,
      price,
      code,
      category,
      description,
      specs,
      inStock,
      amountInStock,
      rating,
    } = req.body;

    // Upload image to Cloudinary if provided
    let imageUrl = req.body.image; // Allow direct URL input
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);
    }

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image is required' });
    }

    // Parse specs - handle string, object, or undefined
    let parsedSpecs = {};
    if (specs !== undefined && specs !== null && specs !== '') {
      if (typeof specs === 'string') {
        // Handle string "{}" or JSON string
        const trimmed = specs.trim();
        if (trimmed === '{}' || trimmed === '') {
          parsedSpecs = {};
        } else {
          try {
            parsedSpecs = JSON.parse(specs);
            // Ensure it's an object
            if (typeof parsedSpecs !== 'object' || Array.isArray(parsedSpecs)) {
              parsedSpecs = {};
            }
          } catch (e) {
            parsedSpecs = {};
          }
        }
      } else if (typeof specs === 'object' && !Array.isArray(specs)) {
        parsedSpecs = specs;
      }
    }

    const product = new Product({
      name,
      price: parseFloat(price),
      code: code.toUpperCase(),
      category,
      image: imageUrl,
      description: description || '',
      specs: parsedSpecs,
      inStock: inStock !== undefined ? inStock === 'true' : true,
      amountInStock: parseInt(amountInStock) || 0,
      rating: parseFloat(rating) || 0,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ error: 'Product code already exists' });
    }
    res.status(500).json({ error: 'Failed to create product', details: error.message });
  }
});

// PUT /api/products/:id - Update product (Admin only)
router.put('/:id', authenticateAdmin, upload.single('image'), validate(productValidation), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const {
      name,
      price,
      code,
      category,
      description,
      specs,
      inStock,
      amountInStock,
      rating,
    } = req.body;

    // Update image if new file is uploaded
    if (req.file) {
      product.image = await uploadToCloudinary(req.file.buffer);
    } else if (req.body.image) {
      product.image = req.body.image;
    }

    // Update other fields
    if (name) product.name = name;
    if (price) product.price = parseFloat(price);
    if (code) product.code = code.toUpperCase();
    if (category) product.category = category;
    if (description !== undefined) product.description = description;
    if (inStock !== undefined) product.inStock = inStock === 'true' || inStock === true;
    if (amountInStock !== undefined) product.amountInStock = parseInt(amountInStock);
    if (rating !== undefined) product.rating = parseFloat(rating);

    // Parse specs if provided
    if (specs !== undefined) {
      let parsedSpecs = {};
      if (typeof specs === 'string') {
        try {
          parsedSpecs = JSON.parse(specs);
        } catch (e) {
          parsedSpecs = {};
        }
      } else if (typeof specs === 'object' && specs !== null) {
        parsedSpecs = specs;
      }
      // Merge with existing specs or replace
      product.specs = { ...(product.specs || {}), ...parsedSpecs };
    }

    await product.save();
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product', details: error.message });
  }
});

// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;

