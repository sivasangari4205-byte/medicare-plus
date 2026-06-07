import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { getTheme, cardStyle } from '../../utils/theme';
import { PageHeader, PageLoader, Btn } from '../../components/common/UI';

export default function AdminUsers() {
  const { darkMode } = useAuth();
  const t = getTheme(darkMode);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { api.admin.users().then(r => setUsers(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  const toggle = async (id) => { try { await api.admin.toggleUser(id); const r = await api.admin.users(); setUsers(r.data); } catch {} };
  const del = async (id) => { if (!window.confirm('Delete user?')) return; try { await api.admin.deleteUser(id); setUsers(u => u.filter(x => x._id !== id || x.id !== id)); } catch {} };

  const roleColors = { patient: '#0891b2', doctor: '#059669', pharmacist: '#0d9488' };
  const shown = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || u.role === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return <PageLoader darkMode={darkMode} />;

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <PageHeader title="👥 User Management" subtitle={`${users.length} registered users`} darkMode={darkMode} />
        <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search users..." style={{ flex: '1 1 200px', padding: '11px 16px', borderRadius: 10, border: `1px solid ${t.cardBorder}`, background: t.card, color: t.text, fontSize: 14, outline: 'none' }} />
          {['all', 'patient', 'doctor', 'pharmacist'].map(r => (
            <button key={r} onClick={() => setFilter(r)} style={{ padding: '11px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: filter === r ? 'linear-gradient(135deg,#8b5cf6,#7c3aed)' : (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'), color: filter === r ? 'white' : t.textSub }}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ ...cardStyle(t), overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
            <thead>
              <tr style={{ background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                {['#', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: t.textSub, textTransform: 'uppercase', letterSpacing: 0.6 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((u, i) => (
                <tr key={u._id || u.id} style={{ borderBottom: `1px solid ${t.cardBorder}` }}>
                  <td style={{ padding: '13px 16px', color: t.textSub, fontSize: 13 }}>{i + 1}</td>
                  <td style={{ padding: '13px 16px', fontWeight: 700, color: t.text, fontSize: 14 }}>{u.name}</td>
                  <td style={{ padding: '13px 16px', color: t.textSub, fontSize: 13 }}>{u.email}</td>
                  <td style={{ padding: '13px 16px', color: t.textSub, fontSize: 13 }}>{u.phone}</td>
                  <td style={{ padding: '13px 16px' }}><span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: (roleColors[u.role] || '#8b5cf6') + '18', color: roleColors[u.role] || '#8b5cf6' }}>{u.role?.toUpperCase()}</span></td>
                  <td style={{ padding: '13px 16px' }}><span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: u.isActive !== false ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: u.isActive !== false ? '#059669' : '#ef4444' }}>{u.isActive !== false ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Btn size="sm" variant={u.isActive !== false ? 'danger' : 'success'} onClick={() => toggle(u._id || u.id)}>{u.isActive !== false ? 'Deactivate' : 'Activate'}</Btn>
                      <Btn size="sm" variant="danger" onClick={() => del(u._id || u.id)}>🗑️</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {shown.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: t.textSub }}>No users found</div>}
        </div>
      </div>
    </div>
  );
}
