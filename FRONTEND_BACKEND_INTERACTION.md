# Frontend-Backend Interaction Flow

## Overview
This document explains how the frontend (Admin UI) interacts with the backend API when marking an order as paid and updating stock.

## Complete Flow Diagram

```
┌─────────────────┐
│  Admin UI       │
│  (Orders Page)  │
└────────┬────────┘
         │
         │ 1. User clicks "Mark as Paid" button
         │
         ▼
┌─────────────────────────────────────┐
│  handleMarkPaid(orderId)            │
│  - Calls orderAPI.markPaid(orderId) │
└────────┬────────────────────────────┘
         │
         │ 2. HTTP POST Request
         │    POST /api/orders/:id/mark-paid
         │
         ▼
┌─────────────────────────────────────┐
│  Backend API                        │
│  POST /api/orders/:id/mark-paid    │
│                                     │
│  Steps:                             │
│  1. Find order by ID                │
│  2. Check if status is 'pending'   │
│  3. For each item:                  │
│     - Find product by productId    │
│     - Check category                │
│     - Check current stock           │
│     - Validate sufficient stock     │
│     - Calculate new stock           │
│     - Update product in database   │
│     - Verify update                 │
│  4. Update order status to 'paid'  │
│  5. Return response with details   │
└────────┬────────────────────────────┘
         │
         │ 3. JSON Response
         │    {
         │      ok: true,
         │      order: {...},
         │      stockUpdated: true,
         │      stockUpdates: [...]
         │    }
         │
         ▼
┌─────────────────────────────────────┐
│  Frontend receives response         │
│  - Updates order in state           │
│  - Shows stock update notification  │
│  - Displays success message         │
└─────────────────────────────────────┘
         │
         │ 4. Product pages auto-refresh
         │    (every 10 seconds)
         │
         ▼
┌─────────────────────────────────────┐
│  Product Pages                      │
│  (Frames, Lenses, etc.)             │
│  - Fetch fresh product data         │
│  - Display updated stock            │
└─────────────────────────────────────┘
```

## Step-by-Step Code Flow

### 1. Frontend: User Action
**File:** `frontend/src/AdminUi/Orders.jsx`

```jsx
// User clicks "Mark as Paid" button
<button onClick={() => handleMarkPaid(order._id || order.id)}>
  Mark as Paid
</button>
```

### 2. Frontend: API Call
**File:** `frontend/src/AdminUi/Orders.jsx`

```jsx
const handleMarkPaid = async (orderId) => {
  // Calls the API service
  const response = await orderAPI.markPaid(orderId);
  // ... handle response
};
```

### 3. Frontend: API Service
**File:** `frontend/src/services/api.js`

```javascript
export const orderAPI = {
  markPaid: async (id) => {
    // Makes HTTP POST request to backend
    return apiCall(`/orders/${id}/mark-paid`, {
      method: 'POST',
    });
  },
};
```

**What happens:**
- Constructs URL: `http://localhost:4000/api/orders/:id/mark-paid`
- Sends POST request with order ID
- Includes authentication token (if needed)
- Waits for response

### 4. Backend: API Endpoint
**File:** `backend/routes/orderRoutes.js`

```javascript
router.post('/:id/mark-paid', async (req, res) => {
  // 1. Find order
  const order = await Order.findById(req.params.id);
  
  // 2. Process each item
  for (const item of order.items) {
    // 3. Find product by productId
    const product = await Product.findById(item.productId);
    
    // 4. Check category
    const category = product.category;
    
    // 5. Check current stock
    const currentStock = product.amountInStock;
    
    // 6. Calculate new stock
    const newStock = currentStock - item.qty;
    
    // 7. Update product
    product.amountInStock = newStock;
    await product.save();
  }
  
  // 8. Update order status
  order.status = 'paid';
  await order.save();
  
  // 9. Return response
  res.json({ 
    ok: true, 
    order, 
    stockUpdated: true,
    stockUpdates: [...]
  });
});
```

