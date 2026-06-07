import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTheme, cardStyle } from '../../utils/theme';
import { PageHeader, Btn } from '../../components/common/UI';
import API from '../../utils/api';

// ── Load Razorpay SDK once ────────────────────────────────────────────────────
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

// ── Open Razorpay checkout with full error handling ───────────────────────────
const openRazorpay = ({ key, order, user, description, onSuccess, onFail, onDismiss }) => {
  const options = {
    key,
    amount: order.amount,
    currency: order.currency || 'INR',
    name: 'MediCare+',
    description,
    order_id: order.id,
    prefill: {
      name: user?.name || '',
      email: user?.email || '',
      contact: user?.phone || '',
    },
    theme: { color: '#0ea5e9' },
    handler: (response) => onSuccess(response),
    modal: {
      ondismiss: onDismiss,
      escape: true,
      backdropclose: false,
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', (resp) => {
    const msg = resp?.error?.description || resp?.error?.reason || 'Payment failed';
    onFail(msg);
  });
  rzp.open();
};

export default function PaymentPage() {
  const { user, darkMode } = useAuth();
  const t = getTheme(darkMode);

  const [loading, setLoading]   = useState(false);
  const [activePlan, setActivePlan] = useState(null); // track which plan is loading
  const [success, setSuccess]   = useState(null);
  const [error, setError]       = useState('');
  const [tab, setTab]           = useState('one-time');

  // ── One-time payment ────────────────────────────────────────────────────────
  const handleOneTimePayment = async (amount, type, referenceId, description) => {
    setLoading(true);
    setError('');

    const loaded = await loadRazorpay();
    if (!loaded) {
      setError('Razorpay SDK failed to load. Check your internet connection.');
      setLoading(false);
      return;
    }

    let order, key;
    try {
      const { data } = await API.post('/payment/create-order', { amount, type, referenceId });
      order = data.order;
      key   = data.key;
    } catch (e) {
      setError(e.response?.data?.error || 'Could not create payment order. Check Razorpay keys in .env');
      setLoading(false);
      return;
    }

    openRazorpay({
      key, order, user, description,
      onSuccess: async (response) => {
        try {
          await API.post('/payment/verify', {
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
            type, referenceId,
          });
          setSuccess({
            paymentId:   response.razorpay_payment_id,
            amount,
            description,
            type: 'one-time',
          });
        } catch {
          setError('Payment was made but verification failed. Contact support with your Payment ID: ' + response.razorpay_payment_id);
        }
        setLoading(false);
      },
      onFail: (msg) => {
        setError('Payment failed: ' + msg);
        setLoading(false);
      },
      onDismiss: () => {
        setLoading(false);
      },
    });
  };

  // ── Subscription payment ─────────────────────────────────────────────────
  // Uses order-based recurring simulation (works with all Razorpay test keys).
  // When your Razorpay account has Subscriptions enabled, swap the backend
  // route to /payment/subscription/create for native recurring billing.
  const handleSubscription = async (plan) => {
    setActivePlan(plan.name);
    setError('');

    const loaded = await loadRazorpay();
    if (!loaded) {
      setError('Razorpay SDK failed to load. Check your internet connection.');
      setActivePlan(null);
      return;
    }

    let order, key;
    try {
      // Use standard order endpoint — works with all test/live keys.
      // For native subscriptions enable them in your Razorpay dashboard first.
      const { data } = await API.post('/payment/create-order', {
        amount:      plan.amount,
        type:        'subscription',
        referenceId: plan.name.replace(/\s+/g, '_').toLowerCase(),
        notes:       { plan: plan.name, billing: 'monthly' },
      });
      order = data.order;
      key   = data.key;
    } catch (e) {
      const msg = e.response?.data?.error || 'Could not create subscription order.';
      setError(msg + ' — Make sure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set in backend/.env');
      setActivePlan(null);
      return;
    }

    openRazorpay({
      key,
      order,
      user,
      description: `${plan.name} — Monthly ₹${plan.amount}/mo`,
      onSuccess: async (response) => {
        try {
          await API.post('/payment/verify', {
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
            type:        'subscription',
            referenceId: plan.name.replace(/\s+/g, '_').toLowerCase(),
          });
          setSuccess({
            paymentId:   response.razorpay_payment_id,
            amount:      plan.amount,
            description: plan.name + ' — Monthly Subscription',
            type:        'subscription',
            plan,
          });
        } catch {
          setError(
            'Payment made but verification failed. Contact support with Payment ID: ' +
            response.razorpay_payment_id
          );
        }
        setActivePlan(null);
      },
      onFail: (msg) => {
        setError('Subscription payment failed: ' + msg);
        setActivePlan(null);
      },
      onDismiss: () => {
        setActivePlan(null);
      },
    });
  };

  // ── Data ────────────────────────────────────────────────────────────────────
  const plans = [
    {
      name: 'Basic Health Plan',
      amount: 299,
      icon: '🩺',
      features: ['2 consultations/month', 'Lab report upload', 'Medicine orders', 'Chat support'],
    },
    {
      name: 'Premium Health Plan',
      amount: 799,
      icon: '⭐',
      features: ['Unlimited consultations', 'Priority booking', 'Home delivery', 'Emergency support', '24/7 helpline'],
    },
    {
      name: 'Family Health Plan',
      amount: 1499,
      icon: '👨‍👩‍👧‍👦',
      features: ['Up to 5 members', 'Unlimited consultations', 'All Premium features', 'Dedicated care coordinator'],
    },
  ];

  const oneTimeItems = [
    { label: 'General Consultation', amount: 399, type: 'appointment', icon: '🏥', desc: '30-min in-clinic consultation' },
    { label: 'Video Consultation',   amount: 499, type: 'appointment', icon: '🎥', desc: 'HD video call with specialist' },
    { label: 'Medicine Order',       amount: 250, type: 'medicine',    icon: '💊', desc: 'Home delivery of prescription medicines' },
  ];

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 520, margin: '60px auto', ...cardStyle(t), padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
        <h2 style={{ color: t.text, fontWeight: 800, marginBottom: 8 }}>
          {success.type === 'subscription' ? 'Subscription Activated!' : 'Payment Successful!'}
        </h2>
        <p style={{ color: t.textSub, marginBottom: 6 }}>{success.description}</p>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981', margin: '12px 0' }}>₹{success.amount}</div>
        {success.type === 'subscription' && (
          <div style={{ background: darkMode ? '#1e293b' : '#f0fdf4', borderRadius: 12, padding: '12px 16px', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, color: '#10b981', fontSize: 13 }}>🔄 Auto-renews monthly</div>
            <div style={{ color: t.textSub, fontSize: 12, marginTop: 4 }}>
              Manage your subscription from your Razorpay dashboard
            </div>
          </div>
        )}
        <p style={{ color: t.textSub, fontSize: 12, marginBottom: 20 }}>
          Payment ID: <code style={{ background: darkMode ? '#1e293b' : '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{success.paymentId}</code>
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {success.type !== 'subscription' && (
            <Btn variant="outline" onClick={() => window.open(`/api/payment/invoice/demo`, '_blank')}>
              🧾 View Invoice
            </Btn>
          )}
          <Btn variant="primary" onClick={() => setSuccess(null)}>
            Make Another Payment
          </Btn>
        </div>
      </div>
    </div>
  );

  // ── Main page ───────────────────────────────────────────────────────────────
  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <PageHeader
          title="💳 Payments & Billing"
          subtitle="Secure payments powered by Razorpay"
          darkMode={darkMode}
        />

        {/* Error banner */}
        {error && (
          <div style={{
            background: '#fee2e2', color: '#991b1b',
            padding: '12px 16px', borderRadius: 10, marginBottom: 20,
            fontSize: 13, lineHeight: 1.6,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
            <div>
              {error}
              <button
                onClick={() => setError('')}
                style={{ marginLeft: 12, background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}
              >✕</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 28,
          background: darkMode ? '#1e293b' : '#f1f5f9',
          borderRadius: 14, padding: 4,
        }}>
          {[['one-time', '💳 One-time Payment'], ['subscription', '🔄 Subscriptions']].map(([k, label]) => (
            <button
              key={k}
              onClick={() => { setTab(k); setError(''); }}
              style={{
                flex: 1, padding: '11px 0', border: 'none', borderRadius: 10,
                cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all 0.2s',
                background: tab === k ? (darkMode ? '#334155' : 'white') : 'transparent',
                color: tab === k ? '#0ea5e9' : t.textSub,
                boxShadow: tab === k ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              }}
            >{label}</button>
          ))}
        </div>

        {/* ── One-time tab ─────────────────────────────────────────────── */}
        {tab === 'one-time' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {oneTimeItems.map(item => (
              <div key={item.label} style={{ ...cardStyle(t), padding: 28 }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>{item.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: t.text, marginBottom: 6 }}>{item.label}</div>
                <div style={{ color: t.textSub, fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>{item.desc}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#0ea5e9', marginBottom: 20 }}>₹{item.amount}</div>
                <Btn
                  variant="primary"
                  disabled={loading}
                  onClick={() => handleOneTimePayment(item.amount, item.type, null, item.label)}
                  style={{ width: '100%' }}
                >
                  {loading ? '⏳ Processing…' : 'Pay Now →'}
                </Btn>
              </div>
            ))}
          </div>
        )}

        {/* ── Subscriptions tab ────────────────────────────────────────── */}
        {tab === 'subscription' && (
          <>
            {/* Info note */}
            <div style={{
              background: darkMode ? '#1e293b' : '#f0f9ff',
              border: `1px solid ${darkMode ? '#334155' : '#bae6fd'}`,
              borderRadius: 10, padding: '10px 16px', marginBottom: 20,
              fontSize: 13, color: t.textSub, lineHeight: 1.6,
            }}>
              💡 <strong style={{ color: t.text }}>How it works:</strong> Subscribe to a plan and get charged monthly.
              To cancel, log in to your Razorpay account and manage your subscription from there.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {plans.map((plan, i) => {
                const isThisLoading = activePlan === plan.name;
                const isAnyLoading  = !!activePlan;
                return (
                  <div
                    key={plan.name}
                    style={{
                      ...cardStyle(t),
                      padding: 28,
                      border: i === 1 ? '2px solid #0ea5e9' : `1px solid ${t.border}`,
                      position: 'relative',
                      transition: 'box-shadow 0.2s',
                    }}
                  >
                    {i === 1 && (
                      <div style={{
                        position: 'absolute', top: -13, left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
                        color: 'white', fontSize: 11, fontWeight: 800,
                        padding: '4px 16px', borderRadius: 999, whiteSpace: 'nowrap',
                      }}>⭐ MOST POPULAR</div>
                    )}

                    <div style={{ fontSize: 36, marginBottom: 10 }}>{plan.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: t.text, marginBottom: 8 }}>{plan.name}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
                      <span style={{ fontSize: 30, fontWeight: 800, color: '#0ea5e9' }}>₹{plan.amount}</span>
                      <span style={{ fontSize: 13, color: t.textSub }}>/month</span>
                    </div>

                    <ul style={{ padding: 0, margin: '0 0 20px 0', listStyle: 'none' }}>
                      {plan.features.map(f => (
                        <li key={f} style={{ color: t.textSub, fontSize: 13, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#10b981', fontWeight: 700, fontSize: 14 }}>✓</span> {f}
                        </li>
                      ))}
                    </ul>

                    <Btn
                      variant={i === 1 ? 'primary' : 'outline'}
                      disabled={isAnyLoading}
                      onClick={() => handleSubscription(plan)}
                      style={{ width: '100%' }}
                    >
                      {isThisLoading
                        ? '⏳ Opening checkout…'
                        : isAnyLoading
                        ? 'Please wait…'
                        : `Subscribe — ₹${plan.amount}/mo`}
                    </Btn>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}