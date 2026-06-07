import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTheme, cardStyle } from '../../utils/theme';
import { PageHeader, Btn, Modal } from '../../components/common/UI';

const INITIAL_STOCK = [
  { id: '1', name: 'Paracetamol 500mg', category: 'Pain Relief', stock: 450, reorderAt: 50, price: 25, supplier: 'Sun Pharma', expiry: '2026-06', icon: '💊' },
  { id: '2', name: 'Amoxicillin 250mg', category: 'Antibiotic', stock: 80, reorderAt: 30, price: 85, supplier: 'Cipla', expiry: '2025-12', icon: '💉' },
  { id: '3', name: 'Vitamin C 1000mg', category: 'Supplement', stock: 12, reorderAt: 20, price: 120, supplier: 'Himalaya', expiry: '2026-03', icon: '🍊' },
  { id: '4', name: 'Omeprazole 20mg', category: 'Antacid', stock: 200, reorderAt: 40, price: 65, supplier: 'Dr. Reddy', expiry: '2026-01', icon: '🟡' },
  { id: '5', name: 'Cetirizine 10mg', category: 'Antihistamine', stock: 5, reorderAt: 25, price: 35, supplier: 'Mankind', expiry: '2025-11', icon: '🌿' },
  { id: '6', name: 'Metformin 500mg', category: 'Diabetic', stock: 320, reorderAt: 50, price: 45, supplier: 'Sun Pharma', expiry: '2026-06', icon: '💊' },
  { id: '7', name: 'Atorvastatin 10mg', category: 'Cardiac', stock: 95, reorderAt: 30, price: 95, supplier: 'Pfizer', expiry: '2026-04', icon: '❤️' },
  { id: '8', name: 'Dolo 650mg', category: 'Pain Relief', stock: 0, reorderAt: 50, price: 30, supplier: 'Micro Labs', expiry: '2026-08', icon: '💊' },
  { id: '9', name: 'Vitamin D3 60K IU', category: 'Supplement', stock: 180, reorderAt: 30, price: 180, supplier: 'Abbott', expiry: '2026-09', icon: '☀️' },
  { id: '10', name: 'Pantoprazole 40mg', category: 'Antacid', stock: 140, reorderAt: 30, price: 55, supplier: 'Cipla', expiry: '2025-10', icon: '🔵' },
];

