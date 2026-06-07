const fs = require('fs');
const path = require('path');
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const log = (level, msg) => {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), level, msg }) + '\n';
  fs.appendFileSync(path.join(logDir, 'combined.log'), line);
  if (level === 'error') fs.appendFileSync(path.join(logDir, 'error.log'), line);
  console.log(`[${level.toUpperCase()}] ${msg}`);
};
module.exports = { info: m => log('info', m), error: m => log('error', m), warn: m => log('warn', m) };
