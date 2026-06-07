import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { getTheme, cardStyle } from '../../utils/theme';
import { PageHeader, PageLoader, StatusBadge, EmptyState, Btn } from '../../components/common/UI';

const STATUS_FLOW = {
  pending:    { next: 'confirmed',   label: '✅ Confirm Order',    variant: 'success' },
  confirmed:  { next: 'processing',  label: '⚙️ Start Processing', variant: 'primary' },
  processing: { next: 'shipped',     label: '🚚 Mark Shipped',     variant: 'primary' },
  shipped:    { next: 'delivered',   label: '✅ Mark Delivered',   variant: 'success' },
};

export default function PharmacyOrders() {
  const { darkMode } = useAuth();
  const t = getTheme(darkMode);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchOrders(); }, []);
  const fetchOrders = () => {
    setLoading(true);
    api.orders.all().then(r => setOrders(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  const advance = async (id, status) => {
    try { await api.orders.updateStatus(id, status); fetchOrders(); } catch {}
  };

  const STATUSES = ['all','pending','confirmed','processing','shipped','delivered','cancelled'];
  const shown = orders
    .filter(o => filter === 'all' || o.status === filter)
    .filter(o => !search || o.patientName?.toLowerCase().includes(search.toLowerCase()) || o._id?.includes(search));

  if (loading) return <PageLoader darkMode={darkMode} />;

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <PageHeader title="📦 All Medicine Orders" subtitle={`${orders.length} orders total`} darkMode={darkMode}
          action={<Btn variant="primary" onClick={fetchOrders}>🔄 Refresh</Btn>} />

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by patient or order ID..."
            style={{ flex: '1 1 220px', padding: '11px 16px', borderRadius: 10, border: `1px solid ${t.cardBorder}`, background: t.card, color: t.text, fontSize: 14, outline: 'none' }} />
          {STATUSES.map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '9px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, background: filter === s ? 'linear-gradient(135deg,#0d9488,#059669)' : (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'), color: filter === s ? 'white' : t.textSub }}>
              {s.charAt(0).toUpperCase() + s.slice(1)} ({s === 'all' ? orders.length : orders.filter(o => o.status === s).length})
            </button>
          ))}
        </div>

        {shown.length === 0
          ? <div style={{ ...cardStyle(t) }}><EmptyState icon="📦" title="No orders found" darkMode={darkMode} /></div>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {shown.map(o => {
                const flow = STATUS_FLOW[o.status];
                return (
                  <div key={o._id} style={{ ...cardStyle(t), padding: 24 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>Order #{o._id?.slice(-6).toUpperCase()}</div>
                        <div style={{ fontSize: 13, color: t.textSub, marginTop: 4 }}>
                          👤 <strong style={{ color: t.text }}>{o.patientName || o.patientId?.name}</strong> &nbsp;·&nbsp; 📞 {o.patientPhone || o.patientId?.phone}
                        </div>
                        <div style={{ fontSize: 12, color: t.textSub, marginTop: 3 }}>
                          🕐 {new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, color: '#10b981' }}>₹{o.totalAmount}</span>
                        <StatusBadge status={o.status} darkMode={darkMode} />
                      </div>
                    </div>

                    {/* Items */}
                    <div style={{ background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: t.textSub, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Order Items</div>
                      {o.items?.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, color: t.text }}>
                          <span>💊 {item.name} <span style={{ color: t.textSub }}>× {item.quantity}</span>{item.requiresPrescription ? ' 📋' : ''}</span>
                          <span style={{ fontWeight: 700, color: '#10b981' }}>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Delivery */}
                    <div style={{ fontSize: 13, color: t.textSub, marginBottom: 8 }}>
                      📍 <strong style={{ color: t.text }}>Delivery:</strong> {o.deliveryAddress}
                    </div>
                    {o.deliveryNotes && <div style={{ fontSize: 12, color: t.textSub, marginBottom: 12 }}>📝 {o.deliveryNotes}</div>}
                    {o.estimatedDelivery && <div style={{ fontSize: 12, color: '#0d9488', fontWeight: 600, marginBottom: 14 }}>🚚 Estimated: {new Date(o.estimatedDelivery).toLocaleDateString('en-IN')}</div>}

                    {/* Progress bar */}
                    {o.status !== 'cancelled' && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          {['pending','confirmed','processing','shipped','delivered'].map((s, i) => (
                            <div key={s} style={{ textAlign: 'center', flex: 1 }}>
                              <div style={{ width: 12, height: 12, borderRadius: '50%', background: ['pending','confirmed','processing','shipped','delivered'].indexOf(o.status) >= i ? '#10b981' : (darkMode ? '#334155' : '#e2e8f0'), margin: '0 auto 4px' }} />
                              <div style={{ fontSize: 9, color: t.textSub, textTransform: 'uppercase' }}>{s}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ height: 4, background: darkMode ? '#334155' : '#e2e8f0', borderRadius: 2 }}>
                          <div style={{ height: '100%', background: '#10b981', borderRadius: 2, transition: 'width .4s', width: `${(['pending','confirmed','processing','shipped','delivered'].indexOf(o.status) + 1) * 20}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {flow && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Btn variant={flow.variant} onClick={() => advance(o._id, flow.next)} style={{ flex: 1 }}>{flow.label}</Btn>
                        {o.status === 'pending' && <Btn variant="danger" onClick={() => advance(o._id, 'cancelled')}>✕ Cancel</Btn>}
                      </div>
                    )}
                    {o.status === 'delivered' && <div style={{ color: '#10b981', fontWeight: 700, fontSize: 14 }}>✅ Order Delivered Successfully</div>}
                    {o.status === 'cancelled' && <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 14 }}>❌ Order Cancelled</div>}
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}
