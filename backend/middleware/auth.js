const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware — verifies JWT token from Authorization header
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-userpassword');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found. Token invalid.' });
      }
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Not authorised. Token failed.' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorised. No token provided.' });
  }
};

/**
 * Optional Auth middleware — extracts req.user if valid token present, but doesn't block if absent
 */
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-userpassword');
    } catch (err) {
      req.user = null;
    }
  }
  next();
};

/**
 * Admin Only middleware — checks if logged in user has admin role
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied: Admin role required.' });
};

module.exports = { protect, adminOnly, optionalAuth };
