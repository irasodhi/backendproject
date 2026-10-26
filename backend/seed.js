require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Report = require('./models/Report');

const demoUsers = [
  {
    username: 'Ira Sodhi',
    useremail: 'ira.sodhi@campus.edu',
    userpassword: 'password123',
    contactPhone: '+91 98765 43210',
    role: 'user',
  },
  {
    username: 'Campus Finder',
    useremail: 'finder1@campus.edu',
    userpassword: 'password123',
    contactPhone: '+91 98123 45678',
    role: 'user',
  },
  {
    username: 'Campus Admin',
    useremail: 'admin@campusfind.edu',
    userpassword: 'adminpassword123',
    contactPhone: '+91 99999 00000',
    role: 'admin',
  },
];

const demoReports = [
  {
    type: 'lost',
    itemName: 'Black Nike Backpack',
    category: 'Bags',
    color: 'Black',
    zone: 'Library',
    date: '2026-08-11',
    description: 'Black Nike backpack with laptop compartment and red zipper puller. Left near silent study zone.',
    hiddenDetails: 'Contains a Dell XPS charger and blue notebook with initials IS.',
    postedBy: 'Ira Sodhi',
    postedByEmail: 'ira.sodhi@campus.edu',
    contactPhone: '+91 98765 43210',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
    status: 'Searching',
  },
  {
    type: 'found',
    itemName: 'Black Nike Backpack',
    category: 'Bags',
    color: 'Black',
    zone: 'Library',
    date: '2026-08-12',
    description: 'Found black Nike bag near second floor study tables in Library with red accent zippers.',
    hiddenDetails: 'Contains a Dell XPS charger inside.',
    postedBy: 'Campus Finder',
    postedByEmail: 'finder1@campus.edu',
    contactPhone: '+91 98123 45678',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
    status: 'Searching',
  },
  {
    type: 'lost',
    itemName: 'Apple iPhone 14 Pro',
    category: 'Electronics',
    color: 'Black',
    zone: 'Cafeteria',
    date: '2026-08-10',
    description: 'Space black iPhone 14 Pro with a clear transparent magsafe protective case.',
    hiddenDetails: 'Lockscreen wallpaper is a golden retriever dog sitting on grass.',
    postedBy: 'Ira Sodhi',
    postedByEmail: 'ira.sodhi@campus.edu',
    contactPhone: '+91 98765 43210',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80',
    status: 'Searching',
  },
  {
    type: 'found',
    itemName: 'Black Smartphone in Clear Case',
    category: 'Electronics',
    color: 'Black',
    zone: 'Main Block',
    date: '2026-08-11',
    description: 'Found an iPhone on a dining table near cafeteria entry in Main Block. Screen turns on.',
    hiddenDetails: 'Golden retriever lockscreen wallpaper.',
    postedBy: 'Campus Finder',
    postedByEmail: 'finder1@campus.edu',
    contactPhone: '+91 98123 45678',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80',
    status: 'Searching',
  },
];

async function seedDatabase() {
  if (!process.env.MONGO_URI || process.env.MONGO_URI.includes('your_mongodb_atlas')) {
    console.error('❌ Please set a valid MONGO_URI in backend/.env before running the seed script.');
    process.exit(1);
  }

  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas!');

    console.log('🧹 Clearing old demo data...');
    await User.deleteMany({});
    await Report.deleteMany({});

    console.log('🌱 Seeding demo users...');
    for (const u of demoUsers) {
      await User.create(u);
    }
    console.log(`   Added ${demoUsers.length} users.`);

    console.log('🌱 Seeding demo reports...');
    for (const r of demoReports) {
      await Report.create(r);
    }
    console.log(`   Added ${demoReports.length} reports.`);

    console.log('🎉 Database seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seedDatabase();
