import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTheme, inputStyle } from '../../utils/theme';

export default function RegisterPage() {
  const { role } = useParams();
  const { register, darkMode } = useAuth();
  const t = getTheme(darkMode);
  const isDoctor = role === 'doctor';

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', role: role || 'patient', specialization: '', experience: '', qualification: '', consultationFee: 500 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = k => e => setForm(prev => ({ ...prev, [k]: e.target.value }));
  const inp = inputStyle(t, { marginBottom: 0 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true); setError('');
    try { await register(form); }
    catch (err) { setError(err.response?.data?.error || 'Registration failed'); setLoading(false); }
  };

  const color = isDoctor ? 'linear-gradient(135deg,#059669,#0d9488)' : 'linear-gradient(135deg,#0891b2,#06b6d4)';
  const icon = isDoctor ? '👨‍⚕️' : '🧑';

  return (
    <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 520 }} className="animate-fadeInUp">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 68, height: 68, background: color, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 14px' }}>{icon}</div>
          <h1 style={{ color: t.text, fontSize: 24, fontWeight: 800 }}>{isDoctor ? 'Doctor Registration' : 'Create Patient Account'}</h1>
          <p style={{ color: t.textSub, marginTop: 6, fontSize: 13 }}>Join MediCare+ today</p>
        </div>

        <div style={{ background: t.card, borderRadius: 24, padding: 32, boxShadow: t.shadowLg, border: `1px solid ${t.cardBorder}` }}>
          {error && <div style={{ background: 'rgba(239,68,68,0.09)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, fontWeight: 600 }}>⚠️ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
              <Field label="Full Name" required><input placeholder={isDoctor ? 'Dr. John Smith' : 'Your full name'} value={form.name} onChange={set('name')} style={inp} required /></Field>
              <Field label="Email Address" required><input type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} style={inp} required /></Field>
              <Field label="Phone Number" required><input type="tel" placeholder="10-digit number" value={form.phone} onChange={set('phone')} style={inp} required /></Field>
              {isDoctor && <>
                <Field label="Specialization" required><input placeholder="e.g. Cardiologist" value={form.specialization} onChange={set('specialization')} style={inp} required /></Field>
                <Field label="Experience" required><input placeholder="e.g. 10 years" value={form.experience} onChange={set('experience')} style={inp} required /></Field>
                <Field label="Qualification" required span2><input placeholder="e.g. MBBS, MD, FACC" value={form.qualification} onChange={set('qualification')} style={inp} required /></Field>
                <Field label="Consultation Fee (₹)"><input type="number" value={form.consultationFee} onChange={set('consultationFee')} style={inp} min={0} /></Field>
              </>}
              <Field label="Password" required><input type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} style={inp} required /></Field>
              <Field label="Confirm Password" required><input type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} style={inp} required /></Field>
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', marginTop: 20, padding: 13, background: color, color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? '⏳ Creating Account...' : `✅ Create ${isDoctor ? 'Doctor' : 'Patient'} Account`}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: t.textSub }}>
            Already registered? <Link to={`/login/${role}`} style={{ color: '#0891b2', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const Field = ({ label, children, required, span2 }) => (
  <div style={{ gridColumn: span2 ? 'span 2' : undefined }}>
    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}{required && ' *'}</label>
    {children}
  </div>
);
