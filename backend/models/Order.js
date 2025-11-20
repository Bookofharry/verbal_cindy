import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    ref: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    customer: {
      fullName: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
      },
      phone: {
        type: String,
        required: [true, 'Customer phone is required'],
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
    },
    items: [
      {
        productId: {
          type: String,
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        qty: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    whatsappMessage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Index for faster queries
orderSchema.index({ ref: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;

