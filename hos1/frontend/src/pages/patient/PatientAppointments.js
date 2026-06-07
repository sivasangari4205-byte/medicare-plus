import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { getTheme, cardStyle, inputStyle } from '../../utils/theme';
import { PageHeader, StatusBadge, EmptyState, PageLoader, Btn, Modal } from '../../components/common/UI';

export default function PatientAppointments() {
  const { user, darkMode } = useAuth();
  const t = getTheme(darkMode);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBook, setShowBook] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ doctorId: '', date: '', type: 'clinic', symptoms: '' });
  const [booking, setBooking] = useState(false);
  const [showPrescription, setShowPrescription] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [a, d] = await Promise.all([api.appointments.my(), api.doctors.getAll()]);
      setAppointments(a.data); setDoctors(d.data);
    } catch {}
    setLoading(false);
  };

  const book = async (e) => {
    e.preventDefault(); setBooking(true);
    try {
      await api.appointments.create(form);
      setSuccess('✅ Appointment booked successfully!');
      setShowBook(false); setForm({ doctorId: '', date: '', type: 'clinic', symptoms: '' });
      fetchData(); setTimeout(() => setSuccess(''), 4000);
    } catch (err) { alert(err.response?.data?.error || 'Booking failed'); }
    setBooking(false);
  };

  const cancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try { await api.appointments.cancel(id); fetchData(); } catch {}
  };

  const downloadPrescription = (apt) => {
    const doc = apt.doctorId?.userId?.name || 'Doctor';
    const html = `<!DOCTYPE html><html><head><title>Prescription</title><style>
    body{font-family:Inter,Arial,sans-serif;padding:40px;background:#f0f4f8;margin:0}
    .card{max-width:800px;margin:0 auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.1)}
    .hdr{background:linear-gradient(135deg,#0f172a,#0891b2);color:white;padding:36px;text-align:center}
    .hdr h2{margin:0 0 6px;font-size:24px}.hdr p{margin:0;opacity:.85;font-size:14px}
    .body{padding:40px}.row{display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid #e2e8f0;font-size:14px}
    .rx{background:#f0fdf4;padding:24px;border-radius:12px;margin:24px 0;white-space:pre-line;line-height:1.9;font-size:14px;border:1px solid #bbf7d0}
    .sig{text-align:right;margin-top:40px;font-size:14px}.footer{background:#f8fafc;padding:16px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0}
    </style></head><body><div class="card">
    <div class="hdr"><h2>🏥 MediCare+ Hospital</h2><p>Digital Medical Prescription</p></div>
    <div class="body">
    <div class="row"><span><strong>Prescribing Doctor:</strong> Dr. ${doc}</span><span><strong>Date:</strong> ${new Date(apt.prescriptionDate || apt.date).toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}</span></div>
    <div class="row"><span><strong>Patient:</strong> ${user?.name}</span><span><strong>Specialization:</strong> ${apt.doctorId?.specialization || 'N/A'}</span></div>
    <div class="row"><strong>Chief Complaint / Symptoms:</strong>&nbsp;${apt.symptoms || 'N/A'}</div>
    <div class="rx"><strong style="font-size:16px;display:block;margin-bottom:12px">💊 Prescription</strong>${apt.prescription}</div>
    <div class="sig"><p><strong>Digital Signature</strong></p><p>Dr. ${doc}</p><p style="font-size:12px;color:#64748b">MediCare+ Hospital · License Verified</p></div>
    </div><div class="footer">This is a computer-generated prescription · © 2024 MediCare+ · Valid only with doctor's digital signature</div>
    </div></body></html>`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    a.download = `prescription_${user?.name?.replace(' ', '_')}_${Date.now()}.html`; a.click();
  };

  const upcoming = appointments.filter(a => new Date(a.date) > new Date() && a.status !== 'cancelled');
  const past = appointments.filter(a => new Date(a.date) <= new Date() || a.status === 'cancelled');
  const shown = activeTab === 'upcoming' ? upcoming : past;

  const inp = inputStyle(t, { marginBottom: 0 });

  if (loading) return <PageLoader darkMode={darkMode} />;

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <PageHeader title="📅 My Appointments" subtitle="Manage and track all your medical appointments" darkMode={darkMode}
          action={<Btn onClick={() => setShowBook(true)} variant="primary">+ Book Appointment</Btn>} />

        {success && <div style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)', color: '#059669', borderRadius: 12, padding: '14px 20px', marginBottom: 20, fontWeight: 600 }}>{success}</div>}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[{ id: 'upcoming', label: `Upcoming (${upcoming.length})` }, { id: 'past', label: `Past & Cancelled (${past.length})` }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: activeTab === tab.id ? 'linear-gradient(135deg,#0891b2,#06b6d4)' : (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'), color: activeTab === tab.id ? 'white' : t.textSub }}>
              {tab.label}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div style={{ ...cardStyle(t) }}>
            <EmptyState icon="📭" title={activeTab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
              desc={activeTab === 'upcoming' ? 'Book your first appointment now' : ''} darkMode={darkMode}
              action={activeTab === 'upcoming' && <Btn onClick={() => setShowBook(true)} variant="primary">+ Book Now</Btn>} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 18 }}>
            {shown.map(apt => {
              const dName = apt.doctorId?.userId?.name || 'Doctor';
              return (
                <div key={apt._id} style={{ ...cardStyle(t), padding: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>Dr. {dName}</div>
                      <div style={{ fontSize: 12, color: '#0891b2', fontWeight: 600, marginTop: 2 }}>{apt.doctorId?.specialization}</div>
                    </div>
                    <StatusBadge status={apt.status} darkMode={darkMode} />
                  </div>
                  <div style={{ fontSize: 13, color: t.textSub, marginBottom: 5 }}>📅 {new Date(apt.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                  <div style={{ fontSize: 13, color: t.textSub, marginBottom: 5 }}>{apt.type === 'video' ? '🎥 Video Consultation' : '🏥 In-Clinic Visit'}</div>
                  {apt.symptoms && <div style={{ fontSize: 12, color: t.textSub, background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: 8, padding: '8px 10px', marginBottom: 12, marginTop: 8 }}>🤒 {apt.symptoms}</div>}
                  {apt.amount > 0 && <div style={{ fontSize: 12, color: '#10b981', fontWeight: 700, marginBottom: 10 }}>💰 ₹{apt.amount}</div>}

                  {apt.prescription && (
                    <div style={{ background: 'rgba(16,185,129,0.07)', borderRadius: 10, padding: '10px 12px', marginBottom: 12, border: '1px solid rgba(16,185,129,0.15)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', marginBottom: 4 }}>💊 Prescription Available</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Btn size="sm" variant="primary" onClick={() => setShowPrescription(apt)}>👁️ View</Btn>
                        <Btn size="sm" variant="success" onClick={() => downloadPrescription(apt)}>📥 Download</Btn>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    {apt.status === 'confirmed' && <Btn size="sm" variant="danger" onClick={() => cancel(apt._id)}>✕ Cancel</Btn>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Book Modal */}
      <Modal isOpen={showBook} onClose={() => setShowBook(false)} title="📅 Book New Appointment" darkMode={darkMode} maxWidth={560}>
        <form onSubmit={book}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t.textSub, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Select Doctor *</label>
              <select value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })} style={inp} required>
                <option value="">Choose a doctor...</option>
                {doctors.map(d => <option key={d._id} value={d._id}>Dr. {d.userId?.name} — {d.specialization} (₹{d.consultationFee})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t.textSub, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Date & Time *</label>
              <input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inp} required min={new Date().toISOString().slice(0, 16)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t.textSub, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Consultation Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inp}>
                <option value="clinic">🏥 In-Clinic Visit</option>
                <option value="video">🎥 Video Consultation</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t.textSub, marginBottom: 7, textTransform: 'uppercase', letterSpacing: 0.5 }}>Symptoms / Reason *</label>
              <textarea value={form.symptoms} onChange={e => setForm({ ...form, symptoms: e.target.value })} placeholder="Describe your symptoms..." style={{ ...inp, minHeight: 90, resize: 'vertical' }} required />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="primary" onClick={null} disabled={booking} style={{ flex: 1 }}>
                {booking ? '⏳ Booking...' : '✅ Confirm Booking'}
              </Btn>
              <Btn variant="ghost" onClick={() => setShowBook(false)} style={{ color: t.text }}>Cancel</Btn>
            </div>
          </div>
        </form>
      </Modal>

      {/* Prescription Modal */}
      {showPrescription && (
        <Modal isOpen={!!showPrescription} onClose={() => setShowPrescription(null)} title="💊 Prescription Details" darkMode={darkMode} maxWidth={560}>
          <div style={{ background: 'rgba(16,185,129,0.07)', borderRadius: 12, padding: 20, border: '1px solid rgba(16,185,129,0.2)', whiteSpace: 'pre-line', lineHeight: 1.8, color: t.text, fontSize: 14, marginBottom: 20 }}>
            {showPrescription.prescription}
          </div>
          <Btn variant="primary" onClick={() => downloadPrescription(showPrescription)} style={{ width: '100%' }}>📥 Download Prescription</Btn>
        </Modal>
      )}
    </div>
  );
}
