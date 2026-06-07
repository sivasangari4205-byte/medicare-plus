const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

let Appointment, MedicineOrder, User, memStore, useMongo, auth;
const init = (deps) => { 
  ({ Appointment, MedicineOrder, User, memStore, useMongo, auth } = deps); 
};

// ==================== PAYMENT VERIFICATION FUNCTIONS ====================

const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');
  return expectedSignature === signature;
};

const verifySubscriptionSignature = ({ subscriptionId, paymentId, signature }) => {
  const body = paymentId + '|' + subscriptionId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');
  return expectedSignature === signature;
};

// ==================== ORDER CREATION ====================

const createOrder = async ({ amount, receipt, notes }) => {
  const options = {
    amount: amount * 100, // Convert to paise
    currency: 'INR',
    receipt: receipt,
    notes: notes,
    payment_capture: 1
  };
  const order = await razorpay.orders.create(options);
  return order;
};

const createSubscriptionPlan = async ({ name, amount, period, interval }) => {
  const plan = await razorpay.plans.create({
    period: period,
    interval: interval,
    item: {
      name: name,
      amount: amount * 100,
      currency: 'INR',
      description: `${name} subscription plan`
    }
  });
  return plan;
};

const createSubscription = async ({ planId, totalCount }) => {
  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: totalCount,
    customer_notify: 1,
    notes: {
      created_by: 'MediCare+'
    }
  });
  return subscription;
};

// ==================== API ROUTES ====================

/**
 * @swagger
 * /api/payment/create-order:
 *   post:
 *     summary: Create Razorpay order for appointment or medicine
 *     tags: [Payment]
 */
router.post('/create-order', async (req, res) => {
  try {
    const { amount, type, referenceId } = req.body;
    
    if (!amount || !type) {
      return res.status(400).json({ error: 'amount and type are required' });
    }
    
    const receipt = `rcpt_${type}_${referenceId || Date.now()}`;
    const order = await createOrder({ 
      amount: amount, 
      receipt, 
      notes: { type, referenceId: referenceId || '' } 
    });
    
    res.json({ 
      success: true, 
      order: order, 
      key: process.env.RAZORPAY_KEY_ID 
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: err.message || 'Failed to create payment order' });
  }
});

/**
 * @swagger
 * /api/payment/verify:
 *   post:
 *     summary: Verify Razorpay payment signature and mark paid
 *     tags: [Payment]
 */
router.post('/verify', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      type, 
      referenceId 
    } = req.body;
    
    const isValid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Update payment status in database based on type
    if (type === 'appointment' && referenceId) {
      if (useMongo) {
        await Appointment.findByIdAndUpdate(referenceId, {
          paymentStatus: 'paid',
          paymentId: razorpay_payment_id
        });
      } else if (memStore) {
        const apt = memStore.appointments.find(a => a._id === referenceId);
        if (apt) {
          apt.paymentStatus = 'paid';
          apt.paymentId = razorpay_payment_id;
        }
      }
    }
    
    if (type === 'medicine' && referenceId) {
      if (useMongo) {
        await MedicineOrder.findByIdAndUpdate(referenceId, {
          paymentStatus: 'paid',
          paymentId: razorpay_payment_id
        });
      } else if (memStore) {
        const order = memStore.orders.find(o => o._id === referenceId);
        if (order) {
          order.paymentStatus = 'paid';
          order.paymentId = razorpay_payment_id;
        }
      }
    }
    
    res.json({ 
      success: true, 
      paymentId: razorpay_payment_id,
      message: 'Payment verified successfully'
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
});

/**
 * @swagger
 * /api/payment/subscription/plan:
 *   post:
 *     summary: Create a recurring subscription plan
 *     tags: [Payment]
 */
router.post('/subscription/plan', async (req, res) => {
  try {
    const { name, amount, period = 'monthly', interval = 1 } = req.body;
    
    if (!name || !amount) {
      return res.status(400).json({ error: 'name and amount are required' });
    }
    
    const plan = await createSubscriptionPlan({ name, amount, period, interval });
    res.json({ success: true, plan });
  } catch (err) {
    console.error('Create plan error:', err);
    res.status(500).json({ error: err.message || 'Failed to create subscription plan' });
  }
});

/**
 * @swagger
 * /api/payment/subscription/create:
 *   post:
 *     summary: Subscribe a patient to a plan
 *     tags: [Payment]
 */
router.post('/subscription/create', async (req, res) => {
  try {
    const { planId, totalCount = 12 } = req.body;
    
    if (!planId) {
      return res.status(400).json({ error: 'planId is required' });
    }
    
    const subscription = await createSubscription({ planId, totalCount });
    res.json({ 
      success: true, 
      subscription, 
      key: process.env.RAZORPAY_KEY_ID 
    });
  } catch (err) {
    console.error('Create subscription error:', err);
    res.status(500).json({ error: err.message || 'Failed to create subscription' });
  }
});

