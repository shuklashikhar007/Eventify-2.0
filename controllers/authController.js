const User = require('../models/User');
const { ADMIN_CONFIG, verifyAdminPassword } = require('../config/adminConfig');
const { generateUserToken, generateAdminToken, sendTokenResponse } = require('../utils/generateToken');
const { asyncHandler } = require('../middleware/errorHandler');

// ── @POST /api/auth/register ─────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, designation, department, password } = req.body;

  // Block anyone trying to register as admin via normal route
  if (email.toLowerCase() === ADMIN_CONFIG.email) {
    return res.status(403).json({ success: false, message: 'This email is reserved' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already registered' });
  }

  const user = await User.create({ name, email, designation, department, password });
  const token = generateUserToken(user._id);

  sendTokenResponse(res, token, 201, {
    message: 'Registration successful',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      designation: user.designation,
      department: user.department,
      role: user.role,
    },
  });
});

// ── @POST /api/auth/login ────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalised = email.toLowerCase().trim();

  // ── Admin login path (hardcoded, no DB lookup) ────────────────────────────
  if (normalised === ADMIN_CONFIG.email) {
    const isMatch = await verifyAdminPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = generateAdminToken();
    return sendTokenResponse(res, token, 200, {
      message: 'Admin login successful',
      user: {
        id: 'admin',
        name: ADMIN_CONFIG.name,
        email: ADMIN_CONFIG.email,
        designation: ADMIN_CONFIG.designation,
        role: 'admin',
      },
    });
  }

  // ── Regular user login ────────────────────────────────────────────────────
  const user = await User.findOne({ email: normalised }).select('+password');
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = generateUserToken(user._id);
  sendTokenResponse(res, token, 200, {
    message: 'Login successful',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      designation: user.designation,
      department: user.department,
      role: user.role,
    },
  });
});

// ── @GET /api/auth/me ────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  // req.user is already attached by protect middleware
  res.status(200).json({ success: true, user: req.user });
});

// ── @POST /api/auth/logout ───────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// ── @PUT /api/auth/update-profile ────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({ success: false, message: 'Admin profile cannot be updated via this route' });
  }

  const { name, designation, department } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (designation) updates.designation = designation;
  if (department !== undefined) updates.department = department;

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.status(200).json({ success: true, message: 'Profile updated', user });
});

// ── @PUT /api/auth/change-password ───────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  if (req.user.role === 'admin') {
    return res.status(403).json({ success: false, message: 'Admin password cannot be changed via API' });
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Both current and new passwords are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: 'Password changed successfully' });
});

module.exports = { register, login, getMe, logout, updateProfile, changePassword };