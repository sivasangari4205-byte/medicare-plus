import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { getTheme, cardStyle } from '../../utils/theme';
import { PageHeader, PageLoader, Btn } from '../../components/common/UI';

export default function AdminDoctors() {
  const { darkMode } = useAuth();
  const t = getTheme(darkMode);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.doctors.getAllAdmin().then(r => setDoctors(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  const toggle = async (id) => { try { await api.doctors.toggle(id); const r = await api.doctors.getAllAdmin(); setDoctors(r.data); } catch {} };
  const verify = async (id) => { try { await api.doctors.verify(id); const r = await api.doctors.getAllAdmin(); setDoctors(r.data); } catch {} };

  if (loading) return <PageLoader darkMode={darkMode} />;

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <PageHeader title="👨‍⚕️ Doctor Management" subtitle={`${doctors.length} registered doctors`} darkMode={darkMode} />
        <div style={{ ...cardStyle(t), overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                {['Doctor', 'Specialization', 'Experience', 'Fee', 'Rating', 'Status', 'Verified', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: t.textSub, textTransform: 'uppercase', letterSpacing: 0.6 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doctors.map(d => (
                <tr key={d._id} style={{ borderBottom: `1px solid ${t.cardBorder}` }}>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontWeight: 700, color: t.text, fontSize: 14 }}>Dr. {d.userId?.name}</div>
                    <div style={{ fontSize: 11, color: t.textSub }}>{d.userId?.email}</div>
                  </td>
                  <td style={{ padding: '13px 16px', color: '#0891b2', fontWeight: 600, fontSize: 13 }}>{d.specialization}</td>
                  <td style={{ padding: '13px 16px', color: t.textSub, fontSize: 13 }}>{d.experience}</td>
                  <td style={{ padding: '13px 16px', color: '#10b981', fontWeight: 700 }}>₹{d.consultationFee}</td>
                  <td style={{ padding: '13px 16px', color: '#f59e0b', fontWeight: 700 }}>⭐ {d.rating}</td>
                  <td style={{ padding: '13px 16px' }}><span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: d.available ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: d.available ? '#059669' : '#ef4444' }}>{d.available ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ padding: '13px 16px' }}><span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: d.verified ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: d.verified ? '#059669' : '#d97706' }}>{d.verified ? '✓ Verified' : '⏳ Pending'}</span></td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Btn size="sm" variant={d.available ? 'danger' : 'success'} onClick={() => toggle(d._id)}>{d.available ? 'Deactivate' : 'Activate'}</Btn>
                      {!d.verified && <Btn size="sm" variant="success" onClick={() => verify(d._id)}>Verify</Btn>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
