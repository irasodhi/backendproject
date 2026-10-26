require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ── Route Imports ────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const reportRoutes       = require('./routes/reports');
const claimRoutes        = require('./routes/claims');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500',
           'http://127.0.0.1:3000', 'null'],   // allow file:// via VS Code Live Server / direct open
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));          // large limit for base64 images
app.use(express.urlencoded({ extended: true }));

const path = require('path');

// ── Static Files & Frontend Serving ──────────────────────────────────
app.use(express.static(path.join(__dirname, '..'), { maxAge: '1h' }));

// ── Health Check / Root Page ─────────────────────────────────────────
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.sendFile(path.join(__dirname, '..', 'index.html'));
  }
  res.json({
    success: true,
    message: '🎓 CampusFind API is running!',
    version: '1.0.0',
    endpoints: {
      auth:    '/api/auth   (signup, login, me, profile)',
      reports: '/api/reports',
      claims:  '/api/claims',
    },
  });
});

// ── API Routes ────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/claims',  claimRoutes);

// ── 404 Handler ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global Error Handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[UNHANDLED ERROR]', err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// ── MongoDB Connection & Server Start ────────────────────────────────
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB Atlas connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('   → Make sure MONGO_URI in .env is set correctly.');
    process.exit(1);
  }
};

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 CampusFind server running on http://localhost:${PORT}`);
    console.log(`📋 API docs available at http://localhost:${PORT}/`);
  });
});
