import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be positive'],
    },
    code: {
      type: String,
      required: [true, 'Product code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      enum: {
        values: ['frames', 'lenses', 'eyedrop', 'accessories'],
        message: 'Category must be one of: frames, lenses, eyedrop, accessories',
      },
    },
    image: {
      type: String,
      required: [true, 'Product image is required'],
    }, // Cloudinary URL
    description: {
      type: String,
      default: '',
    },
    // Product specifications (varies by category)
    specs: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    amountInStock: {
      type: Number,
      default: 0,
      min: [0, 'Stock amount cannot be negative'],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Index for faster queries
productSchema.index({ category: 1 });
productSchema.index({ code: 1 });
productSchema.index({ inStock: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;

