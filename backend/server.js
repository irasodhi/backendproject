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
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));          // large limit for base64 images
app.use(express.urlencoded({ extended: true }));

const path = require('path');

// ── MongoDB Connection (Cached for Serverless) ───────────────────────
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.warn('⚠️ MONGO_URI is not set in environment variables.');
      return;
    }
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB Atlas connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
  }
};

// Ensure database is connected before handling any API request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

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

// ── API Routes (Supports both /api/* and rewritten /* routes) ────────
app.use('/api/auth',    authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/claims',  claimRoutes);

app.use('/auth',    authRoutes);
app.use('/reports', reportRoutes);
app.use('/claims',  claimRoutes);

// ── 404 Handler ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global Error Handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[UNHANDLED ERROR]', err.stack);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// ── Server Start (When run standalone locally) ───────────────────────
if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 CampusFind server running on http://localhost:${PORT}`);
      console.log(`📋 API docs available at http://localhost:${PORT}/`);
    });
  });
}

module.exports = app;
