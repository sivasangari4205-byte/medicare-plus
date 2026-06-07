import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { getTheme, cardStyle } from '../../utils/theme';
import { StatCard, PageLoader, StatusBadge, Btn } from '../../components/common/UI';

export default function PharmacyHome() {
  const { user, darkMode } = useAuth();
  const t = getTheme(darkMode);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.orders.all().then(r => setOrders(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  const pending   = orders.filter(o => o.status === 'pending');
  const confirmed = orders.filter(o => o.status === 'confirmed');
  const processing= orders.filter(o => o.status === 'processing');
  const shipped   = orders.filter(o => o.status === 'shipped');
  const delivered = orders.filter(o => o.status === 'delivered');
  const revenue   = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.totalAmount, 0);

  const updateStatus = async (id, status) => {
    try { await api.orders.updateStatus(id, status); const r = await api.orders.all(); setOrders(r.data); } catch {}
  };

  if (loading) return <PageLoader darkMode={darkMode} />;

  const newOrders = orders.filter(o => o.status === 'pending').slice(0, 5);

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Banner */}
        <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#0d9488 60%,#059669 100%)', borderRadius: 22, padding: '32px 40px', color: 'white', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.3rem,3vw,2rem)', fontWeight: 800, margin: 0 }}>💊 Pharmacy Dashboard</h1>
            <p style={{ opacity: 0.85, marginTop: 6, fontSize: 14 }}>Welcome, {user?.name} — Manage all medicine orders</p>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {[{ n: pending.length, l: 'New Orders' }, { n: processing.length, l: 'Processing' }, { n: shipped.length, l: 'Shipped' }].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.15)', padding: '10px 18px', borderRadius: 12, textAlign: 'center', minWidth: 75 }}>
                <div style={{ fontSize: 22, fontWeight: 900 }}>{s.n}</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 16, marginBottom: 28 }}>
          <StatCard icon="📦" label="Total Orders" value={orders.length} color="#0891b2" darkMode={darkMode} />
          <StatCard icon="🆕" label="Pending" value={pending.length} color="#f59e0b" darkMode={darkMode} sub="Awaiting confirmation" />
          <StatCard icon="⚙️" label="Processing" value={processing.length} color="#8b5cf6" darkMode={darkMode} />
          <StatCard icon="🚚" label="Shipped" value={shipped.length} color="#0d9488" darkMode={darkMode} />
          <StatCard icon="✅" label="Delivered" value={delivered.length} color="#10b981" darkMode={darkMode} />
          <StatCard icon="💰" label="Revenue" value={`₹${revenue.toLocaleString('en-IN')}`} color="#10b981" darkMode={darkMode} />
        </div>

        {/* Quick nav */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { to: '/pharmacy/orders', icon: '📦', label: 'Manage All Orders', color: '#0d9488' },
            { to: '/pharmacy/inventory', icon: '💊', label: 'Inventory', color: '#059669' },
          ].map((q, i) => (
            <Link key={i} to={q.to} style={{ textDecoration: 'none', background: t.card, borderRadius: 16, padding: '22px 18px', textAlign: 'center', border: `1px solid ${t.cardBorder}`, boxShadow: t.shadow, display: 'block' }} className="card-hover">
              <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>{q.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{q.label}</div>
            </Link>
          ))}
        </div>

        {/* New Orders to Act On */}
        <div style={{ ...cardStyle(t), padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ color: t.text, fontWeight: 700, fontSize: 16, margin: 0 }}>🆕 New Orders — Action Required</h3>
            <Link to="/pharmacy/orders" style={{ color: '#0d9488', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>View All →</Link>
          </div>
          {newOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: t.textSub }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <p>All orders are up to date!</p>
            </div>
          ) : newOrders.map(o => (
            <div key={o._id} style={{ padding: '16px 0', borderBottom: `1px solid ${t.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, color: t.text, fontSize: 14 }}>Order #{o._id?.slice(-6).toUpperCase()}</div>
                <div style={{ fontSize: 12, color: t.textSub, marginTop: 2 }}>👤 {o.patientName} · {o.items?.length} item(s) · <strong style={{ color: '#10b981' }}>₹{o.totalAmount}</strong></div>
                <div style={{ fontSize: 11, color: t.textSub, marginTop: 2 }}>📍 {o.deliveryAddress}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn size="sm" variant="success" onClick={() => updateStatus(o._id, 'confirmed')}>✅ Confirm</Btn>
                <Btn size="sm" variant="danger" onClick={() => updateStatus(o._id, 'cancelled')}>✕ Cancel</Btn>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