export default function PharmacyInventory() {
  const { darkMode } = useAuth();
  const t = getTheme(darkMode);
  const [inventory, setInventory] = useState(INITIAL_STOCK);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [editStock, setEditStock] = useState('');

  const cats = ['All', ...new Set(inventory.map(m => m.category))];

  const getStatus = (item) => {
    if (item.stock === 0) return { label: 'Out of Stock', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    if (item.stock <= item.reorderAt) return { label: 'Low Stock', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    return { label: 'In Stock', color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
  };

  const shown = inventory.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || m.category === catFilter;
    const status = getStatus(m);
    const matchStatus = statusFilter === 'all' || (statusFilter === 'in' && status.label === 'In Stock') || (statusFilter === 'low' && status.label === 'Low Stock') || (statusFilter === 'out' && status.label === 'Out of Stock');
    return matchSearch && matchCat && matchStatus;
  });

  const updateStock = () => {
    setInventory(inv => inv.map(m => m.id === editing.id ? { ...m, stock: parseInt(editStock) || 0 } : m));
    setEditing(null);
  };

  const reorder = (id) => {
    setInventory(inv => inv.map(m => m.id === id ? { ...m, stock: m.stock + 200 } : m));
    alert('📦 Reorder placed! +200 units will arrive in 2-3 days.');
  };

  const outOfStock = inventory.filter(m => m.stock === 0).length;
  const lowStock   = inventory.filter(m => m.stock > 0 && m.stock <= m.reorderAt).length;
  const inStock    = inventory.filter(m => m.stock > m.reorderAt).length;
  const totalValue = inventory.reduce((s, m) => s + m.stock * m.price, 0);

  const inp = { padding: '10px 14px', borderRadius: 10, border: `1px solid ${t.cardBorder}`, background: t.inputBg, color: t.text, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <PageHeader title="💊 Inventory Management" subtitle="Track medicine stock levels and reorders" darkMode={darkMode} />

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { icon: '✅', label: 'In Stock', value: inStock, color: '#10b981' },
            { icon: '⚠️', label: 'Low Stock', value: lowStock, color: '#f59e0b' },
            { icon: '❌', label: 'Out of Stock', value: outOfStock, color: '#ef4444' },
            { icon: '💰', label: 'Inventory Value', value: `₹${(totalValue / 1000).toFixed(0)}K`, color: '#0891b2' },
          ].map((s, i) => (
            <div key={i} style={{ ...cardStyle(t), padding: 20 }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: t.textSub, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search medicines..." style={{ flex: '1 1 200px', padding: '11px 16px', borderRadius: 10, border: `1px solid ${t.cardBorder}`, background: t.card, color: t.text, fontSize: 14, outline: 'none' }} />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding: '11px 14px', borderRadius: 10, border: `1px solid ${t.cardBorder}`, background: t.card, color: t.text, fontSize: 14, outline: 'none', cursor: 'pointer' }}>
            {cats.map(c => <option key={c}>{c}</option>)}
          </select>
          {[{ id: 'all', l: 'All' }, { id: 'in', l: '✅ In Stock' }, { id: 'low', l: '⚠️ Low' }, { id: 'out', l: '❌ Out' }].map(f => (
            <button key={f.id} onClick={() => setStatusFilter(f.id)} style={{ padding: '11px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, background: statusFilter === f.id ? 'linear-gradient(135deg,#0d9488,#059669)' : (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'), color: statusFilter === f.id ? 'white' : t.textSub }}>
              {f.l}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ ...cardStyle(t), overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                {['Medicine', 'Category', 'Stock', 'Reorder At', 'Price', 'Supplier', 'Expiry', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '13px 14px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: t.textSub, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map(m => {
                const status = getStatus(m);
                return (
                  <tr key={m.id} style={{ borderBottom: `1px solid ${t.cardBorder}`, background: m.stock === 0 ? (darkMode ? 'rgba(239,68,68,0.05)' : 'rgba(239,68,68,0.03)') : undefined }}>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '1.3rem' }}>{m.icon}</span>
                        <span style={{ fontWeight: 700, color: t.text, fontSize: 13 }}>{m.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 14px', color: '#0891b2', fontSize: 12, fontWeight: 600 }}>{m.category}</td>
                    <td style={{ padding: '13px 14px' }}>
                      <span style={{ fontWeight: 900, fontSize: 15, color: status.color }}>{m.stock}</span>
                    </td>
                    <td style={{ padding: '13px 14px', color: t.textSub, fontSize: 13 }}>{m.reorderAt}</td>
                    <td style={{ padding: '13px 14px', color: '#10b981', fontWeight: 700 }}>₹{m.price}</td>
                    <td style={{ padding: '13px 14px', color: t.textSub, fontSize: 12 }}>{m.supplier}</td>
                    <td style={{ padding: '13px 14px', color: t.textSub, fontSize: 12 }}>{m.expiry}</td>
                    <td style={{ padding: '13px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: status.bg, color: status.color }}>{status.label}</span>
                    </td>
                    <td style={{ padding: '13px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Btn size="sm" variant="primary" onClick={() => { setEditing(m); setEditStock(String(m.stock)); }}>Edit</Btn>
                        {m.stock <= m.reorderAt && <Btn size="sm" variant="success" onClick={() => reorder(m.id)}>Reorder</Btn>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={`✏️ Update Stock — ${editing?.name}`} darkMode={darkMode} maxWidth={380}>
        {editing && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t.textSub, marginBottom: 8, textTransform: 'uppercase' }}>New Stock Quantity</label>
              <input type="number" value={editStock} onChange={e => setEditStock(e.target.value)} style={inp} min={0} />
            </div>
            <div style={{ fontSize: 13, color: t.textSub, marginBottom: 20 }}>Current: <strong style={{ color: t.text }}>{editing.stock}</strong> units · Reorder at: <strong style={{ color: '#f59e0b' }}>{editing.reorderAt}</strong></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="success" onClick={updateStock} style={{ flex: 1 }}>💾 Update Stock</Btn>
              <Btn variant="ghost" style={{ color: t.text }} onClick={() => setEditing(null)}>Cancel</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
