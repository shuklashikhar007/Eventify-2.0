const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT for a regular user.
 */
const generateUserToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * Generate a signed JWT for the hardcoded admin.
 * Includes isAdmin: true so auth middleware can identify the admin
 * without a DB lookup.
 */
const generateAdminToken = () => {
  return jwt.sign({ isAdmin: true, email: 'admin@iitbhu.ac.in' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * Attach the token to a cookie (optional helper for cookie-based auth).
 */
const sendTokenResponse = (res, token, statusCode, data) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({ success: true, token, ...data });
};

module.exports = { generateUserToken, generateAdminToken, sendTokenResponse };