import express from 'express';
import Order from '../models/Order.js';
import { nanoid } from 'nanoid';

const router = express.Router();

// Helper function to generate order reference
const makeRef = () => {
  const d = new Date();
  const yyyymmdd = d.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const code = nanoid(4).toUpperCase(); // short id
  return `GLS-${yyyymmdd}-${code}`;
};

// GET /api/orders - Get all orders (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = {};
    
    // Filter by status
    if (status && ['pending', 'paid', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      query.status = status;
    }
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 }) // Most recent first
      .lean();
    
    res.json({ ok: true, orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/ref/:ref - Get order by reference (customer-facing)
// IMPORTANT: This route must come before /:id to avoid route conflicts
router.get('/ref/:ref', async (req, res) => {
  try {
    const order = await Order.findOne({ ref: req.params.ref.toUpperCase() });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ ok: true, order });
  } catch (error) {
    console.error('Error fetching order by reference:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// GET /api/orders/:id - Get order by ID
router.get('/:id', async (req, res) => {
  try {
    // Check if it's a reference (format: GLS-YYYYMMDD-XXXX) or MongoDB ID
    const isReference = /^[A-Z]{3}-\d{8}-[A-Z0-9]{4}$/.test(req.params.id);
    
    let order;
    if (isReference) {
      order = await Order.findOne({ ref: req.params.id });
    } else {
      order = await Order.findById(req.params.id);
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ ok: true, order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /api/orders - Create new order
router.post('/', async (req, res) => {
  try {
    const { items, customer, shippingFee = 0, discount = 0 } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }
    if (!customer || !customer.fullName || !customer.phone) {
      return res.status(400).json({ error: 'Customer information is required' });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const total = Math.max(0, subtotal + (parseFloat(shippingFee) || 0) - (parseFloat(discount) || 0));

    // Generate unique reference
    let ref;
    let isUnique = false;
    while (!isUnique) {
      ref = makeRef();
      const existing = await Order.findOne({ ref });
      if (!existing) {
        isUnique = true;
      }
    }

    // Create WhatsApp message
    const lineItems = items.map(i => `• ${i.title} x${i.qty} — ₦${i.price.toLocaleString()}`).join('%0A');
    const whatsappMessage = [
      `Hello, I want to pay for my order.`,
      `Reference: ${ref}`,
      `Name: ${customer.fullName}`,
      `Phone: ${customer.phone}`,
      `Total: ₦${total.toLocaleString()}`,
      `Items:`,
      lineItems
    ].join('%0A'); // URL-encoded newlines for WhatsApp

    // Create order
    const order = new Order({
      ref,
      customer: {
        fullName: customer.fullName.trim(),
        phone: customer.phone.trim(),
        email: customer.email ? customer.email.trim().toLowerCase() : '',
      },
      items: items.map(item => ({
        productId: item.productId || item.id || '',
        title: item.title || item.name || '',
        price: parseFloat(item.price) || 0,
        qty: parseInt(item.qty) || 1,
      })),
      subtotal,
      shippingFee: parseFloat(shippingFee) || 0,
      discount: parseFloat(discount) || 0,
      total,
      status: 'pending',
      whatsappMessage,
    });

    await order.save();

    res.status(201).json({
      ok: true,
      order,
      whatsappMessage,
      message: 'Order created successfully',
    });
  } catch (error) {
    console.error('Error creating order:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    // Handle duplicate reference (shouldn't happen, but just in case)
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Reference already exists. Please try again.' });
    }
    
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PUT /api/orders/:id - Update order
router.put('/:id', async (req, res) => {
  try {
    const { status, shippingFee, discount } = req.body;

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update fields if provided
    if (status !== undefined) {
      if (['pending', 'paid', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        order.status = status;
      }
    }
    if (shippingFee !== undefined) {
      order.shippingFee = parseFloat(shippingFee) || 0;
      // Recalculate total
      order.total = Math.max(0, order.subtotal + order.shippingFee - order.discount);
    }
    if (discount !== undefined) {
      order.discount = parseFloat(discount) || 0;
      // Recalculate total
      order.total = Math.max(0, order.subtotal + order.shippingFee - order.discount);
    }

    await order.save();

    res.json({ ok: true, order, message: 'Order updated successfully' });
  } catch (error) {
    console.error('Error updating order:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// POST /api/orders/:id/mark-paid - Mark order as paid
router.post('/:id/mark-paid', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'paid' },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ ok: true, order, message: 'Order marked as paid' });
  } catch (error) {
    console.error('Error marking order as paid:', error);
    res.status(500).json({ error: 'Failed to mark order as paid' });
  }
});

// DELETE /api/orders/:id - Delete order
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ ok: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export default router;

