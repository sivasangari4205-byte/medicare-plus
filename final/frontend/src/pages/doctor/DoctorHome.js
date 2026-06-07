import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { getTheme, cardStyle } from '../../utils/theme';
import { StatCard, PageLoader, StatusBadge, Btn } from '../../components/common/UI';

export default function DoctorHome() {
  const { user, darkMode } = useAuth();
  const t = getTheme(darkMode);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.appointments.doctor().then(r => setAppointments(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  const today = appointments.filter(a => new Date(a.date).toDateString() === new Date().toDateString());
  const pending = appointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled');
  const completed = appointments.filter(a => a.status === 'completed');

  if (loading) return <PageLoader darkMode={darkMode} />;

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#059669 60%,#0d9488 100%)', borderRadius: 22, padding: '32px 40px', color: 'white', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.3rem,3vw,2rem)', fontWeight: 800, margin: 0 }}>Welcome, Dr. {user?.name}! 👨‍⚕️</h1>
            <p style={{ opacity: 0.85, marginTop: 6, fontSize: 14 }}>Your medical practice overview</p>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {[{ n: appointments.length, l: 'Total' }, { n: today.length, l: "Today" }, { n: pending.length, l: 'Active' }, { n: completed.length, l: 'Done' }].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.15)', padding: '10px 18px', borderRadius: 12, textAlign: 'center', minWidth: 65 }}>
                <div style={{ fontSize: 22, fontWeight: 900 }}>{s.n}</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { to: '/doctor/appointments', icon: '📅', label: "Appointments", color: '#0891b2' },
            { to: '/doctor/patients', icon: '🧑', label: "Patients", color: '#059669' },
            { to: '/doctor/lab-reports', icon: '🔬', label: "Lab Reports", color: '#8b5cf6' },
            { to: '/doctor/video-call', icon: '🎥', label: "Video Call", color: '#f59e0b' },
          ].map((q, i) => (
            <Link key={i} to={q.to} style={{ textDecoration: 'none', background: t.card, borderRadius: 16, padding: '20px 14px', textAlign: 'center', border: `1px solid ${t.cardBorder}`, boxShadow: t.shadow, display: 'block' }} className="card-hover">
              <div style={{ fontSize: '1.9rem', marginBottom: 8 }}>{q.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{q.label}</div>
            </Link>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(380px,1fr))', gap: 24 }}>
          <div style={{ ...cardStyle(t), padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: t.text, fontWeight: 700, fontSize: 16, margin: 0 }}>📅 Today's Schedule</h3>
              <Link to="/doctor/appointments" style={{ color: '#0891b2', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>View All →</Link>
            </div>
            {today.length === 0 ? <div style={{ textAlign: 'center', padding: '32px 0', color: t.textSub }}><div style={{ fontSize: 36, marginBottom: 10 }}>📭</div><p style={{ fontSize: 14 }}>No appointments today</p></div>
            : today.map(apt => (
              <div key={apt._id} style={{ padding: '12px 0', borderBottom: `1px solid ${t.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: t.text, fontSize: 14 }}>{apt.patientId?.name || 'Patient'}</div>
                  <div style={{ fontSize: 12, color: t.textSub, marginTop: 2 }}>{new Date(apt.date).toLocaleTimeString('en-IN', { timeStyle: 'short' })} · {apt.type === 'video' ? '🎥 Video' : '🏥 Clinic'}</div>
                </div>
                <StatusBadge status={apt.status} darkMode={darkMode} />
              </div>
            ))}
          </div>

          <div style={{ ...cardStyle(t), padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: t.text, fontWeight: 700, fontSize: 16, margin: 0 }}>⏳ Pending Appointments</h3>
              <Link to="/doctor/appointments" style={{ color: '#0891b2', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Manage →</Link>
            </div>
            {pending.length === 0 ? <div style={{ textAlign: 'center', padding: '32px 0', color: t.textSub }}><div style={{ fontSize: 36, marginBottom: 10 }}>✅</div><p style={{ fontSize: 14 }}>All appointments addressed</p></div>
            : pending.slice(0, 5).map(apt => (
              <div key={apt._id} style={{ padding: '12px 0', borderBottom: `1px solid ${t.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: t.text, fontSize: 14 }}>{apt.patientId?.name || 'Patient'}</div>
                  <div style={{ fontSize: 12, color: t.textSub, marginTop: 2 }}>📅 {new Date(apt.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
                  {apt.symptoms && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>🤒 {apt.symptoms.slice(0, 50)}</div>}
                </div>
                <Link to="/doctor/appointments" style={{ textDecoration: 'none' }}><Btn size="sm" variant="primary">Write Rx</Btn></Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
