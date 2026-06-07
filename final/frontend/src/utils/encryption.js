const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

// Derive a 32-byte key from the env variable
const KEY = crypto.scryptSync(
  process.env.ENCRYPTION_KEY || 'medicare_plus_encryption_key_2024_secure',
  'medicare_salt_2024',
  32
);

// Encrypt any string value
const encrypt = (text) => {
  if (!text || text === '') return text;
  // Don't double-encrypt already encrypted values
  if (typeof text === 'string' && text.split(':').length === 3) return text;
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(String(text), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('[Encryption] encrypt error:', err.message);
    return text;
  }
};

// Decrypt an encrypted string
const decrypt = (encryptedText) => {
  if (!encryptedText) return encryptedText;
  if (typeof encryptedText !== 'string' || encryptedText.split(':').length !== 3) return encryptedText;
  try {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    // Return original if decryption fails (e.g. old unencrypted data)
    return encryptedText;
  }
};

// Check if a string is already encrypted
const isEncrypted = (value) => {
  if (typeof value !== 'string') return false;
  const parts = value.split(':');
  return parts.length === 3 && parts[0].length === 32; // IV is 16 bytes = 32 hex chars
};

module.exports = { encrypt, decrypt, isEncrypted };