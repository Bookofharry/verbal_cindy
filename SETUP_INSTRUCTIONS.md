# MongoDB & Cloudinary Setup Instructions

## Step 1: MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account or sign in
3. Create a new cluster (free tier is fine)
4. Create a database user:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Save the username and password
5. Whitelist your IP:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development) or add your IP
6. Get your connection string:
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with your database name (e.g., `dcindy_eyecare`)

## Step 2: Cloudinary Setup

1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for a free account
3. Go to your Dashboard
4. Copy the following from your dashboard:
   - **Cloud Name** (e.g., `dxxxxx`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

## Step 3: Configure Environment Variables

### Backend (.env file)

Create a file named `.env` in the `/backend` folder:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/dcindy_eyecare?retryWrites=true&w=majority

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Server Configuration
PORT=4000
NODE_ENV=development
```

**Replace:**
- `<username>` with your MongoDB username
- `<password>` with your MongoDB password
- `cluster0.xxxxx` with your actual cluster address
- `dcindy_eyecare` with your preferred database name
- `your_cloud_name`, `your_api_key`, `your_api_secret` with your Cloudinary credentials

### Frontend (.env file)

Create a file named `.env` in the `/frontend` folder:

```env
VITE_API_URL=http://localhost:4000/api
```

For production, change this to your backend URL.

## Step 4: Start the Application

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run dev
```

## Step 5: Test the Setup

1. The backend should connect to MongoDB (check console for "MongoDB Connected")
2. Visit the admin panel: `http://localhost:5173/00admin/login`
3. Login with: `admin@dcindy.com` / `admin123`
4. Go to Products and try adding a product with an image
5. The image should upload to Cloudinary
6. Visit the shop page to see products loaded from MongoDB

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products?category=frames` - Get products by category
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (with image upload)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

## Troubleshooting

### MongoDB Connection Issues
- Check your IP is whitelisted in MongoDB Atlas
- Verify username/password are correct
- Ensure the connection string format is correct

### Cloudinary Upload Issues
- Verify all three credentials (cloud name, API key, API secret) are correct
- Check that your Cloudinary account is active
- Ensure image file size is under 5MB

### API Not Working
- Ensure backend is running on port 4000
- Check frontend `.env` has correct `VITE_API_URL`
- Restart both frontend and backend after changing `.env` files

