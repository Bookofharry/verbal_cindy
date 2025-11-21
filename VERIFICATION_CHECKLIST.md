# Quick Verification Checklist

## ✅ After Fixing VITE_API_URL

### 1. **Frontend Environment Variable**
- [x] `VITE_API_URL` = `https://verbal-cindy.vercel.app/api` (with `/api`)
- [x] Frontend redeployed after updating

### 2. **Backend Environment Variables**
- [ ] `MONGODB_URI` - Set
- [ ] `JWT_SECRET` - Set
- [ ] `ALLOWED_ORIGINS` - Should include `https://cindyclinc-app.vercel.app`
- [ ] Backend deployed with latest fixes

### 3. **Test the Connection**

#### Test 1: Health Check
Visit: `https://verbal-cindy.vercel.app/`
Should return: `{"status":"ok","message":"API is working",...}`

#### Test 2: Products Endpoint
Visit: `https://verbal-cindy.vercel.app/api/products`
Should return: Array of products or empty array `[]`

#### Test 3: Frontend
Visit: `https://cindyclinc-app.vercel.app`
- Should load without CORS errors
- Products should display
- No console errors about failed fetches

### 4. **Check Browser Console**

Open DevTools (F12) → Console:
- ✅ No CORS errors
- ✅ No "Failed to fetch" errors
- ✅ API calls should show: `https://verbal-cindy.vercel.app/api/products`

Open DevTools → Network tab:
- ✅ Requests to `/api/products` should return 200 OK
- ✅ OPTIONS preflight requests should return 204

## 🎯 Expected Behavior

### Before Fix:
- ❌ CORS errors in console
- ❌ "Failed to fetch" errors
- ❌ Products don't load
- ❌ Requests go to `/products` (missing `/api`)

### After Fix:
- ✅ No CORS errors
- ✅ Products load correctly
- ✅ Requests go to `/api/products` (correct)
- ✅ All API calls work

## 🚨 If Still Having Issues

### Check 1: Verify Environment Variable
1. Vercel Dashboard → Frontend Project
2. Settings → Environment Variables
3. Confirm `VITE_API_URL` = `https://verbal-cindy.vercel.app/api`
4. Check if it's set for Production environment

### Check 2: Verify Redeployment
1. Deployments tab
2. Latest deployment should be after you updated the env var
3. If not, manually redeploy

### Check 3: Clear Browser Cache
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear cache and reload

### Check 4: Check Network Tab
- Open DevTools → Network
- Look at the actual request URL
- Should be: `https://verbal-cindy.vercel.app/api/products`
- If it's `https://verbal-cindy.vercel.app/products`, the env var isn't applied

## 📝 Quick Test Commands

### Test Backend Directly:
```bash
curl https://verbal-cindy.vercel.app/
# Should return: {"status":"ok",...}

curl https://verbal-cindy.vercel.app/api/products
# Should return: [] or array of products
```

### Test CORS:
```bash
curl -H "Origin: https://cindyclinc-app.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://verbal-cindy.vercel.app/api/products
# Should return 204 with CORS headers
```

---

**Status:** Ready to test! 🚀
