// Configuration for CrossDrop signaling server
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  HEARTBEAT_MS: parseInt(process.env.HEARTBEAT_MS || '30000', 10),
  CLIENT_TIMEOUT_MS: parseInt(process.env.CLIENT_TIMEOUT_MS || '60000', 10),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '200', 10)
};
