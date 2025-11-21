# Admin Authentication Fix Guide

## 🔴 Problem
Admin gets "Unauthorized" error when creating products and gets logged out immediately.

## 🔍 Root Causes

### 1. **Missing JWT_SECRET in Vercel**
The most common cause is that `JWT_SECRET` is not set in Vercel environment variables, or it's different from the one used to sign the token.

### 2. **Token Expiration**
The token might have expired (default: 7 days).

### 3. **Token Format Issues**
The token might not be stored or sent correctly.

## ✅ Solution

### Step 1: Verify JWT_SECRET in Vercel

1. Go to **Vercel Dashboard** → Your Backend Project
2. **Settings** → **Environment Variables**
3. Check if `JWT_SECRET` exists
4. If missing or incorrect:
   - **Name:** `JWT_SECRET`
   - **Value:** A strong random string (at least 32 characters)
   - Example: `my-super-secret-jwt-key-min-32-characters-long-for-security`
5. **Redeploy** after adding/updating

### Step 2: Verify Token is Being Sent

1. Open browser **Developer Tools** (F12)
2. Go to **Network** tab
3. Try to create a product
4. Check the request to `/api/products`
5. Look for **Authorization** header:
   - Should be: `Authorization: Bearer eyJ...`
   - If missing, token isn't being sent

### Step 3: Check Token in localStorage

1. Open **Developer Tools** (F12)
2. Go to **Application** tab → **Local Storage**
3. Check for `adminToken`:
   - Should exist and be a long JWT string (starts with `eyJ`)
   - If missing or wrong format, login again

### Step 4: Verify Backend Logs

1. Go to **Vercel Dashboard** → Your Backend Project
2. **Functions** → Click on a function → **View Logs**
3. Look for JWT-related errors:
   - `JWT_SECRET is not set`
   - `Token verification failed`
   - `TokenExpiredError`
   - `JsonWebTokenError`

## 🔧 Quick Fixes

### Fix 1: Re-login
1. Logout from admin panel
2. Clear browser localStorage (or use incognito)
3. Login again with correct credentials
4. This generates a new token with current JWT_SECRET

### Fix 2: Set JWT_SECRET in Vercel
```env
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
```
**Important:** Must be the same value used to sign tokens!

### Fix 3: Check Environment Variables Match
- Backend `.env` file (local)
- Vercel Environment Variables (production)
- They should match!

## 🧪 Testing

### Test 1: Check Token Format
```javascript
// In browser console
const token = localStorage.getItem('adminToken');
console.log('Token:', token);
console.log('Is JWT?', token && token.startsWith('eyJ'));
console.log('Length:', token?.length);
```

### Test 2: Test API Call Manually
```javascript
// In browser console
const token = localStorage.getItem('adminToken');
fetch('https://your-backend.vercel.app/api/products', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### Test 3: Verify JWT_SECRET
Check Vercel logs for:
```
🔐 JWT Config loaded: Secret length=XX, Expires in=7d
```
If you see a warning about JWT_SECRET, it's not set correctly.

## 📋 Checklist

- [ ] `JWT_SECRET` is set in Vercel environment variables
- [ ] `JWT_SECRET` is at least 32 characters long
- [ ] Backend has been redeployed after setting JWT_SECRET
- [ ] Token exists in localStorage (check Application tab)
- [ ] Token is a valid JWT (starts with `eyJ`)
- [ ] Authorization header is sent in requests (check Network tab)
- [ ] No JWT errors in Vercel function logs
- [ ] Admin can login successfully
- [ ] Token hasn't expired (default: 7 days)

## 🚨 Common Issues

### Issue: "Token verification failed"
**Cause:** JWT_SECRET mismatch
**Fix:** Set correct JWT_SECRET in Vercel and re-login

### Issue: "Token expired"
**Cause:** Token older than 7 days (or custom expiry)
**Fix:** Re-login to get new token

### Issue: "No token provided"
**Cause:** Token not being sent in request
**Fix:** Check if token exists in localStorage, check Network tab

### Issue: "Admin not found"
**Cause:** Admin account deleted or doesn't exist
**Fix:** Create admin account using `node scripts/createAdmin.js`

## 💡 Prevention

1. **Always set JWT_SECRET** before first deployment
2. **Use same JWT_SECRET** in all environments (or use different secrets per env)
3. **Monitor token expiration** - implement token refresh if needed
4. **Set strong JWT_SECRET** - use a random string generator

---

**After fixing, test:**
1. Login to admin panel
2. Try to create a product
3. Should work without "Unauthorized" error

