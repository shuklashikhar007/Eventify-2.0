const bcrypt = require('bcryptjs');
const ADMIN_CONFIG = {
  email: 'admin@iitbhu.ac.in',
  passwordHash: '$2b$12$W8lEsYWcUglknHSnYLL96.hfbbEDLb5Rx96dbWl8KF1tU0ljyyCny',
  name: 'Eventify Admin',
  designation: 'System Administrator',
  role: 'admin',
};
/**
 * Safely verify a candidate password against the hardcoded admin hash.
 * Returns boolean — never surfaces the hash or plain-text.
 */
const verifyAdminPassword = async (plainPassword) => {
  return await bcrypt.compare(plainPassword, ADMIN_CONFIG.passwordHash);
};
/**
 * Helper — run locally when you need to rotate the admin password.
 * node -e "require('./config/adminConfig').generateHash('NewPass')"
 */
const generateHash = async (password) => {
  const hash = await bcrypt.hash(password, 12);
  console.log('Paste this into ADMIN_CONFIG.passwordHash:', hash);
};
module.exports = { ADMIN_CONFIG, verifyAdminPassword, generateHash };