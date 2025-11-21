import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary only if credentials are available
// This prevents crashes if Cloudinary env vars are missing
try {
  if (process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    console.log('✅ Cloudinary configured');
  } else {
    console.warn('⚠️  Cloudinary credentials not set - image uploads will fail');
  }
} catch (error) {
  console.error('❌ Cloudinary configuration error:', error.message);
  // Don't throw - allow app to continue without Cloudinary
}

export default cloudinary;

