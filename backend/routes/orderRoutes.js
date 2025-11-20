import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { nanoid } from 'nanoid';
import { authenticateAdmin } from '../middleware/authMiddleware.js';
import { validate, orderValidation } from '../middleware/validationMiddleware.js';

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

    // Check stock availability (but don't deduct yet - will deduct when marked as paid)
    const stockErrors = [];
    
    for (const item of items) {
      const productId = item.productId || item.id;
      if (!productId) continue;
      
      const product = await Product.findById(productId);
      if (!product) {
        stockErrors.push(`Product ${item.title || item.name} not found`);
        continue;
      }
      
      // Check if product is in stock (reserve check, don't deduct yet)
      if (!product.inStock || product.amountInStock < item.qty) {
        stockErrors.push(`${product.name} - Only ${product.amountInStock} available, requested ${item.qty}`);
      }
    }
    
    if (stockErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Stock unavailable', 
        details: stockErrors 
      });
    }
    
    // Note: Stock will be deducted when order is marked as paid

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

    // Create WhatsApp message (store as plain text with newlines, frontend will encode for URL)
    const lineItems = items.map(i => `• ${i.title} x${i.qty} — ₦${i.price.toLocaleString()}`).join('\n');
    const whatsappMessage = [
      `Hello, I want to pay for my order.`,
      `Reference: ${ref}`,
      `Name: ${customer.fullName}`,
      `Phone: ${customer.phone}`,
      `Total: ₦${total.toLocaleString()}`,
      `Items:`,
      lineItems
    ].join('\n'); // Plain text with newlines - frontend will encode for WhatsApp URL

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

