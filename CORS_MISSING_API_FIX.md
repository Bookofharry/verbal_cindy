# CORS Error - Missing /api in URL

## 🔴 The Problem

**Error:** `Access to fetch at 'https://verbal-cindy.vercel.app/products?...' has been blocked by CORS policy`

**Root Cause:** The frontend is calling:
```
https://verbal-cindy.vercel.app/products
```

But it should be calling:
```
https://verbal-cindy.vercel.app/api/products
```

**Notice:** Missing `/api` prefix!

## ✅ The Fix

### Option 1: Fix Vercel Environment Variable (Recommended)

1. Go to **Vercel Dashboard** → Your **Frontend Project** (`cindyclinc-app`)
2. **Settings** → **Environment Variables**
3. Find or add: `VITE_API_URL`
4. Set value to: `https://verbal-cindy.vercel.app/api`
   - **Important:** Must include `/api` at the end!
5. **Redeploy** frontend after updating

### Option 2: Check Current Value

The frontend code uses:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
```

If `VITE_API_URL` is set to `https://verbal-cindy.vercel.app` (without `/api`), that's the problem!

## 🔍 How to Verify

1. Check Vercel Frontend Environment Variables:
   - `VITE_API_URL` should be: `https://verbal-cindy.vercel.app/api`
   - NOT: `https://verbal-cindy.vercel.app`

2. Check Browser Console:
   - Look at the actual URL being called
   - Should include `/api` before the endpoint

3. Check Network Tab:
   - Open DevTools → Network
   - Look at the failed request
   - URL should be: `https://verbal-cindy.vercel.app/api/products`

## 📋 Correct Configuration

### Frontend Vercel Environment Variables:
```env
VITE_API_URL=https://verbal-cindy.vercel.app/api
```

### Backend Vercel Environment Variables:
```env
ALLOWED_ORIGINS=https://cindyclinc-app.vercel.app
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

## 🎯 Why This Happens

The frontend code constructs URLs like this:
```javascript
const url = `${API_BASE_URL}${endpoint}`;
// If API_BASE_URL = "https://verbal-cindy.vercel.app"
// And endpoint = "/products"
// Result: "https://verbal-cindy.vercel.app/products" ❌

// If API_BASE_URL = "https://verbal-cindy.vercel.app/api"
// And endpoint = "/products"
// Result: "https://verbal-cindy.vercel.app/api/products" ✅
```

## ✅ After Fixing

1. Update `VITE_API_URL` in Vercel frontend
2. Redeploy frontend
3. Test - CORS error should be gone
4. Products should load correctly

---

**Quick Fix:** Set `VITE_API_URL=https://verbal-cindy.vercel.app/api` in Vercel frontend environment variables and redeploy.

