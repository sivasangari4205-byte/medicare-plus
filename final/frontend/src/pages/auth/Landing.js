import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTheme } from '../../utils/theme';

const PORTALS = [
  { role: 'patient', icon: '🧑', label: 'Patient Portal', desc: 'Book appointments, consult doctors online, order medicines, upload lab reports, and manage your health records securely.', color: 'linear-gradient(135deg,#0891b2,#06b6d4)', badge: 'For Patients' },
  { role: 'doctor', icon: '👨‍⚕️', label: 'Doctor Portal', desc: 'Manage appointments, write digital prescriptions, review lab reports, and conduct HD video consultations with patients.', color: 'linear-gradient(135deg,#059669,#0d9488)', badge: 'For Doctors' },
  { role: 'admin', icon: '👑', label: 'Admin Portal', desc: 'Full system control – manage users, doctors, appointments, pharmacy orders, analytics and system monitoring.', color: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', badge: 'Super Admin' },
  { role: 'pharmacist', icon: '💊', label: 'Pharmacy Portal', desc: 'Manage medicine orders from patients, update delivery status, track inventory and coordinate with medical staff.', color: 'linear-gradient(135deg,#0d9488,#059669)', badge: 'Pharmacy' },
];

const FEATURES = [
  { icon: '📅', title: 'Smart Appointment Booking', desc: 'Real-time slot selection with confirmation', color: '#0891b2' },
  { icon: '🎥', title: 'HD Video Consultation', desc: 'Secure WebRTC-powered video calls', color: '#8b5cf6' },
  { icon: '🤖', title: 'AI Symptom Checker', desc: 'Intelligent preliminary health analysis', color: '#f59e0b' },
  { icon: '💊', title: 'Medicine Delivery', desc: 'Order prescriptions with doorstep delivery', color: '#0d9488' },
  { icon: '📋', title: 'Lab Report Management', desc: 'Secure upload, storage and sharing', color: '#ef4444' },
  { icon: '🚑', title: 'Emergency Services', desc: 'Real-time ambulance tracking', color: '#dc2626' },
  { icon: '📈', title: 'Health Analytics', desc: 'Track vitals and health trends', color: '#059669' },
  { icon: '🔒', title: 'HIPAA Security', desc: 'Encrypted medical records & JWT auth', color: '#0891b2' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { darkMode } = useAuth();
  const t = getTheme(darkMode);

  return (
    <div style={{ background: t.bg }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#0e7490 60%,#0891b2 100%)', color: 'white', padding: 'clamp(60px,10vw,100px) 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ fontSize: '5rem', marginBottom: 20 }} className="animate-float">🏥</div>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 900, marginBottom: 20, lineHeight: 1.15 }}>
            Enterprise-Grade<br /><span style={{ color: '#06b6d4' }}>Hospital Management</span><br />& Telemedicine Platform
          </h1>
          <p style={{ fontSize: 'clamp(1rem,2vw,1.2rem)', opacity: 0.88, maxWidth: 580, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Connecting patients, doctors, and administrators on one secure, intelligent healthcare platform.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/login/patient')} style={{ padding: '14px 32px', background: '#0891b2', color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', transition: 'all .18s' }}>
              Get Started as Patient →
            </button>
            <button onClick={() => navigate('/login/doctor')} style={{ padding: '14px 32px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '2px solid rgba(255,255,255,0.35)', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              Doctor Login
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'clamp(40px,6vw,72px) 24px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 16, marginBottom: 72 }}>
          {[{ v:'50K+',l:'Patients Served',i:'😊' }, { v:'200+',l:'Expert Doctors',i:'👨‍⚕️' }, { v:'24/7',l:'Support Available',i:'🔄' }, { v:'98%',l:'Satisfaction Rate',i:'⭐' }].map((s, i) => (
            <div key={i} className="animate-fadeInUp card-hover" style={{ background: t.card, borderRadius: 18, padding: '24px 16px', textAlign: 'center', border: `1px solid ${t.cardBorder}`, boxShadow: t.shadow, animationDelay: `${i * 0.07}s` }}>
              <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>{s.i}</div>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0891b2' }}>{s.v}</div>
              <div style={{ color: t.textSub, fontSize: 13, marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Portals */}
        <h2 style={{ color: t.text, fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>Choose Your Portal</h2>
        <p style={{ color: t.textSub, textAlign: 'center', marginBottom: 40, fontSize: 15 }}>Four specialized portals for every stakeholder in healthcare</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 24, marginBottom: 72 }}>
          {PORTALS.map((p, i) => (
            <div key={i} onClick={() => navigate(`/login/${p.role}`)} className="card-hover animate-fadeInUp" style={{ background: t.card, borderRadius: 24, padding: 32, cursor: 'pointer', border: `1px solid ${t.cardBorder}`, boxShadow: t.shadow, animationDelay: `${i * 0.07}s` }}>
              <div style={{ width: 60, height: 60, background: p.color, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 16 }}>{p.icon}</div>
              <div style={{ display: 'inline-block', background: p.color, color: 'white', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>{p.badge}</div>
              <h3 style={{ color: t.text, fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{p.label}</h3>
              <p style={{ color: t.textSub, fontSize: 13, lineHeight: 1.65, marginBottom: 20 }}>{p.desc}</p>
              <div style={{ color: '#0891b2', fontWeight: 700, fontSize: 14 }}>Access {p.label.split(' ')[0]} Portal →</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <h2 style={{ color: t.text, fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>Everything Healthcare Needs</h2>
        <p style={{ color: t.textSub, textAlign: 'center', marginBottom: 40, fontSize: 15 }}>Enterprise-grade features built for real-world healthcare</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 18, marginBottom: 48 }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="animate-fadeInUp" style={{ background: t.card, borderRadius: 18, padding: 24, border: `1px solid ${t.cardBorder}`, animationDelay: `${i * 0.04}s` }}>
              <div style={{ width: 48, height: 48, background: f.color + '18', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ color: t.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{f.title}</h3>
              <p style={{ color: t.textSub, fontSize: 13, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${t.cardBorder}`, paddingTop: 24, textAlign: 'center' }}>
          <p style={{ color: t.textSub, fontSize: 13 }}>© 2024 MediCare+ · Enterprise Hospital Management Platform · HIPAA-Compliant Architecture</p>
          <div style={{ marginTop: 10, display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            {PORTALS.map(p => (
              <button key={p.role} onClick={() => navigate(`/login/${p.role}`)} style={{ background: 'none', border: 'none', color: '#0891b2', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {p.icon} {p.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
