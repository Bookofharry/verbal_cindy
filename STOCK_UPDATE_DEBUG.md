# Stock Update Debugging Guide

## What Should Happen

1. **Order Creation**: When a user creates an order, stock is checked but NOT deducted
2. **Mark as Paid**: When admin marks order as paid, stock IS deducted
3. **Real-time Refresh**: Product pages auto-refresh every 10 seconds to show updated stock

## Debugging Steps

### 1. Check Backend Logs

When you mark an order as paid, you should see logs like:
```
🔍 Processing mark-paid for order ABC123, current status: pending
📦 Order ABC123 is pending, will deduct stock for 2 items
🔍 Looking up product with ID: 507f1f77bcf86cd799439011 (type: string)
✅ Found product: Ray-Ban Aviator (current stock: 10)
✅ Order ABC123: Deducted 2 from Ray-Ban Aviator (10 → 8)
✅ Verified: Ray-Ban Aviator now has 8 in stock
✅ Order ABC123 marked as paid successfully
```

### 2. Check Frontend Console

On product pages, you should see:
```
[Frames] Silent refresh: 15 products loaded
[Lenses] Silent refresh: 12 products loaded
```

### 3. Verify Product ID Format

- Product IDs from MongoDB are ObjectIds (24-character hex strings)
- Cart stores them as `item.id`
- Orders store them as `item.productId`
- Make sure they match!

### 4. Test the Flow

1. Create an order with a product (note the product ID)
2. Check MongoDB - product stock should NOT change yet
3. Mark order as paid in admin
4. Check backend logs - should show stock deduction
5. Check MongoDB - product stock SHOULD be reduced
6. Wait 10 seconds or refresh product page - should show new stock

## Common Issues

### Issue: Stock not deducting
- Check if order status is actually "pending" before marking paid
- Check if productId exists in order items
- Check if productId matches MongoDB ObjectId format
- Check backend logs for errors

### Issue: Stock not updating on frontend
- Check browser console for API errors
- Check if refresh interval is running (should see logs every 10s)
- Check if cache-busting timestamp is working
- Try manual page refresh

### Issue: Product not found
- Verify productId is stored correctly in order
- Check if product still exists in database
- Verify ObjectId format is correct

## Manual Test

1. Open browser console on a product page (e.g., /shop/frames)
2. Mark an order as paid in admin
3. Watch console - should see refresh logs every 10 seconds
4. Check if product stock numbers change

## Next Steps if Still Not Working

1. Check MongoDB directly to verify stock is actually being updated
2. Check network tab to see if API calls are successful
3. Check if productId in order matches product _id in database
4. Verify the refresh interval is actually running (check console logs)

