const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kashiffareed2023_db_user:DMVRAAD9Z8avhKbn@main.82yfwpj.mongodb.net/hplc-reports?retryWrites=true&w=majority';

// User Schema (simplified for setup)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'analyst', 'viewer'], default: 'analyst' },
  department: String,
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date
});

const User = mongoose.model('User', UserSchema);

async function setupAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create default admin user
    const adminPassword = await bcrypt.hash('admin123', 12);

    const adminUser = new User({
      email: 'admin@hplc.com',
      password: adminPassword,
      name: 'System Administrator',
      role: 'admin',
      department: 'IT'
    });

    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@hplc.com');
    console.log('Password: admin123');
    console.log('⚠️  Please change the default password after first login');

    // Create sample analyst user
    const analystPassword = await bcrypt.hash('analyst123', 12);

    const analystUser = new User({
      email: 'analyst@hplc.com',
      password: analystPassword,
      name: 'Sample Analyst',
      role: 'analyst',
      department: 'Lab'
    });

    await analystUser.save();

    console.log('✅ Sample analyst user created!');
    console.log('Email: analyst@hplc.com');
    console.log('Password: analyst123');

  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the setup
setupAdmin();