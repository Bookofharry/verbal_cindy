# Vercel 500 Error Fix Guide

## 🔴 Error
```
500: INTERNAL_SERVER_ERROR
Code: FUNCTION_INVOCATION_FAILED
```

This means the serverless function is crashing before it can respond.

## 🔍 Common Causes

### 1. **Missing Environment Variables** (Most Common)
The function crashes if required environment variables are missing:
- `MONGODB_URI` - Required
- `JWT_SECRET` - Required for admin authentication

### 2. **Database Connection Failure**
- Invalid MongoDB connection string
- MongoDB Atlas IP whitelist blocking Vercel
- Network timeout

### 3. **Import/Module Errors**
- Missing dependencies
- ES module syntax issues

## ✅ Step-by-Step Fix

### Step 1: Check Vercel Function Logs

1. Go to **Vercel Dashboard** → Your Backend Project
2. Click **Functions** tab
3. Click on a function (e.g., `server.js`)
4. Click **View Logs**
5. Look for error messages

**Common log messages:**
- `❌ Missing required environment variables: MONGODB_URI`
- `Error connecting to MongoDB: ...`
- `JWT_SECRET must be set in production!`

### Step 2: Set Required Environment Variables

Go to **Settings** → **Environment Variables** and add:

#### **Critical (Required)**
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dcindy_eyecare?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
```

#### **Important (Recommended)**
```env
ALLOWED_ORIGINS=https://cindyclinc-app.vercel.app
FRONTEND_URL=https://cindyclinc-app.vercel.app
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Step 3: Verify MongoDB Connection

1. **Check MongoDB URI Format:**
   - Should start with `mongodb+srv://` or `mongodb://`
   - Contains username, password, cluster address
   - Includes database name

2. **Check MongoDB Atlas IP Whitelist:**
   - Go to MongoDB Atlas → Network Access
   - Add `0.0.0.0/0` to allow all IPs (for testing)
   - Or add Vercel's IP ranges

3. **Test Connection:**
   - Try connecting from MongoDB Compass or CLI
   - Verify credentials are correct

### Step 4: Redeploy

**Important:** Environment variables only apply after redeployment!

1. After adding/updating environment variables
2. Go to **Deployments** tab
3. Click **⋯** (three dots) on latest deployment
4. Click **Redeploy**

### Step 5: Test

1. Visit: `https://your-backend.vercel.app/`
2. Should see: `{"status":"ok","message":"API is working",...}`
3. If still error, check logs again

## 🔧 Quick Diagnostic Commands

### Check Environment Variables in Vercel
1. Settings → Environment Variables
2. Verify all required variables are set
3. Check for typos in variable names

### Test MongoDB Connection
```bash
# Test locally first
cd backend
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(e => console.error(e))"
```

## 🐛 Debugging Steps

### 1. Check Function Logs
- Look for the exact error message
- Note which line/file is causing the crash
- Check for missing imports or syntax errors

### 2. Test Health Endpoint
```bash
curl https://your-backend.vercel.app/
```
Should return: `{"status":"ok",...}`

### 3. Test Database Connection
```bash
curl https://your-backend.vercel.app/api/products
```
- If database is connected: Returns products or empty array
- If database fails: Returns 503 error with message

### 4. Check Dependencies
Make sure `package.json` has all dependencies:
- express
- mongoose
- jsonwebtoken
- dotenv
- cors
- etc.

## 📋 Checklist

- [ ] `MONGODB_URI` is set in Vercel
- [ ] `JWT_SECRET` is set in Vercel
- [ ] MongoDB URI is correct format
- [ ] MongoDB Atlas allows connections (IP whitelist)
- [ ] Backend has been redeployed after setting variables
- [ ] Checked Vercel function logs for specific error
- [ ] All dependencies are in `package.json`
- [ ] No syntax errors in code

## 🚨 Common Error Messages

### "MONGODB_URI is not set"
**Fix:** Add `MONGODB_URI` in Vercel environment variables

### "JWT_SECRET must be set in production"
**Fix:** Add `JWT_SECRET` in Vercel environment variables

### "Database connection failed"
**Fix:** 
- Check MongoDB URI is correct
- Check MongoDB Atlas IP whitelist
- Verify network connectivity

### "Cannot find module"
**Fix:** 
- Check `package.json` has the dependency
- Redeploy to install dependencies

## 💡 Prevention

1. **Always set environment variables** before first deployment
2. **Test locally** with `.env` file first
3. **Check logs** immediately after deployment
4. **Use same variable names** in local and production

---

**After fixing, the function should:**
- Return 200 OK for health check
- Connect to database successfully
- Handle API requests without crashing