### 5. Backend: Database Updates

**MongoDB Operations:**
1. **Find Order:** `Order.findById(orderId)`
2. **Find Products:** `Product.findById(productId)` for each item
3. **Update Products:** `product.save()` - updates `amountInStock` and `inStock`
4. **Update Order:** `order.save()` - changes status from 'pending' to 'paid'

### 6. Frontend: Response Handling
**File:** `frontend/src/AdminUi/Orders.jsx`

```jsx
if (response.ok && response.order) {
  // Update order in the list
  setOrders(orders.map(order => 
    order._id === orderId ? response.order : order
  ));
  
  // Show stock update details
  if (response.stockUpdated && response.stockUpdates) {
    setStockUpdateDetails({
      orderRef: response.order.ref,
      updates: response.stockUpdates
    });
  }
  
  // Show success message
  alert('Order marked as paid! Stock updated.');
}
```

### 7. Frontend: UI Updates

**What the user sees:**
1. **Order Status Changes:** Order badge changes from "Pending" to "Paid"
2. **Stock Update Notification:** Green notification box appears showing:
   - Order reference
   - Each product updated
   - Category, previous stock, new stock, quantity ordered
3. **Success Alert:** Browser alert confirms the action

### 8. Frontend: Real-time Stock Updates
**Files:** `frontend/src/Ui/Frames.jsx`, `Lenses.jsx`, `Eyedrop.jsx`, `Accessories.jsx`

```jsx
useEffect(() => {
  fetchFrames(true); // Initial load
  
  // Auto-refresh every 10 seconds
  const interval = setInterval(() => {
    fetchFrames(false); // Silent refresh
  }, 10000);
  
  return () => clearInterval(interval);
}, []);
```

**What happens:**
- Product pages automatically fetch fresh data every 10 seconds
- Stock numbers update without page refresh
- Users see current stock levels in real-time

## API Request/Response Example

### Request
```http
POST /api/orders/507f1f77bcf86cd799439011/mark-paid
Content-Type: application/json
```

### Response (Success)
```json
{
  "ok": true,
  "order": {
    "_id": "507f1f77bcf86cd799439011",
    "ref": "ORD-2024-001",
    "status": "paid",
    "items": [
      {
        "productId": "507f191e810c19729de860ea",
        "title": "Ray-Ban Aviator",
        "qty": 2,
        "price": 15000
      }
    ],
    "customer": { ... },
    "total": 30000
  },
  "message": "Order marked as paid and stock updated successfully",
  "stockUpdated": true,
  "stockUpdates": [
    {
      "productId": "507f191e810c19729de860ea",
      "productName": "Ray-Ban Aviator",
      "category": "frames",
      "previousStock": 10,
      "orderedQty": 2,
      "newStock": 8
    }
  ]
}
```

### Response (Error)
```json
{
  "ok": false,
  "error": "Stock update failed",
  "details": [
    "Ray-Ban Aviator (frames) - Only 1 available, ordered 2"
  ],
  "message": "Cannot mark as paid - some items have insufficient stock"
}
```

## Key Points

1. **Synchronous Flow:** The frontend waits for the backend to complete all operations before updating the UI
2. **Error Handling:** If stock is insufficient, the order is NOT marked as paid, and an error is returned
3. **Database Consistency:** All stock updates happen in the same transaction
4. **Real-time Updates:** Product pages refresh automatically to show updated stock
5. **User Feedback:** Admin sees detailed information about what stock was updated

## Testing the Flow

1. **Create an order** with products
2. **Check product stock** in database (should be unchanged)
3. **Mark order as paid** in admin UI
4. **Check backend logs** - should show stock deduction steps
5. **Check database** - product stock should be reduced
6. **Check product pages** - should show updated stock within 10 seconds
7. **Check admin UI** - should show stock update notification

