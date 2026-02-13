// Lightweight token generation/verification for device authentication
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./config');

function generateToken(payload, opts = {}) {
  return jwt.sign(payload, JWT_SECRET, Object.assign({ expiresIn: '7d' }, opts));
}

function verifyToken(token) {
  try { return jwt.verify(token, JWT_SECRET); } catch (e) { return null; }
}

module.exports = { generateToken, verifyToken };
