const { generateTokens, verifyAccessToken, verifyRefreshToken } = require('../services/authService');
const { encrypt, decrypt } = require('../utils/encryption');

// Minimal test runner (no external deps needed)
let passed = 0, failed = 0;
const test = (name, fn) => {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.error(`  ✗ ${name}: ${e.message}`); failed++; }
};
const expect = (val) => ({
  toBe: (exp) => { if (val !== exp) throw new Error(`Expected ${exp}, got ${val}`); },
  toBeTruthy: () => { if (!val) throw new Error(`Expected truthy, got ${val}`); },
  toContain: (sub) => { if (!String(val).includes(sub)) throw new Error(`Expected to contain ${sub}`); },
});

// Set env for tests
process.env.JWT_SECRET = 'test_secret_key_123';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_456';
process.env.ENCRYPTION_KEY = 'test_encryption_key_789';

console.log('\n🧪 Auth Service Tests');
test('generateTokens returns accessToken and refreshToken', () => {
  const tokens = generateTokens({ id: '123', email: 'test@test.com', role: 'patient' });
  expect(tokens.accessToken).toBeTruthy();
  expect(tokens.refreshToken).toBeTruthy();
});
test('accessToken is a valid JWT', () => {
  const tokens = generateTokens({ id: '123', email: 'test@test.com', role: 'patient' });
  const decoded = verifyAccessToken(tokens.accessToken);
  expect(decoded.id).toBe('123');
  expect(decoded.role).toBe('patient');
});
test('refreshToken is a valid JWT', () => {
  const tokens = generateTokens({ id: '456', email: 'doc@test.com', role: 'doctor' });
  const decoded = verifyRefreshToken(tokens.refreshToken);
  expect(decoded.id).toBe('456');
});
test('access and refresh tokens are different', () => {
  const tokens = generateTokens({ id: '789', role: 'admin' });
  if (tokens.accessToken === tokens.refreshToken) throw new Error('Tokens must differ');
});
test('invalid access token throws', () => {
  try { verifyAccessToken('bad.token.here'); throw new Error('should have thrown'); }
  catch (e) { if (e.message === 'should have thrown') throw e; }
});

console.log('\n🔐 Encryption Tests');
test('encrypt returns a string with colons (iv:tag:data)', () => {
  const enc = encrypt('hello world');
  expect(enc).toContain(':');
});
test('decrypt reverses encrypt', () => {
  const original = 'sensitive medical data';
  const enc = encrypt(original);
  const dec = decrypt(enc);
  expect(dec).toBe(original);
});
test('encrypt produces different output each time (random IV)', () => {
  const a = encrypt('same');
  const b = encrypt('same');
  if (a === b) throw new Error('Encryption should be non-deterministic');
});
test('decrypt handles non-encrypted string gracefully', () => {
  const result = decrypt('not-encrypted-text');
  expect(result).toBe('not-encrypted-text');
});
test('encrypt handles empty string', () => {
  const result = encrypt('');
  expect(result).toBe('');
});

console.log(`\n━━━ Results: ${passed} passed, ${failed} failed ━━━\n`);
if (failed > 0) process.exit(1);
