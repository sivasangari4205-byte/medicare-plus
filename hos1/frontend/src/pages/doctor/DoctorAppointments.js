import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { getTheme, cardStyle, inputStyle } from '../../utils/theme';
import { PageHeader, StatusBadge, EmptyState, PageLoader, Btn, Modal } from '../../components/common/UI';

export default function DoctorAppointments() {
  const { user, darkMode } = useAuth();
  const t = getTheme(darkMode);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [prescribing, setPrescribing] = useState(null);
  const [prescription, setPrescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try { const r = await api.appointments.doctor(); setAppointments(r.data); } catch {}
    setLoading(false);
  };

  const savePrescription = async () => {
    if (!prescription.trim()) return;
    setSaving(true);
    try {
      await api.appointments.addPrescription(prescribing._id, prescription);
      setSuccess('✅ Prescription saved and patient notified!');
      setPrescribing(null); setPrescription('');
      fetchData(); setTimeout(() => setSuccess(''), 4000);
    } catch { alert('Failed to save'); }
    setSaving(false);
  };

  const downloadRx = (apt) => {
    const dName = user?.name;
    const html = `<!DOCTYPE html><html><head><title>Prescription</title><style>
    body{font-family:Inter,Arial,sans-serif;padding:40px;background:#f0f4f8;margin:0}
    .card{max-width:800px;margin:0 auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.1)}
    .hdr{background:linear-gradient(135deg,#0f172a,#059669);color:white;padding:36px;text-align:center}
    .hdr h2{margin:0 0 6px;font-size:24px}.body{padding:40px}
    .row{display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid #e2e8f0;font-size:14px}
    .rx{background:#f0fdf4;padding:24px;border-radius:12px;margin:24px 0;white-space:pre-line;line-height:1.9;border:1px solid #bbf7d0}
    .footer{background:#f8fafc;padding:16px;text-align:center;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0}
    </style></head><body><div class="card">
    <div class="hdr"><h2>🏥 MediCare+ Hospital</h2><p>Digital Medical Prescription</p></div>
    <div class="body">
    <div class="row"><span><b>Doctor:</b> Dr. ${dName}</span><span><b>Date:</b> ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</span></div>
    <div class="row"><span><b>Patient:</b> ${apt.patientId?.name}</span><span><b>Phone:</b> ${apt.patientId?.phone || 'N/A'}</span></div>
    <div class="row"><b>Symptoms:</b>&nbsp;${apt.symptoms || 'N/A'}</div>
    <div class="rx"><b style="font-size:16px;display:block;margin-bottom:10px">💊 Prescription</b>${apt.prescription}</div>
    <div style="text-align:right;margin-top:32px;font-size:14px"><p><b>Dr. ${dName}</b></p><p style="font-size:12px;color:#64748b">MediCare+ Hospital · Verified Physician</p></div>
    </div><div class="footer">Computer-generated prescription · © 2024 MediCare+</div></div></body></html>`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    a.download = `rx_${apt.patientId?.name?.replace(/ /g,'_')}_${Date.now()}.html`; a.click();
  };

  const FILTERS = [{ id: 'all', label: 'All' }, { id: 'pending', label: 'Pending' }, { id: 'confirmed', label: 'Confirmed' }, { id: 'completed', label: 'Completed' }];
  const shown = filter === 'all' ? appointments : appointments.filter(a => a.status === filter || (filter === 'pending' && a.status === 'confirmed'));

  const inp = inputStyle(t, { marginBottom: 0 });

  if (loading) return <PageLoader darkMode={darkMode} />;

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <PageHeader title="📋 Patient Appointments" subtitle={`${appointments.length} total appointments`} darkMode={darkMode}
          action={<Btn variant="primary" onClick={fetchData}>🔄 Refresh</Btn>} />

        {success && <div style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)', color: '#059669', borderRadius: 12, padding: '14px 20px', marginBottom: 20, fontWeight: 600 }}>{success}</div>}

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: filter === f.id ? 'linear-gradient(135deg,#059669,#0d9488)' : (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'), color: filter === f.id ? 'white' : t.textSub }}>
              {f.label} ({f.id === 'all' ? appointments.length : appointments.filter(a => a.status === f.id || (f.id === 'pending' && a.status === 'confirmed')).length})
            </button>
          ))}
        </div>

        {shown.length === 0 ? <div style={{ ...cardStyle(t) }}><EmptyState icon="📭" title="No appointments" darkMode={darkMode} /></div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {shown.map(apt => (
              <div key={apt._id} style={{ ...cardStyle(t), padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>{apt.patientId?.name || 'Patient'}</div>
                    <div style={{ fontSize: 13, color: t.textSub, marginTop: 3 }}>📞 {apt.patientId?.phone || 'N/A'} &nbsp;|&nbsp; 📅 {new Date(apt.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                    {apt.patientId?.bloodGroup && <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, marginTop: 2 }}>🩸 Blood Group: {apt.patientId.bloodGroup}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <StatusBadge status={apt.status} darkMode={darkMode} />
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: apt.type === 'video' ? 'rgba(139,92,246,0.1)' : 'rgba(8,145,178,0.1)', color: apt.type === 'video' ? '#8b5cf6' : '#0891b2' }}>
                      {apt.type === 'video' ? '🎥 Video' : '🏥 Clinic'}
                    </span>
                  </div>
                </div>
                {apt.symptoms && <div style={{ background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: t.textSub }}>🤒 <strong style={{ color: t.text }}>Symptoms:</strong> {apt.symptoms}</div>}
                {apt.prescription && (
                  <div style={{ background: 'rgba(16,185,129,0.07)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, border: '1px solid rgba(16,185,129,0.15)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#059669', marginBottom: 4 }}>💊 Prescription Written</div>
                    <div style={{ fontSize: 12, color: t.textSub }}>{apt.prescription.slice(0, 100)}...</div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                    <Btn size="sm" variant="primary" onClick={() => { setPrescribing(apt); setPrescription(''); }}>✍️ Write Prescription</Btn>
                  )}
                  {apt.prescription && <Btn size="sm" variant="success" onClick={() => downloadRx(apt)}>📥 Download Rx</Btn>}
                  {apt.type === 'video' && apt.status !== 'completed' && <Btn size="sm" variant="purple" onClick={() => window.location.href = '/doctor/video-call'}>🎥 Start Video</Btn>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={!!prescribing} onClose={() => setPrescribing(null)} title={`✍️ Prescription — ${prescribing?.patientId?.name}`} darkMode={darkMode} maxWidth={580}>
        {prescribing && (
          <>
            <div style={{ background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 13, color: t.textSub }}>
              <strong style={{ color: t.text }}>Symptoms:</strong> {prescribing.symptoms || 'Not specified'}
            </div>
            <textarea value={prescription} onChange={e => setPrescription(e.target.value)}
              placeholder={`Prescription details:\n\n- Tab. Paracetamol 500mg × 1 TDS × 5 days (After meals)\n- Tab. Cetirizine 10mg × 1 OD × 5 days (At night)\n\nAdvice:\n- Rest for 3 days\n- Drink plenty of fluids\n- Follow up after 1 week`}
              style={{ ...inp, width: '100%', minHeight: 200, resize: 'vertical', lineHeight: 1.8, marginBottom: 16, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="success" disabled={saving || !prescription.trim()} onClick={savePrescription} style={{ flex: 1 }}>
                {saving ? '⏳ Saving...' : '💾 Save & Notify Patient'}
              </Btn>
              <Btn variant="ghost" style={{ color: t.text }} onClick={() => setPrescribing(null)}>Cancel</Btn>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
