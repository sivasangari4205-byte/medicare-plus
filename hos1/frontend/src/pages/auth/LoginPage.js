import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTheme, inputStyle } from '../../utils/theme';

const ROLE_CONFIG = {
  patient:    { icon: '🧑', label: 'Patient',    color: 'linear-gradient(135deg,#0891b2,#06b6d4)', demo: { email: 'patient@medicare.com',  pw: 'patient123' } },
  doctor:     { icon: '👨‍⚕️', label: 'Doctor',     color: 'linear-gradient(135deg,#059669,#0d9488)', demo: { email: 'doctor@medicare.com',   pw: 'doctor123' } },
  admin:      { icon: '👑', label: 'Admin',      color: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', demo: { email: 'admin@medicare.com',    pw: 'admin123' } },
  pharmacist: { icon: '💊', label: 'Pharmacist', color: 'linear-gradient(135deg,#0d9488,#059669)', demo: { email: 'pharmacy@medicare.com', pw: 'pharma123' } },
};

export default function LoginPage() {
  const { role } = useParams();
  const { login, darkMode } = useAuth();
  const navigate = useNavigate();
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.patient;
  const t = getTheme(darkMode);

  const [email, setEmail] = useState(cfg.demo.email);
  const [password, setPassword] = useState(cfg.demo.pw);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
      setLoading(false);
    }
  };

  const inp = inputStyle(t, { marginBottom: 0 });

  return (
    <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }} className="animate-fadeInUp">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 72, height: 72, background: cfg.color, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(0,0,0,.15)' }}>{cfg.icon}</div>
          <h1 style={{ color: t.text, fontSize: 26, fontWeight: 800 }}>{cfg.label} Login</h1>
          <p style={{ color: t.textSub, marginTop: 6, fontSize: 14 }}>Access your {cfg.label.toLowerCase()} dashboard</p>
        </div>

        <div style={{ background: t.card, borderRadius: 24, padding: 32, boxShadow: t.shadowLg, border: `1px solid ${t.cardBorder}` }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.09)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t.textSub, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email Address</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" required style={inp} placeholder="Enter your email" />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t.textSub, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Password</label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" required style={inp} placeholder="Enter your password" />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: 14, background: cfg.color, color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? '⏳ Signing in...' : `🔐 Sign In as ${cfg.label}`}
            </button>
          </form>

          {/* Demo creds */}
          <div style={{ marginTop: 16, padding: '12px 16px', background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderRadius: 10, border: `1px solid ${t.cardBorder}` }}>
            <p style={{ color: t.textSub, fontSize: 12, margin: 0, fontWeight: 600 }}>
              🔑 Demo: <span style={{ color: t.text }}>{cfg.demo.email}</span> / <span style={{ color: t.text }}>{cfg.demo.pw}</span>
            </p>
          </div>

          {/* Links */}
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <Link to="/" style={{ color: t.textSub, textDecoration: 'none' }}>← Home</Link>
            {role === 'patient' && <Link to="/register/patient" style={{ color: '#0891b2', fontWeight: 600, textDecoration: 'none' }}>Create Account →</Link>}
            {role === 'doctor' && <Link to="/register/doctor" style={{ color: '#059669', fontWeight: 600, textDecoration: 'none' }}>Register as Doctor →</Link>}
          </div>

          {/* Switch portal */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${t.cardBorder}`, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {Object.entries(ROLE_CONFIG).filter(([r]) => r !== role).map(([r, c]) => (
              <Link key={r} to={`/login/${r}`} style={{ fontSize: 12, color: t.textSub, textDecoration: 'none', padding: '5px 12px', border: `1px solid ${t.cardBorder}`, borderRadius: 8 }}>
                {c.icon} {c.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
