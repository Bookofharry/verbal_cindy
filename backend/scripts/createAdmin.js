// Script to create initial admin user
// Run: node scripts/createAdmin.js

import dotenv from 'dotenv';

import connectDB from '../config/database.js';
import Admin from '../models/Admin.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();
    
    const email = process.env.ADMIN_EMAIL || 'admin@dcindy.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const name = process.env.ADMIN_NAME || 'Admin';
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log('Admin already exists with email:', email);
      console.log('To reset password, delete the admin first or update manually.');
      process.exit(0);
    }
    
    // Create new admin (password will be hashed automatically)
    const admin = new Admin({
      email,
      password, // Will be hashed by pre-save hook
      name,
      role: 'admin',
      isActive: true,
    });
    
    await admin.save();
    
    console.log('✅ Admin created successfully!');
    console.log('Email:', email);
    console.log('Name:', name);
    // console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();