/**
 * @swagger
 * /api/payment/subscription/verify:
 *   post:
 *     summary: Verify recurring subscription payment
 *     tags: [Payment]
 */
router.post('/subscription/verify', async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;
    
    const isValid = verifySubscriptionSignature({
      subscriptionId: razorpay_subscription_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid subscription signature' });
    }
    
    res.json({ 
      success: true, 
      message: 'Subscription payment verified successfully' 
    });
  } catch (err) {
    console.error('Subscription verification error:', err);
    res.status(500).json({ error: err.message || 'Subscription verification failed' });
  }
});

/**
 * @swagger
 * /api/payment/invoice/{appointmentId}:
 *   get:
 *     summary: Generate invoice HTML for an appointment
 *     tags: [Payment]
 */
router.get('/invoice/:appointmentId', async (req, res) => {
  try {
    let apt, patient, doctor;
    
    if (useMongo) {
      apt = await Appointment.findById(req.params.appointmentId)
        .populate('patientId', 'name email phone')
        .populate('doctorId', 'name specialty');
      patient = apt?.patientId;
      doctor = apt?.doctorId;
    } else if (memStore) {
      apt = memStore.appointments.find(a => a._id === req.params.appointmentId);
      patient = memStore.users?.find(u => u._id === apt?.patientId);
      doctor = memStore.doctors?.find(d => d._id === apt?.doctorId);
    }
    
    if (!apt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const invoiceHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - MediCare+</title>
  <style>
    body{font-family:Arial,sans-serif;padding:40px;color:#333;max-width:700px;margin:auto}
    .header{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0ea5e9;padding-bottom:16px;margin-bottom:24px}
    .logo{font-size:24px;font-weight:700;color:#0ea5e9}
    h2{margin:0 0 4px;font-size:18px}
    .meta{color:#666;font-size:13px}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th{background:#f0f9ff;padding:10px;text-align:left;border:1px solid #e0e0e0}
    td{padding:10px;border:1px solid #e0e0e0}
    .total{font-weight:700;font-size:16px;text-align:right;margin-top:16px}
    .badge{display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;background:${apt.paymentStatus === 'paid' ? '#dcfce7' : '#fef9c3'};color:${apt.paymentStatus === 'paid' ? '#166534' : '#854d0e'}}
    .footer{margin-top:40px;font-size:11px;color:#999;text-align:center;border-top:1px solid #eee;padding-top:12px}
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🏥 MediCare+</div>
    <div style="text-align:right">
      <div style="font-size:20px;font-weight:700">INVOICE</div>
      <div class="meta">#INV-${apt._id?.toString().slice(-8).toUpperCase() || 'DEMO'}</div>
      <div class="meta">Date: ${new Date().toLocaleDateString('en-IN')}</div>
    </div>
  </div>
  <div style="display:flex;justify-content:space-between;margin-bottom:24px">
    <div>
      <h2>Bill To</h2>
      <div>${patient?.name || 'Patient'}</div>
      <div class="meta">${patient?.email || ''}</div>
      <div class="meta">${patient?.phone || ''}</div>
    </div>
    <div style="text-align:right">
      <h2>Doctor</h2>
      <div>${doctor?.name || 'Doctor'}</div>
      <div class="meta">${doctor?.specialty || ''}</div>
    </div>
  </div>
  <table>
    <thead>
      <tr><th>Description</th><th>Type</th><th>Date</th><th>Amount</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>Medical Consultation</td>
        <td>${apt.type === 'video' ? '📹 Video' : '🏥 Clinic'}</td>
        <td>${new Date(apt.date).toLocaleDateString('en-IN')}</td>
        <td>₹${apt.amount || 0}</td>
      </tr>
    </tbody>
  </table>
  <div class="total">
    Total: ₹${apt.amount || 0} &nbsp; <span class="badge">${(apt.paymentStatus || 'pending').toUpperCase()}</span>
  </div>
  ${apt.paymentId ? `<div class="meta" style="text-align:right;margin-top:6px">Payment ID: ${apt.paymentId}</div>` : ''}
  <div class="footer">
    MediCare+ | Chennai, Tamil Nadu | support@medicare-plus.com<br>
    This is a computer-generated invoice.
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(invoiceHtml);
  } catch (err) {
    console.error('Invoice generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate invoice' });
  }
});

// ==================== EXPORTS ====================

module.exports = { 
  router, 
  init,
  createOrder,
  createSubscriptionPlan,
  createSubscription,
  verifyPaymentSignature,
  verifySubscriptionSignature
};