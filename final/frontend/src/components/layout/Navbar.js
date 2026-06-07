import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTheme } from '../../utils/theme';

const NAV_LINKS = {
  patient: [
    { to: '/patient', label: 'Dashboard', icon: '🏠' },
    { to: '/patient/appointments', label: 'Appointments', icon: '📅' },
    { to: '/patient/doctors', label: 'Find Doctors', icon: '👨‍⚕️' },
    { to: '/patient/medicines', label: 'Medicines', icon: '💊' },
    { to: '/patient/lab-reports', label: 'Lab Reports', icon: '🔬' },
    { to: '/patient/video-call', label: 'Video Call', icon: '🎥' },
    { to: '/patient/health', label: 'My Health', icon: '❤️' },
    { to: '/patient/payment', label: 'Payments', icon: '💳' },
  ],
  doctor: [
    { to: '/doctor', label: 'Dashboard', icon: '🏠' },
    { to: '/doctor/appointments', label: 'Appointments', icon: '📅' },
    { to: '/doctor/patients', label: 'Patients', icon: '🧑' },
    { to: '/doctor/lab-reports', label: 'Lab Reports', icon: '🔬' },
    { to: '/doctor/video-call', label: 'Video Call', icon: '🎥' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: '📊' },
    { to: '/admin/users', label: 'Users', icon: '👥' },
    { to: '/admin/doctors', label: 'Doctors', icon: '👨‍⚕️' },
    { to: '/admin/appointments', label: 'Appointments', icon: '📅' },
    { to: '/admin/orders', label: 'Orders', icon: '📦' },
    { to: '/admin/analytics', label: 'Analytics', icon: '📈' },
  ],
  pharmacist: [
    { to: '/pharmacy', label: 'Dashboard', icon: '🏠' },
    { to: '/pharmacy/orders', label: 'All Orders', icon: '📦' },
    { to: '/pharmacy/inventory', label: 'Inventory', icon: '💊' },
  ],
};

export default function Navbar() {
  const { user, logout, darkMode, setDarkMode, notifications } = useAuth();
  const t = getTheme(darkMode);
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = user ? NAV_LINKS[user.role] || [] : [];
  const isActive = (to) => location.pathname === to || (to !== '/' && location.pathname.startsWith(to) && to.split('/').length > 2);

  const roleColors = { admin: '#8b5cf6', doctor: '#059669', patient: '#0891b2', pharmacist: '#0d9488' };
  const roleIcons  = { admin: '👑', doctor: '👨‍⚕️', patient: '🧑', pharmacist: '💊' };
  const unread = notifications.length;

  return (
    <nav style={{ background: t.bgSecondary, borderBottom: `1px solid ${t.cardBorder}`, position: 'sticky', top: 0, zIndex: 200, boxShadow: t.shadow }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', gap: 16 }}>

        {/* Logo */}
        <Link to={user ? `/${user.role === 'pharmacist' ? 'pharmacy' : user.role}` : '/'} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#0891b2,#06b6d4)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏥</div>
          <span style={{ fontWeight: 800, fontSize: 18, color: t.text }}>MediCare<span style={{ color: '#0891b2' }}>+</span></span>
        </Link>

        {/* Desktop Nav Links */}
        {user && (
          <div style={{ display: 'flex', gap: 2, flex: 1, overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
            {links.map(link => (
              <Link key={link.to} to={link.to} style={{ textDecoration: 'none', padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: isActive(link.to) ? 'white' : t.textSub, background: isActive(link.to) ? 'linear-gradient(135deg,#0891b2,#06b6d4)' : 'transparent', whiteSpace: 'nowrap', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>{link.icon}</span>
                <span style={{ display: 'none' }} className="nav-label">{link.label}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 'auto' }}>
          {/* Dark mode */}
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontSize: 15 }}>
            {darkMode ? '☀️' : '🌙'}
          </button>

          {user && (
            <>
              {/* Notifications */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setNotifOpen(!notifOpen)} style={{ background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontSize: 15, position: 'relative' }}>
                  🔔
                  {unread > 0 && <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, background: '#ef4444', borderRadius: '50%', border: '2px solid ' + t.bgSecondary }} />}
                </button>
                {notifOpen && (
                  <div style={{ position: 'absolute', right: 0, top: 44, width: 320, background: t.card, borderRadius: 16, border: `1px solid ${t.cardBorder}`, boxShadow: t.shadowLg, zIndex: 300, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${t.cardBorder}`, fontWeight: 700, fontSize: 13, color: t.text }}>🔔 Notifications</div>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', color: t.textSub, fontSize: 13 }}>No new notifications</div>
                    ) : notifications.map(n => (
                      <div key={n.id} style={{ padding: '12px 16px', borderBottom: `1px solid ${t.cardBorder}`, fontSize: 13, color: t.text }}>{n.message}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* User menu */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 10, padding: '7px 12px', cursor: 'pointer' }}>
                  <span style={{ fontSize: 18 }}>{roleIcons[user.role]}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: t.text, lineHeight: 1.2 }}>{user.name.split(' ')[0]}</div>
                    <div style={{ fontSize: 10, color: roleColors[user.role], fontWeight: 700, textTransform: 'uppercase' }}>{user.role}</div>
                  </div>
                  <span style={{ fontSize: 10, color: t.textSub }}>▼</span>
                </button>
                {menuOpen && (
                  <div style={{ position: 'absolute', right: 0, top: 50, width: 220, background: t.card, borderRadius: 14, border: `1px solid ${t.cardBorder}`, boxShadow: t.shadowLg, zIndex: 300, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 16px', borderBottom: `1px solid ${t.cardBorder}` }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: t.text }}>{user.name}</div>
                      <div style={{ fontSize: 12, color: t.textSub, marginTop: 2 }}>{user.email}</div>
                    </div>
                    <button onClick={() => { setMenuOpen(false); logout(); }} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14, color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {!user && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigate('/login/patient')} style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Login</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
