# Vercel Deployment Fix Guide

## 🔧 Changes Made to Fix "Internal Server Error"

### 1. **Updated `vercel.json`**
- Removed deprecated `env` section
- Fixed route destination path

### 2. **Fixed Database Connection for Serverless**
- Added retry logic for serverless functions
- Database connects on first request (not at module load)
- Better error handling that doesn't crash the function

### 3. **Improved CORS Configuration**
- Temporarily allows all origins if `ALLOWED_ORIGINS` not set (for initial setup)
- Better error messages for debugging
- Trims whitespace from origin URLs

### 4. **Added Error Handling Middleware**
- Catches and handles errors gracefully
- Returns proper error responses
- Logs errors for debugging

## 📋 Required Environment Variables in Vercel

Make sure these are set in your Vercel project settings:

### **Critical (Required)**
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - At least 32 characters, strong random string

### **Important (Recommended)**
- `ALLOWED_ORIGINS` - Comma-separated list of frontend URLs (e.g., `https://your-frontend.vercel.app,https://www.yourdomain.com`)
- `FRONTEND_URL` - Primary frontend URL
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

### **Optional**
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)
- `NODE_ENV` - Set to `production` (auto-set by Vercel)

## 🚀 Deployment Steps

1. **Commit and Push Changes**
   ```bash
   git add .
   git commit -m "Fix Vercel serverless deployment"
   git push
   ```

2. **Set Environment Variables in Vercel**
   - Go to your Vercel project dashboard
   - Settings → Environment Variables
   - Add all required variables
   - **Important:** Redeploy after adding variables

3. **Redeploy**
   - Vercel will auto-deploy on push
   - Or manually trigger a redeploy in the dashboard

4. **Test the API**
   - Visit: `https://your-backend.vercel.app/`
   - Should see: `{"status":"ok","message":"API is working",...}`
   - Test an endpoint: `https://your-backend.vercel.app/api/products`

## 🔍 Troubleshooting

### Still Getting "Internal Server Error"?

1. **Check Vercel Function Logs**
   - Go to Vercel Dashboard → Your Project → Functions
   - Click on a function to see logs
   - Look for error messages

2. **Verify Environment Variables**
   - Make sure `MONGODB_URI` is set correctly
   - Check for typos in variable names
   - Ensure no extra spaces or quotes

3. **Test Database Connection**
   - Verify MongoDB URI is correct
   - Check if MongoDB Atlas allows connections from Vercel IPs (or use 0.0.0.0/0 for all IPs)

4. **Check CORS Issues**
   - If you see CORS errors, set `ALLOWED_ORIGINS` in Vercel
   - Include your frontend URL in the list

5. **Common Issues**
   - **Missing MONGODB_URI**: Will show database connection error
   - **Wrong MongoDB URI format**: Check connection string format
   - **MongoDB IP whitelist**: Add Vercel IPs or use 0.0.0.0/0
   - **CORS blocking**: Set ALLOWED_ORIGINS environment variable

## 📝 Example Environment Variables

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dcindy_eyecare?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://www.yourdomain.com
FRONTEND_URL=https://your-frontend.vercel.app
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

## ✅ Verification Checklist

After deployment, verify:

- [ ] Root endpoint works: `https://your-backend.vercel.app/`
- [ ] Health check returns: `{"status":"ok",...}`
- [ ] Products endpoint works: `https://your-backend.vercel.app/api/products`
- [ ] No errors in Vercel function logs
- [ ] Database connection successful (check logs)
- [ ] CORS allows your frontend URL

## 🎯 Next Steps

1. Once backend is working, update frontend `VITE_API_URL` to point to your Vercel backend
2. Deploy frontend to Vercel
3. Set `ALLOWED_ORIGINS` to include your frontend URL
4. Test full flow: Frontend → Backend → Database

---

**Note:** The temporary CORS "allow all" is for initial setup only. Once working, set `ALLOWED_ORIGINS` for security.

