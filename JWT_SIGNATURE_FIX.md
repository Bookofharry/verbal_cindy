# JWT Signature Error Fix

## Problem
**Error:** `JsonWebTokenError invalid signature`

This means the JWT_SECRET used to **sign** the token (during login) is different from the JWT_SECRET used to **verify** it (during token check).

## Root Cause
The token was created with one JWT_SECRET, but when verifying, a different JWT_SECRET is being used. This happens when:
1. JWT_SECRET is not set in `.env` (using default/fallback)
2. Backend was restarted and JWT_SECRET changed
3. Multiple backend instances with different secrets

## Solution

### Step 1: Set JWT_SECRET in backend/.env

Open `backend/.env` and add:
```env
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-for-security
```

**Important:** 
- Use a strong, random string (at least 32 characters)
- Don't use the default "your-secret-key-change-in-production"
- Keep it secret and don't commit it to git

### Step 2: Restart Backend

```bash
cd backend
# Stop the current server (Ctrl+C)
npm start
```

You should see:
```
🔐 JWT Config loaded: Secret length=XX, Expires in=7d
```

### Step 3: Clear Old Token

The old token was signed with a different secret, so it won't work. Clear it:

**Option A: Browser Console**
```javascript
localStorage.clear()
```

**Option B: Application Tab**
1. Open DevTools (F12)
2. Go to Application → Local Storage
3. Delete `adminToken`, `adminEmail`, `adminName`

### Step 4: Login Again

1. Go to `/00admin/login`
2. Login with your credentials
3. A new token will be created with the correct JWT_SECRET
4. This token will work because it's signed and verified with the same secret

## Verification

After fixing, check backend console when you login:
- Should see: `🔐 JWT Config loaded: Secret length=XX`
- Should see: `✅ Token decoded successfully`
- Should NOT see: `❌ JWT verification failed`

## Prevention

1. **Always set JWT_SECRET in .env** - Never rely on the fallback
2. **Don't change JWT_SECRET** - Once set, keep it the same
3. **Use same secret everywhere** - All backend instances must use the same secret
4. **Restart after changing** - If you change JWT_SECRET, all users must login again

## Quick Test

After setting JWT_SECRET and restarting:

1. Clear localStorage: `localStorage.clear()`
2. Login again
3. Check backend console - should see successful verification
4. Should stay logged in (no redirect loop)

