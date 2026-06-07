import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { getTheme, cardStyle } from '../../utils/theme';
import { PageHeader, PageLoader, EmptyState, Btn } from '../../components/common/UI';

export default function FindDoctors() {
  const { darkMode } = useAuth();
  const t = getTheme(darkMode);
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    api.doctors.getAll().then(r => setDoctors(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const specs = ['All', ...new Set(doctors.map(d => d.specialization))];
  const filtered = doctors.filter(d => {
    const name = d.userId?.name || '';
    const matchSearch = name.toLowerCase().includes(search.toLowerCase()) || d.specialization?.toLowerCase().includes(search.toLowerCase()) || d.hospital?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || d.specialization === filter;
    return matchSearch && matchFilter;
  });

  if (loading) return <PageLoader darkMode={darkMode} />;

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <PageHeader title="👨‍⚕️ Find Doctors" subtitle={`${doctors.length} verified doctors available`} darkMode={darkMode} />

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name, specialization, hospital..." style={{ flex: '1 1 280px', padding: '12px 16px', borderRadius: 12, border: `1px solid ${t.cardBorder}`, background: t.card, color: t.text, fontSize: 14, outline: 'none' }} />
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '12px 16px', borderRadius: 12, border: `1px solid ${t.cardBorder}`, background: t.card, color: t.text, fontSize: 14, outline: 'none', cursor: 'pointer' }}>
            {specs.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? <EmptyState icon="🔍" title="No doctors found" desc="Try a different search or filter" darkMode={darkMode} />
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
            {filtered.map(d => (
              <div key={d._id} style={{ ...cardStyle(t), padding: 26 }} className="card-hover">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg,#0891b2,#06b6d4)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>👨‍⚕️</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: t.text, fontSize: 15 }}>Dr. {d.userId?.name}</div>
                    <div style={{ fontSize: 12, color: '#0891b2', fontWeight: 700, marginTop: 2 }}>{d.specialization}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <span style={{ color: '#f59e0b', fontSize: 13 }}>{'★'.repeat(Math.round(d.rating))}</span>
                      <span style={{ color: t.textSub, fontSize: 12 }}>{d.rating} ({d.totalReviews || 0} reviews)</span>
                    </div>
                  </div>
                  {d.verified && <span style={{ background: 'rgba(16,185,129,0.12)', color: '#059669', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>✓ VERIFIED</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
                  <div style={{ fontSize: 13, color: t.textSub }}>🎓 {d.qualification}</div>
                  <div style={{ fontSize: 13, color: t.textSub }}>⏱️ {d.experience} experience</div>
                  <div style={{ fontSize: 13, color: t.textSub }}>🏥 {d.hospital}</div>
                  <div style={{ fontSize: 14, color: '#10b981', fontWeight: 700 }}>💰 ₹{d.consultationFee} per consultation</div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn variant="primary" style={{ flex: 1 }} onClick={() => navigate('/patient/appointments', { state: { doctorId: d._id } })}>
                    📅 Book
                  </Btn>
                  <Btn variant="purple" style={{ flex: 1 }} onClick={() => navigate('/patient/appointments', { state: { doctorId: d._id, type: 'video' } })}>
                    🎥 Video
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
