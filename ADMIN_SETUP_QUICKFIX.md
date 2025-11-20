# Admin Login Loop - Quick Fix Guide

## Problem
After login, you're redirected back to the login page. This usually means:
1. Admin user doesn't exist in database
2. JWT_SECRET mismatch
3. Token verification failing

## Solution Steps

### Step 1: Create Admin User

```bash
cd backend
node scripts/createAdmin.js
```

**Expected output:**
```
✅ Admin created successfully!
Email: admin@dcindy.com
Name: Admin
```

### Step 2: Check Backend .env File

Make sure `backend/.env` has:
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-min-32-chars
MONGODB_URI=your_mongodb_connection_string
```

### Step 3: Restart Backend

```bash
cd backend
npm start
```

### Step 4: Clear Browser Storage

Open browser console (F12) and run:
```javascript
localStorage.clear()
```

### Step 5: Login Again

1. Go to `/00admin/login`
2. Use credentials from your `.env`:
   - Email: `admin@dcindy.com` (or your ADMIN_EMAIL)
   - Password: `admin123` (or your ADMIN_PASSWORD)

### Step 6: Check Browser Console

After login, check the console for:
- `Login response:` - Should show `{ok: true, token: "eyJ..."}`
- `Token stored:` - Should show first 20 chars of token
- Any error messages

### Step 7: Check Backend Console

Look for:
- `Login error:` - Any errors during login
- `JWT verification error:` - Any errors during token verification

## Common Issues

### Issue 1: "Admin already exists"
**Solution:** The admin exists but password might be wrong. Delete and recreate:
```javascript
// In MongoDB or use mongoose
db.admins.deleteOne({ email: "admin@dcindy.com" })
```
Then run `node scripts/createAdmin.js` again.

### Issue 2: "Cannot connect to server"
**Solution:** Make sure backend is running on port 4000 (or your PORT)

### Issue 3: "Invalid token" after login
**Solution:** 
1. Check JWT_SECRET matches in `.env`
2. Make sure backend was restarted after setting JWT_SECRET
3. Clear localStorage and try again

### Issue 4: Token verification fails
**Solution:**
1. Check backend console for specific error
2. Verify admin exists: `db.admins.find({ email: "admin@dcindy.com" })`
3. Check JWT_SECRET is set correctly

## Debug Mode

To see what's happening, check:

**Frontend Console (F12):**
- Login response
- Token storage
- Verification errors

**Backend Console:**
- Login attempts
- Token generation
- Verification errors

## Still Not Working?

1. **Check MongoDB connection:**
   ```bash
   # In backend console, should see:
   MongoDB connected successfully
   ```

2. **Verify admin exists:**
   - Connect to MongoDB
   - Check `admins` collection
   - Should see your admin user

3. **Test login endpoint directly:**
   ```bash
   curl -X POST http://localhost:4000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@dcindy.com","password":"admin123"}'
   ```

4. **Check token format:**
   - Token should start with `eyJ`
   - Should be a long string (200+ characters)

## Success Indicators

✅ Login shows success message  
✅ Token stored in localStorage (check Application tab)  
✅ Redirects to dashboard  
✅ Dashboard loads without redirecting back  
✅ Can access appointments, orders, products