// PUT /api/orders/:id - Update order (Admin only)
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { status, shippingFee, discount } = req.body;

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const previousStatus = order.status;

    // Update fields if provided
    if (status !== undefined) {
      if (['pending', 'paid', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        // If order was paid and is now being cancelled, restore stock
        if (previousStatus === 'paid' && status === 'cancelled') {
          for (const item of order.items) {
            const productId = item.productId;
            if (!productId) continue;
            
            const product = await Product.findById(productId);
            if (product) {
              product.amountInStock = (product.amountInStock || 0) + item.qty;
              product.inStock = true; // Restore inStock status
              await product.save();
            }
          }
        }
        
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

// POST /api/orders/:id/mark-paid - Mark order as paid and deduct stock
// This endpoint:
// 1. Finds the product by productId
// 2. Checks the product category
// 3. Checks the current quantity/stock
// 4. Subtracts the ordered quantity
// 5. Updates the database
router.post('/:id/mark-paid', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log(`🔍 Processing mark-paid for order ${order.ref}, current status: ${order.status}`);

    // Check if order is already paid
    if (order.status === 'paid') {
      return res.status(400).json({
        ok: false,
        error: 'Order already paid',
        message: `Order ${order.ref} has already been marked as paid. Stock was already deducted when it was first marked as paid.`,
        order
      });
    }

    // Check if order is cancelled
    if (order.status === 'cancelled') {
      return res.status(400).json({
        ok: false,
        error: 'Cannot mark cancelled order as paid',
        message: `Order ${order.ref} has been cancelled and cannot be marked as paid.`,
        order
      });
    }

    // Only process if order is pending
    if (order.status === 'pending') {
      console.log(`📦 Order ${order.ref} is pending, processing ${order.items.length} items`);
      
      const stockUpdates = [];
      const stockErrors = [];
      
      // Process each item in the order
      for (const item of order.items) {
        const productId = item.productId;
        const orderedQty = item.qty;
        
        // Step 1: Validate productId exists
        if (!productId) {
          const error = `Item "${item.title}" has no productId`;
          console.warn(`⚠️ Order ${order.ref}: ${error}`);
          stockErrors.push(error);
          continue;
        }
        
        console.log(`\n📋 Processing item: ${item.title}`);
        console.log(`   Product ID: ${productId}`);
        console.log(`   Ordered Quantity: ${orderedQty}`);
        
        // Step 2: Find product by productId
        const product = await Product.findById(productId);
        if (!product) {
          const error = `Product not found with ID: ${productId} for item "${item.title}"`;
          console.error(`❌ Order ${order.ref}: ${error}`);
          stockErrors.push(error);
          continue;
        }
        
        console.log(`✅ Product found: ${product.name}`);
        
        // Step 3: Check product category
        const category = product.category;
        console.log(`   Category: ${category}`);
        
        if (!category || !['frames', 'lenses', 'eyedrop', 'accessories'].includes(category)) {
          const error = `Invalid category "${category}" for product ${product.name}`;
          console.error(`❌ Order ${order.ref}: ${error}`);
          stockErrors.push(error);
          continue;
        }
        
        // Step 4: Check current quantity/stock
        const currentStock = product.amountInStock || 0;
        const isInStock = product.inStock !== false;
        
        console.log(`   Current Stock: ${currentStock}`);
        console.log(`   In Stock Status: ${isInStock}`);
        
        // Step 5: Validate sufficient stock
        if (!isInStock || currentStock < orderedQty) {
          const error = `${product.name} (${category}) - Only ${currentStock} available, ordered ${orderedQty}`;
          console.error(`❌ Order ${order.ref}: ${error}`);
          stockErrors.push(error);
          continue;
        }
        
        // Step 6: Calculate new stock quantity
        const newStock = Math.max(0, currentStock - orderedQty);
        const wasInStock = product.inStock;
        const willBeInStock = newStock > 0;
        
        console.log(`   Stock Calculation: ${currentStock} - ${orderedQty} = ${newStock}`);
        
        // Step 7: Update product stock
        product.amountInStock = newStock;
        product.inStock = willBeInStock;
        
        // Step 8: Save to database
        await product.save();
        
        // Step 9: Verify the update
        const verifyProduct = await Product.findById(productId);
        if (verifyProduct.amountInStock !== newStock) {
          const error = `Stock update verification failed for ${product.name}`;
          console.error(`❌ Order ${order.ref}: ${error}`);
          stockErrors.push(error);
          continue;
        }
        
        console.log(`✅ Successfully updated ${product.name}:`);
        console.log(`   Stock: ${currentStock} → ${newStock}`);
        console.log(`   In Stock: ${wasInStock} → ${willBeInStock}`);
        console.log(`   Category: ${category}`);
        
        stockUpdates.push({
          productId,
          productName: product.name,
          category,
          previousStock: currentStock,
          orderedQty,
          newStock,
        });
      }
      
      // If there are any errors, return them
      if (stockErrors.length > 0) {
        return res.status(400).json({ 
          ok: false,
          error: 'Stock update failed', 
          details: stockErrors,
          message: 'Cannot mark as paid - some items have insufficient stock',
          stockUpdates: stockUpdates.length > 0 ? stockUpdates : undefined
        });
      }
      
      console.log(`\n✅ All stock updates completed for order ${order.ref}`);
      console.log(`   Updated ${stockUpdates.length} products`);
      
      // Update order status to paid
      order.status = 'paid';
      await order.save();
      
      console.log(`✅ Order ${order.ref} marked as paid successfully`);
      
      res.json({ 
        ok: true, 
        order, 
        message: 'Order marked as paid and stock updated successfully',
        stockUpdated: true,
        stockUpdates: stockUpdates
      });
      
    } else {
      // This should not happen due to checks above, but handle it anyway
      console.log(`⚠️ Order ${order.ref} has unexpected status: ${order.status}`);
      
      return res.status(400).json({
        ok: false,
        error: 'Invalid order status',
        message: `Order ${order.ref} has status "${order.status}" and cannot be marked as paid. Only pending orders can be marked as paid.`,
        order
      });
    }
    
  } catch (error) {
    console.error('❌ Error marking order as paid:', error);
    res.status(500).json({ 
      ok: false,
      error: 'Failed to mark order as paid',
      message: error.message 
    });
  }
});

// DELETE /api/orders/:id - Delete order (Admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
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

