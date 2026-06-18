const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ADMIN_CONFIG } = require('../config/adminConfig');

/**
 * protect — verifies the JWT and attaches req.user.
 * Works for both regular DB users and the hardcoded admin.
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorised — no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ── Admin virtual user ────────────────────────────────────────────────────
    if (decoded.isAdmin === true) {
      req.user = {
        _id: 'admin',
        id: 'admin',
        email: ADMIN_CONFIG.email,
        name: ADMIN_CONFIG.name,
        designation: ADMIN_CONFIG.designation,
        role: 'admin',
        isAdmin: true,
      };
      return next();
    }

    // ── Regular DB user ───────────────────────────────────────────────────────
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User no longer exists or is deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * adminOnly — must be used AFTER protect.
 * Allows only the hardcoded admin through.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access denied — admin only' });
};

/**
 * authorOrAdmin — resource owner OR admin may proceed.
 * Pass the owner ID as req.resourceOwnerId before calling this.
 */
const authorOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorised' });
  }
  const isAdmin = req.user.role === 'admin';
  const isOwner = req.resourceOwnerId && req.resourceOwnerId.toString() === req.user._id.toString();

  if (isAdmin || isOwner) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Not authorised to perform this action' });
};

module.exports = { protect, adminOnly, authorOrAdmin };