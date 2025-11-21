# CORS Error Fix - Quick Instructions

## 🔴 Current Error
```
Access to fetch at 'https://verbal-cindy.vercel.app/api/products/search?q=frame' 
from origin 'https://cindyclinc-app.vercel.app' has been blocked by CORS policy
```

## ✅ Solution

You need to add your frontend URL to the backend's allowed origins.

### Step 1: Go to Vercel Backend Project
1. Open your Vercel dashboard
2. Go to your **backend project** (`verbal-cindy`)
3. Click **Settings** → **Environment Variables**

### Step 2: Add/Update Environment Variable

**Variable Name:** `ALLOWED_ORIGINS`

**Variable Value:** 
```
https://cindyclinc-app.vercel.app
```

**Or if you have multiple origins (comma-separated):**
```
https://cindyclinc-app.vercel.app,https://www.yourdomain.com
```

### Step 3: Redeploy
- After adding the environment variable, **redeploy** your backend
- Go to **Deployments** tab
- Click the **three dots** (⋯) on the latest deployment
- Click **Redeploy**

### Step 4: Verify
1. Wait for deployment to complete
2. Try your frontend again
3. The CORS error should be gone!

---

## 🔍 Alternative: Quick Test (Allow All Origins)

If you want to test quickly without setting the variable:

1. The code already allows all origins if `ALLOWED_ORIGINS` is not set
2. But you might need to **redeploy** for the changes to take effect
3. **Warning:** This is less secure - set `ALLOWED_ORIGINS` for production!

---

## 📝 Your URLs

- **Frontend:** `https://cindyclinc-app.vercel.app`
- **Backend:** `https://verbal-cindy.vercel.app`

Make sure `ALLOWED_ORIGINS` includes: `https://cindyclinc-app.vercel.app`

---

## 🎯 Quick Checklist

- [ ] Added `ALLOWED_ORIGINS` environment variable in Vercel backend
- [ ] Value includes: `https://cindyclinc-app.vercel.app`
- [ ] Redeployed backend after adding variable
- [ ] Tested frontend - CORS error should be gone

---

**Note:** Environment variables are only applied after redeployment!

