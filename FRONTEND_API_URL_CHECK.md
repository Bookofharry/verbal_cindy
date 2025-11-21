# Frontend API URL Configuration Check

## 🔴 The Problem

The error shows the frontend is calling:
```
https://verbal-cindy.vercel.app/products?category=frames&_t=...
```

But it should be calling:
```
https://verbal-cindy.vercel.app/api/products?category=frames&_t=...
```

**Missing `/api` prefix!**

## ✅ The Fix

### Step 1: Check Vercel Frontend Environment Variable

1. Go to **Vercel Dashboard** → **Frontend Project** (`cindyclinc-app`)
2. **Settings** → **Environment Variables**
3. Find `VITE_API_URL`
4. **Current (WRONG):** `https://verbal-cindy.vercel.app`
5. **Should be:** `https://verbal-cindy.vercel.app/api`

### Step 2: Update the Variable

- **Name:** `VITE_API_URL`
- **Value:** `https://verbal-cindy.vercel.app/api` (must include `/api`)

### Step 3: Redeploy Frontend

**Important:** Environment variables only apply after redeployment!

1. After updating `VITE_API_URL`
2. Go to **Deployments** tab
3. Click **⋯** (three dots) on latest deployment
4. Click **Redeploy**

## 🔍 How to Verify

### Check the Actual URL Being Called

1. Open browser **Developer Tools** (F12)
2. Go to **Network** tab
3. Look for the failed request to `/products`
4. The full URL should be: `https://verbal-cindy.vercel.app/api/products`
5. If it shows `https://verbal-cindy.vercel.app/products` (without `/api`), the env var is wrong

### Check Frontend Code

The frontend code does:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Then constructs URLs like:
const url = `${API_BASE_URL}${endpoint}`;
// endpoint = "/products"
// If VITE_API_URL = "https://verbal-cindy.vercel.app"
// Result: "https://verbal-cindy.vercel.app/products" ❌

// If VITE_API_URL = "https://verbal-cindy.vercel.app/api"
// Result: "https://verbal-cindy.vercel.app/api/products" ✅
```

## 📋 Correct Configuration

### Frontend Vercel Environment Variables:
```env
VITE_API_URL=https://verbal-cindy.vercel.app/api
```

**Note:** Must end with `/api` because:
- Backend routes are mounted at `/api/*`
- Frontend endpoints start with `/products`, `/orders`, etc.
- So: `API_BASE_URL` + `/products` = `/api/products`

## 🎯 Quick Test

After fixing and redeploying:

1. Open frontend: `https://cindyclinc-app.vercel.app`
2. Open DevTools → Network tab
3. Try to load products
4. Check the request URL - should include `/api`
5. Should not see CORS errors

## 🚨 Common Mistakes

1. **Forgetting `/api` suffix:**
   - ❌ `VITE_API_URL=https://verbal-cindy.vercel.app`
   - ✅ `VITE_API_URL=https://verbal-cindy.vercel.app/api`

2. **Double `/api`:**
   - ❌ `VITE_API_URL=https://verbal-cindy.vercel.app/api/api`
   - ✅ `VITE_API_URL=https://verbal-cindy.vercel.app/api`

3. **Trailing slash:**
   - ⚠️ `VITE_API_URL=https://verbal-cindy.vercel.app/api/` (might work but not ideal)
   - ✅ `VITE_API_URL=https://verbal-cindy.vercel.app/api` (no trailing slash)

---

**Action Required:** Update `VITE_API_URL` in Vercel frontend to include `/api` and redeploy.

