import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { getTheme, cardStyle } from '../../utils/theme';
import { PageHeader, PageLoader, EmptyState } from '../../components/common/UI';

export default function DoctorPatients() {
  const { darkMode } = useAuth();
  const t = getTheme(darkMode);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.appointments.doctor().then(r => setAppointments(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  const patients = Object.values(appointments.reduce((acc, apt) => {
    const id = apt.patientId?._id;
    if (!id) return acc;
    if (!acc[id]) acc[id] = { ...apt.patientId, visits: [], totalPaid: 0 };
    acc[id].visits.push(apt);
    if (apt.status === 'completed') acc[id].totalPaid += apt.amount || 0;
    return acc;
  }, {}));

  if (loading) return <PageLoader darkMode={darkMode} />;

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <PageHeader title="🧑 My Patients" subtitle={`${patients.length} unique patients`} darkMode={darkMode} />
        {patients.length === 0 ? <div style={{ ...cardStyle(t) }}><EmptyState icon="🧑" title="No patients yet" darkMode={darkMode} /></div>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
            {patients.map(p => (
              <div key={p._id} style={{ ...cardStyle(t), padding: 22 }} className="card-hover">
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#0891b2,#06b6d4)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🧑</div>
                  <div>
                    <div style={{ fontWeight: 800, color: t.text, fontSize: 15 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: t.textSub, marginTop: 2 }}>📞 {p.phone}</div>
                    {p.bloodGroup && <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, marginTop: 2 }}>🩸 {p.bloodGroup}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1, background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: '#0891b2', fontSize: 18 }}>{p.visits.length}</div>
                    <div style={{ fontSize: 11, color: t.textSub }}>Visits</div>
                  </div>
                  <div style={{ flex: 1, background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: '#10b981', fontSize: 18 }}>₹{p.totalPaid}</div>
                    <div style={{ fontSize: 11, color: t.textSub }}>Paid</div>
                  </div>
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: t.textSub }}>Last visit: {p.visits[0] ? new Date(p.visits[0].date).toLocaleDateString('en-IN') : 'N/A'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
