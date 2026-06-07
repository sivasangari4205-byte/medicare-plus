import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { getTheme, cardStyle } from '../../utils/theme';
import { PageHeader, PageLoader, StatusBadge } from '../../components/common/UI';

export default function AdminAppointments() {
  const { darkMode } = useAuth();
  const t = getTheme(darkMode);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { api.appointments.all().then(r => setAppointments(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  const shown = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);

  if (loading) return <PageLoader darkMode={darkMode} />;

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <PageHeader title="📅 All Appointments" subtitle={`${appointments.length} total appointments`} darkMode={darkMode} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
          {['all', 'confirmed', 'pending', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12, background: filter === s ? 'linear-gradient(135deg,#8b5cf6,#7c3aed)' : (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'), color: filter === s ? 'white' : t.textSub }}>
              {s.charAt(0).toUpperCase() + s.slice(1)} ({s === 'all' ? appointments.length : appointments.filter(a => a.status === s).length})
            </button>
          ))}
        </div>
        <div style={{ ...cardStyle(t), overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                {['Patient', 'Doctor', 'Date', 'Type', 'Symptoms', 'Amount', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: t.textSub, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map(a => (
                <tr key={a._id} style={{ borderBottom: `1px solid ${t.cardBorder}` }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: t.text, fontSize: 13 }}>{a.patientId?.name}</td>
                  <td style={{ padding: '12px 16px', color: '#0891b2', fontSize: 13 }}>Dr. {a.doctorId?.userId?.name}</td>
                  <td style={{ padding: '12px 16px', color: t.textSub, fontSize: 12 }}>{new Date(a.date).toLocaleDateString('en-IN', { dateStyle: 'short' })}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: a.type === 'video' ? 'rgba(139,92,246,0.1)' : 'rgba(8,145,178,0.1)', color: a.type === 'video' ? '#8b5cf6' : '#0891b2' }}>{a.type}</span></td>
                  <td style={{ padding: '12px 16px', color: t.textSub, fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.symptoms || '—'}</td>
                  <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 700, fontSize: 13 }}>₹{a.amount || 0}</td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={a.status} darkMode={darkMode} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {shown.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: t.textSub }}>No appointments found</div>}
        </div>
      </div>
    </div>
  );
}
