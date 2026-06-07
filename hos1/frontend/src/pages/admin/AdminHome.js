import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { getTheme, cardStyle } from '../../utils/theme';
import { StatCard, PageLoader } from '../../components/common/UI';

export default function AdminHome() {
  const { user, darkMode } = useAuth();
  const t = getTheme(darkMode);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.admin.stats().then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <PageLoader darkMode={darkMode} />;

  const QUICK = [
    { to: '/admin/users', icon: '👥', label: 'Manage Users', color: '#0891b2' },
    { to: '/admin/doctors', icon: '👨‍⚕️', label: 'Manage Doctors', color: '#059669' },
    { to: '/admin/appointments', icon: '📅', label: 'All Appointments', color: '#8b5cf6' },
    { to: '/admin/orders', icon: '📦', label: 'Medicine Orders', color: '#0d9488' },
    { to: '/admin/analytics', icon: '📈', label: 'Analytics', color: '#f59e0b' },
    { to: '/pharmacy/orders', icon: '💊', label: 'Pharmacy View', color: '#ef4444' },
  ];

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#7c3aed 60%,#8b5cf6 100%)', borderRadius: 22, padding: '32px 40px', color: 'white', marginBottom: 28 }}>
          <h1 style={{ fontSize: 'clamp(1.3rem,3vw,2rem)', fontWeight: 800, margin: 0 }}>👑 Admin Dashboard</h1>
          <p style={{ opacity: 0.85, marginTop: 6, fontSize: 14 }}>Full system control — MediCare+ Enterprise Platform</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 28 }}>
          <StatCard icon="🧑" label="Total Patients" value={stats?.totalPatients || 0} color="#0891b2" darkMode={darkMode} />
          <StatCard icon="👨‍⚕️" label="Total Doctors" value={stats?.totalDoctors || 0} color="#059669" darkMode={darkMode} />
          <StatCard icon="📅" label="Appointments" value={stats?.totalAppointments || 0} color="#8b5cf6" darkMode={darkMode} />
          <StatCard icon="✅" label="Completed" value={stats?.completedAppointments || 0} color="#10b981" darkMode={darkMode} />
          <StatCard icon="📦" label="Pending Orders" value={stats?.pendingOrders || 0} color="#f59e0b" darkMode={darkMode} />
          <StatCard icon="💰" label="Revenue" value={`₹${(stats?.revenue || 0).toLocaleString('en-IN')}`} color="#10b981" darkMode={darkMode} />
          <StatCard icon="📆" label="Today's Apts" value={stats?.todayAppointments || 0} color="#0891b2" darkMode={darkMode} />
          <StatCard icon="❌" label="Cancelled" value={stats?.cancelledAppointments || 0} color="#ef4444" darkMode={darkMode} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
          {QUICK.map((q, i) => (
            <Link key={i} to={q.to} style={{ textDecoration: 'none', background: t.card, borderRadius: 16, padding: '22px 16px', textAlign: 'center', border: `1px solid ${t.cardBorder}`, boxShadow: t.shadow }} className="card-hover">
              <div style={{ fontSize: '2.2rem', marginBottom: 10 }}>{q.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{q.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
