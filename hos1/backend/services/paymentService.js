const crypto = require('crypto');

let Razorpay;
try { Razorpay = require('razorpay'); } catch { Razorpay = null; }

const getRazorpayInstance = () => {
  if (!Razorpay) throw new Error('razorpay package not installed. Run: npm install razorpay');
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const createOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  const instance = getRazorpayInstance();
  return instance.orders.create({
    amount: Math.round(amount * 100),
    currency,
    receipt,
    notes,
  });
};

const createSubscriptionPlan = async ({ name, amount, period = 'monthly', interval = 1 }) => {
  const instance = getRazorpayInstance();
  return instance.plans.create({
    period,
    interval,
    item: { name, amount: Math.round(amount * 100), currency: 'INR' },
  });
};

const createSubscription = async ({ planId, totalCount = 12, notes = {} }) => {
  const instance = getRazorpayInstance();
  return instance.subscriptions.create({
    plan_id: planId,
    total_count: totalCount,
    notes,
  });
};

const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
};

const verifySubscriptionSignature = ({ subscriptionId, paymentId, signature }) => {
  const body = `${paymentId}|${subscriptionId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
};

module.exports = {
  createOrder,
  createSubscriptionPlan,
  createSubscription,
  verifyPaymentSignature,
  verifySubscriptionSignature,
};
