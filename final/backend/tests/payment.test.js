const { verifyPaymentSignature, verifySubscriptionSignature } = require('../services/paymentService');
const crypto = require('crypto');

let passed = 0, failed = 0;
const test = (name, fn) => {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.error(`  ✗ ${name}: ${e.message}`); failed++; }
};

process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret';

const makeSignature = (body) =>
  crypto.createHmac('sha256', 'test_razorpay_secret').update(body).digest('hex');

console.log('\n💳 Payment Service Tests');
test('verifyPaymentSignature returns true for valid signature', () => {
  const orderId = 'order_123';
  const paymentId = 'pay_456';
  const signature = makeSignature(`${orderId}|${paymentId}`);
  const result = verifyPaymentSignature({ orderId, paymentId, signature });
  if (!result) throw new Error('Expected true');
});
test('verifyPaymentSignature returns false for invalid signature', () => {
  const result = verifyPaymentSignature({ orderId: 'o', paymentId: 'p', signature: 'bad' });
  if (result) throw new Error('Expected false');
});
test('verifySubscriptionSignature returns true for valid signature', () => {
  const subscriptionId = 'sub_789';
  const paymentId = 'pay_101';
  const signature = makeSignature(`${paymentId}|${subscriptionId}`);
  const result = verifySubscriptionSignature({ subscriptionId, paymentId, signature });
  if (!result) throw new Error('Expected true');
});
test('verifySubscriptionSignature returns false for invalid signature', () => {
  const result = verifySubscriptionSignature({ subscriptionId: 's', paymentId: 'p', signature: 'bad' });
  if (result) throw new Error('Expected false');
});

console.log(`\n━━━ Results: ${passed} passed, ${failed} failed ━━━\n`);
if (failed > 0) process.exit(1);
