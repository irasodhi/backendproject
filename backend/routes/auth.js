const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Helper: generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// ─── POST /api/auth/signup ──────────────────────────────────────────
// @desc  Register a new user
// @access Public
router.post('/signup', async (req, res) => {
  try {
    const { username, useremail, userpassword, contactPhone } = req.body;

    if (!username || !useremail || !userpassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password.',
      });
    }

    // Check for duplicate email
    const existingUser = await User.findOne({ useremail: useremail.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({
      username: username.trim(),
      useremail: useremail.toLowerCase().trim(),
      userpassword,
      contactPhone: contactPhone || '',
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token: generateToken(user._id),
      user: user.toSafeJSON(),
    });
  } catch (err) {
    console.error('[SIGNUP ERROR]', err.message);
    res.status(500).json({ success: false, message: 'Server error during signup.' });
  }
});

// ─── POST /api/auth/login ───────────────────────────────────────────
// @desc  Authenticate user and return JWT
// @access Public
router.post('/login', async (req, res) => {
  try {
    const { useremail, userpassword } = req.body;

    if (!useremail || !userpassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    const user = await User.findOne({ useremail: useremail.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email.',
      });
    }

    const isMatch = await user.matchPassword(userpassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.',
      });
    }

    res.json({
      success: true,
      message: `Welcome back, ${user.username}!`,
      token: generateToken(user._id),
      user: user.toSafeJSON(),
    });
  } catch (err) {
    console.error('[LOGIN ERROR]', err.message);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────────────
// @desc  Get current logged-in user profile
// @access Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-userpassword');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error('[ME ERROR]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PUT /api/auth/profile ─────────────────────────────────────────
// @desc  Update user profile (name, phone)
// @access Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { username, contactPhone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (username) user.username = username.trim();
    if (contactPhone !== undefined) user.contactPhone = contactPhone;

    await user.save();
    res.json({ success: true, message: 'Profile updated.', user: user.toSafeJSON() });
  } catch (err) {
    console.error('[PROFILE UPDATE ERROR]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/auth/users ───────────────────────────────────────────
// @desc  Get registered user list for multi-account switcher / demo accounts
// @access Public
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-userpassword').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving users.' });
  }
});

// ─── PUT /api/auth/users/:id/role ─────────────────────────────────
// @desc  Admin: change a user's role
// @access Public (caller must be admin — validated client-side)
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be "admin" or "user".' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, select: '-userpassword' }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: `Role updated to ${role}.`, user });
  } catch (err) {
    console.error('[ROLE UPDATE ERROR]', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
