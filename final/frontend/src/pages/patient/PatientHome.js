import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { getTheme, cardStyle } from '../../utils/theme';
import { StatCard, PageLoader, StatusBadge, EmptyState } from '../../components/common/UI';

export default function PatientHome() {
  const { user, darkMode } = useAuth();
  const navigate = useNavigate();
  const t = getTheme(darkMode);
  const [appointments, setAppointments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emergency, setEmergency] = useState(false);
  const [ambProgress, setAmbProgress] = useState(0);

  useEffect(() => {
    Promise.all([api.appointments.my(), api.orders.my()])
      .then(([a, o]) => { setAppointments(a.data); setOrders(o.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const upcoming = appointments.filter(a => new Date(a.date) > new Date() && a.status !== 'cancelled');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  const requestAmbulance = () => {
    setEmergency(true);
    let p = 0;
    const iv = setInterval(() => {
      p += 8; setAmbProgress(Math.min(p, 100));
      if (p >= 100) { clearInterval(iv); alert('🚑 Ambulance has arrived!'); setEmergency(false); setAmbProgress(0); }
    }, 400);
  };

  if (loading) return <PageLoader darkMode={darkMode} />;

  const QUICK = [
    { icon: '+ 📅', label: 'Book Appointment', to: '/patient/appointments', color: '#0891b2' },
    { icon: '👨‍⚕️', label: 'Find Doctors', to: '/patient/doctors', color: '#059669' },
    { icon: '💊', label: 'Order Medicine', to: '/patient/medicines', color: '#0d9488' },
    { icon: '🔬', label: 'Lab Reports', to: '/patient/lab-reports', color: '#8b5cf6' },
    { icon: '🎥', label: 'Video Call', to: '/patient/video-call', color: '#f59e0b' },
    { icon: '❤️', label: 'My Health', to: '/patient/health', color: '#ef4444' },
  ];

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Hero Banner */}
        <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#0891b2 60%,#06b6d4 100%)', borderRadius: 22, padding: 'clamp(24px,4vw,36px) clamp(24px,4vw,40px)', color: 'white', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.3rem,3vw,2rem)', fontWeight: 800, margin: 0 }}>{greeting}, {user?.name}! 👋</h1>
            <p style={{ opacity: 0.85, marginTop: 6, fontSize: 14 }}>Welcome to your personal health dashboard</p>
          </div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {[{ n: appointments.length, l: 'Appointments' }, { n: upcoming.length, l: 'Upcoming' }, { n: orders.length, l: 'Orders' }].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.15)', padding: '10px 18px', borderRadius: 12, textAlign: 'center', minWidth: 72 }}>
                <div style={{ fontSize: 22, fontWeight: 900 }}>{s.n}</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 28 }}>
          {QUICK.map((q, i) => (
            <Link key={i} to={q.to} style={{ textDecoration: 'none', background: t.card, borderRadius: 16, padding: '20px 14px', textAlign: 'center', border: `1px solid ${t.cardBorder}`, boxShadow: t.shadow, cursor: 'pointer', transition: 'all .18s', display: 'block' }}
              className="card-hover">
              <div style={{ fontSize: '1.9rem', marginBottom: 8 }}>{q.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{q.label}</div>
            </Link>
          ))}
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(380px,1fr))', gap: 24 }}>

          {/* Upcoming Appointments */}
          <div style={{ ...cardStyle(t), padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: t.text, fontWeight: 700, fontSize: 16, margin: 0 }}>📅 Upcoming Appointments</h3>
              <Link to="/patient/appointments" style={{ color: '#0891b2', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>View All →</Link>
            </div>
            {upcoming.length === 0 ? (
              <EmptyState icon="📅" title="No upcoming appointments" desc="Book an appointment with a doctor" darkMode={darkMode}
                action={<Link to="/patient/appointments" style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)', color: 'white', padding: '9px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>Book Now</Link>} />
            ) : upcoming.slice(0, 3).map(apt => {
              const dName = apt.doctorId?.userId?.name || 'Doctor';
              return (
                <div key={apt._id} style={{ padding: '14px 0', borderBottom: `1px solid ${t.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: t.text, fontSize: 14 }}>Dr. {dName}</div>
                    <div style={{ fontSize: 12, color: '#0891b2', marginTop: 2 }}>{apt.doctorId?.specialization}</div>
                    <div style={{ fontSize: 12, color: t.textSub, marginTop: 2 }}>📅 {new Date(apt.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                  </div>
                  <StatusBadge status={apt.status} darkMode={darkMode} />
                </div>
              );
            })}
          </div>

          {/* Medicine Orders */}
          <div style={{ ...cardStyle(t), padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: t.text, fontWeight: 700, fontSize: 16, margin: 0 }}>💊 Recent Orders</h3>
              <Link to="/patient/medicines" style={{ color: '#0891b2', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>View All →</Link>
            </div>
            {orders.length === 0 ? (
              <EmptyState icon="🛒" title="No orders yet" desc="Order medicines with doorstep delivery" darkMode={darkMode}
                action={<Link to="/patient/medicines" style={{ background: 'linear-gradient(135deg,#0d9488,#059669)', color: 'white', padding: '9px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>Order Now</Link>} />
            ) : orders.slice(0, 4).map(o => (
              <div key={o._id} style={{ padding: '12px 0', borderBottom: `1px solid ${t.cardBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: t.text, fontSize: 13 }}>{o.items?.length} item{o.items?.length !== 1 ? 's' : ''} — ₹{o.totalAmount}</div>
                  <div style={{ fontSize: 11, color: t.textSub, marginTop: 2 }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</div>
                </div>
                <StatusBadge status={o.status} darkMode={darkMode} />
              </div>
            ))}
          </div>

          {/* Emergency */}
          <div style={{ ...cardStyle(t), padding: 28 }}>
            <h3 style={{ color: t.text, fontWeight: 700, fontSize: 16, marginBottom: 20 }}>🚑 Emergency Services</h3>
            {!emergency ? (
              <>
                <button onClick={requestAmbulance} style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: 'pointer', marginBottom: 14 }}>
                  🚨 Request Ambulance
                </button>
                <div style={{ background: 'rgba(239,68,68,0.07)', borderRadius: 12, padding: 16, border: '1px solid rgba(239,68,68,0.15)' }}>
                  <p style={{ color: t.textSub, fontSize: 13, margin: 0 }}>📞 Emergency Helpline: <strong style={{ color: '#ef4444' }}>108</strong></p>
                  <p style={{ color: t.textSub, fontSize: 13, margin: '6px 0 0' }}>🏥 ICU Available · ER Open 24/7</p>
                </div>
              </>
            ) : (
              <div style={{ background: 'rgba(239,68,68,0.07)', borderRadius: 14, padding: 24, border: '1px solid rgba(239,68,68,0.2)' }}>
                <p style={{ fontWeight: 800, color: '#dc2626', marginBottom: 14, fontSize: 16 }}>🚑 Ambulance Dispatched!</p>
                <div style={{ background: t.cardBorder, borderRadius: 999, height: 10, marginBottom: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${ambProgress}%`, height: '100%', background: 'linear-gradient(90deg,#ef4444,#dc2626)', transition: 'width .4s', borderRadius: 999 }} />
                </div>
                <p style={{ color: t.textSub, fontSize: 13 }}>Progress: {ambProgress}% · ETA: ~5 minutes</p>
              </div>
            )}
          </div>

          {/* AI Symptom Checker - Simple Medicine Suggestions Only */}
          <div style={{ ...cardStyle(t), padding: 28 }}>
            <h3 style={{ color: t.text, fontWeight: 700, fontSize: 16, marginBottom: 8 }}>🤖 AI Symptom Checker</h3>
            <p style={{ color: t.textSub, fontSize: 13, marginBottom: 20 }}>Describe your symptoms to get medicine suggestions</p>
            <AISymptomChecker darkMode={darkMode} t={t} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple AI Symptom Checker - Only suggests tablets with disclaimer
function AISymptomChecker({ darkMode, t }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const getMedicineSuggestion = (symptoms) => {
    const s = symptoms.toLowerCase();
    
    if (s.includes('fever')) {
      return {
        medicine: 'Paracetamol 500mg',
        dosage: '1 tablet every 4-6 hours',
        maxDose: 'Maximum 4 tablets in 24 hours',
        warning: 'Do not exceed recommended dose. Consult doctor if fever persists for more than 3 days.'
      };
    }
    if (s.includes('headache')) {
      return {
        medicine: 'Aspirin 75mg',
        dosage: '1 tablet every 4-6 hours',
        maxDose: 'Maximum 4 tablets in 24 hours',
        warning: 'Do not take on empty stomach. Consult doctor if headache persists.'
      };
    }
    if (s.includes('cold') || s.includes('cough')) {
      return {
        medicine: 'Cetirizine 10mg',
        dosage: '1 tablet daily',
        maxDose: 'Once daily',
        warning: 'May cause drowsiness. Consult doctor if symptoms persist beyond 5 days.'
      };
    }
    if (s.includes('stomach') || s.includes('acidity')) {
      return {
        medicine: 'Digene Gel',
        dosage: '2 tablets after meals',
        maxDose: 'As needed, maximum 4 tablets per day',
        warning: 'Consult doctor if symptoms persist for more than 2 weeks.'
      };
    }
    if (s.includes('body pain') || s.includes('muscle pain')) {
      return {
        medicine: 'Paracetamol 500mg',
        dosage: '1 tablet every 4-6 hours',
        maxDose: 'Maximum 4 tablets in 24 hours',
        warning: 'Do not exceed recommended dose. Consult doctor if pain persists.'
      };
    }
    if (s.includes('chest pain')) {
      return {
        medicine: 'SEEK IMMEDIATE MEDICAL ATTENTION',
        dosage: 'Do not take any medicine without doctor consultation',
        maxDose: 'Call emergency services (108) immediately',
        warning: 'Chest pain could be a sign of heart attack. Seek emergency care right away.'
      };
    }
    return {
      medicine: 'Consult Doctor',
      dosage: 'No medicine suggested',
      maxDose: 'Please consult a healthcare professional',
      warning: 'This is an AI suggestion. Always consult a doctor before taking any medication.'
    };
  };

  const analyze = () => {
    if (!input.trim()) return;
    setLoading(true);
    
    setTimeout(() => {
      const suggestion = getMedicineSuggestion(input);
      setResult(suggestion);
      setLoading(false);
    }, 1000);
  };

  return (
    <div>
      <textarea 
        value={input} 
        onChange={e => setInput(e.target.value)} 
        placeholder="Describe your symptoms... (e.g., fever, headache, cold, stomach pain, body pain)" 
        style={{ 
          width: '100%', 
          padding: '12px 14px', 
          borderRadius: 10, 
          border: `1px solid ${t.cardBorder}`, 
          background: t.inputBg, 
          color: t.text, 
          fontSize: 13, 
          outline: 'none', 
          minHeight: 80, 
          resize: 'vertical', 
          boxSizing: 'border-box', 
          marginBottom: 10 
        }} 
      />
      
      <button 
        onClick={analyze} 
        disabled={loading} 
        style={{ 
          width: '100%', 
          padding: '10px', 
          background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', 
          color: 'white', 
          border: 'none', 
          borderRadius: 10, 
          fontSize: 14, 
          fontWeight: 700, 
          cursor: 'pointer' 
        }}
      >
        {loading ? '⏳ Analyzing...' : '🤖 Suggest Medicine'}
      </button>
      
      {result && (
        <div style={{ 
          background: darkMode ? '#0f172a' : '#f8fafc', 
          borderRadius: 12, 
          padding: 16,
          marginTop: 16,
          border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`
        }}>
          <p style={{ fontWeight: 700, color: t.text, fontSize: 14, marginBottom: 8 }}>💊 Suggested Tablet:</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#0891b2', marginBottom: 12 }}>{result.medicine}</p>
          
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: t.textSub, marginBottom: 4 }}>💊 Dosage: {result.dosage}</p>
            <p style={{ fontSize: 12, color: t.textSub, marginBottom: 4 }}>⚠️ Max Dose: {result.maxDose}</p>
          </div>
          
          <div style={{ 
            background: '#fee2e2', 
            borderRadius: 8, 
            padding: 10, 
            marginTop: 8,
            borderLeft: `3px solid #ef4444`
          }}>
            <p style={{ fontSize: 12, color: '#991b1b', margin: 0, lineHeight: 1.4 }}>
              ⚠️ {result.warning}
            </p>
          </div>
          
          <div style={{ 
            background: '#fef3c7', 
            borderRadius: 8, 
            padding: 10, 
            marginTop: 10,
            borderLeft: `3px solid #f59e0b`
          }}>
            <p style={{ fontSize: 11, color: '#92400e', margin: 0, lineHeight: 1.4 }}>
              📢 DISCLAIMER: This is an AI-generated suggestion and is not a substitute for professional medical advice. 
              Always consult a qualified doctor before taking any medication. Self-medication can be harmful.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}