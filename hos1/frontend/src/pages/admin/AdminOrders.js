import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { getTheme, cardStyle } from '../../utils/theme';
import { PageHeader, PageLoader, StatusBadge, Btn } from '../../components/common/UI';

export default function AdminOrders() {
  const { darkMode } = useAuth();
  const t = getTheme(darkMode);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchOrders(); }, []);
  const fetchOrders = () => {
    setLoading(true);
    api.orders.all().then(r => setOrders(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  const updateStatus = async (id, status) => {
    try { await api.orders.updateStatus(id, status); fetchOrders(); } catch {}
  };

  const shown = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled'];

  if (loading) return <PageLoader darkMode={darkMode} />;

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <PageHeader title="📦 Medicine Orders" subtitle={`${orders.length} total orders`} darkMode={darkMode}
          action={<Btn variant="primary" onClick={fetchOrders}>🔄 Refresh</Btn>} />

        <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
          {['all', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, background: filter === s ? 'linear-gradient(135deg,#8b5cf6,#7c3aed)' : (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'), color: filter === s ? 'white' : t.textSub }}>
              {s.charAt(0).toUpperCase() + s.slice(1)} ({s === 'all' ? orders.length : orders.filter(o => o.status === s).length})
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {shown.length === 0 && <div style={{ ...cardStyle(t), padding: 48, textAlign: 'center', color: t.textSub }}>No orders found</div>}
          {shown.map(o => (
            <div key={o._id} style={{ ...cardStyle(t), padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>Order #{o._id?.slice(-6).toUpperCase()}</div>
                  <div style={{ fontSize: 13, color: t.textSub, marginTop: 3 }}>👤 {o.patientName || o.patientId?.name} · 📞 {o.patientPhone || o.patientId?.phone}</div>
                  <div style={{ fontSize: 12, color: t.textSub, marginTop: 2 }}>🕐 {new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <StatusBadge status={o.status} darkMode={darkMode} />
                  <span style={{ fontSize: 15, fontWeight: 900, color: '#10b981' }}>₹{o.totalAmount}</span>
                </div>
              </div>

              <div style={{ background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
                {o.items?.map((item, i) => (
                  <div key={i} style={{ fontSize: 13, color: t.textSub, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>💊 {item.name} × {item.quantity}</span>
                    <span style={{ color: t.text, fontWeight: 600 }}>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 12, color: t.textSub, marginBottom: 14 }}>📍 {o.deliveryAddress}</div>

              {o.status !== 'delivered' && o.status !== 'cancelled' && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {STATUSES.filter(s => s !== o.status && s !== 'cancelled').map(s => (
                    <Btn key={s} size="sm" variant={s === 'delivered' ? 'success' : 'primary'} onClick={() => updateStatus(o._id, s)}>
                      → {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Btn>
                  ))}
                  <Btn size="sm" variant="danger" onClick={() => updateStatus(o._id, 'cancelled')}>✕ Cancel</Btn>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
