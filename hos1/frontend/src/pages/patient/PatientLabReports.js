import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { getTheme, cardStyle, inputStyle } from '../../utils/theme';
import { PageHeader, StatusBadge, EmptyState, PageLoader, Btn, Modal } from '../../components/common/UI';

export default function PatientLabReports() {
  const { darkMode } = useAuth();
  const t = getTheme(darkMode);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title: '', testType: '', fileData: '', fileName: '', fileType: '' });
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => { api.labReports.my().then(r => setReports(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  const handleFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, fileData: reader.result, fileName: file.name, fileType: file.type }));
    reader.readAsDataURL(file);
  };

  const upload = async (e) => {
    e.preventDefault(); setUploading(true);
    try {
      await api.labReports.upload(form);
      setSuccess('✅ Lab report uploaded successfully!');
      setShowUpload(false); setForm({ title: '', testType: '', fileData: '', fileName: '', fileType: '' });
      const r = await api.labReports.my(); setReports(r.data);
      setTimeout(() => setSuccess(''), 4000);
    } catch { alert('Upload failed'); }
    setUploading(false);
  };

  const TEST_TYPES = ['Blood Test', 'Urine Test', 'X-Ray', 'MRI Scan', 'CT Scan', 'ECG', 'Ultrasound', 'Biopsy', 'Allergy Test', 'COVID-19 Test', 'Thyroid Test', 'Other'];
  const inp = inputStyle(t, { marginBottom: 0 });

  if (loading) return <PageLoader darkMode={darkMode} />;

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <PageHeader title="🔬 Lab Reports" subtitle={`${reports.length} reports uploaded`} darkMode={darkMode}
          action={<Btn variant="primary" onClick={() => setShowUpload(true)}>+ Upload Report</Btn>} />

        {success && <div style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)', color: '#059669', borderRadius: 12, padding: '14px 20px', marginBottom: 20, fontWeight: 600 }}>{success}</div>}

        {reports.length === 0 ? <div style={{ ...cardStyle(t) }}><EmptyState icon="🔬" title="No lab reports" desc="Upload your test reports for doctor review" darkMode={darkMode} action={<Btn variant="primary" onClick={() => setShowUpload(true)}>Upload Now</Btn>} /></div>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
            {reports.map(r => (
              <div key={r._id} style={{ ...cardStyle(t), padding: 22 }} className="card-hover">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, background: 'rgba(139,92,246,0.12)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🔬</div>
                  <StatusBadge status={r.status} darkMode={darkMode} />
                </div>
                <div style={{ fontWeight: 700, color: t.text, fontSize: 14, marginBottom: 4 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 600, marginBottom: 6 }}>{r.testType}</div>
                <div style={{ fontSize: 12, color: t.textSub, marginBottom: 10 }}>📅 {new Date(r.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
                {r.doctorNotes && (
                  <div style={{ background: 'rgba(16,185,129,0.07)', borderRadius: 8, padding: '8px 10px', marginBottom: 10, fontSize: 12, color: t.text, border: '1px solid rgba(16,185,129,0.15)' }}>
                    👨‍⚕️ <strong>Doctor's Note:</strong> {r.doctorNotes}
                  </div>
                )}
                <Btn size="sm" variant="primary" onClick={() => setSelected(r)}>View Details</Btn>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="📤 Upload Lab Report" darkMode={darkMode} maxWidth={520}>
        <form onSubmit={upload}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t.textSub, marginBottom: 7, textTransform: 'uppercase' }}>Report Title *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Blood CBC Report" style={inp} required /></div>
            <div><label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t.textSub, marginBottom: 7, textTransform: 'uppercase' }}>Test Type *</label>
              <select value={form.testType} onChange={e => setForm({ ...form, testType: e.target.value })} style={inp} required>
                <option value="">Select test type...</option>
                {TEST_TYPES.map(tt => <option key={tt}>{tt}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t.textSub, marginBottom: 7, textTransform: 'uppercase' }}>Upload File</label>
              <input type="file" accept="image/*,.pdf" onChange={handleFile} style={{ ...inp, padding: '10px 12px' }} />
              {form.fileName && <div style={{ fontSize: 12, color: '#0891b2', marginTop: 6 }}>✅ {form.fileName}</div>}
            </div>
            <Btn variant="primary" disabled={uploading} style={{ width: '100%' }}>{uploading ? '⏳ Uploading...' : '📤 Upload Report'}</Btn>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`🔬 ${selected.title}`} darkMode={darkMode} maxWidth={560}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, color: t.textSub, marginBottom: 4 }}>TEST TYPE</div>
                <div style={{ fontWeight: 700, color: t.text }}>{selected.testType}</div>
              </div>
              <div style={{ flex: 1, background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, color: t.textSub, marginBottom: 4 }}>DATE</div>
                <div style={{ fontWeight: 700, color: t.text }}>{new Date(selected.createdAt).toLocaleDateString('en-IN')}</div>
              </div>
              <div style={{ flex: 1, background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 11, color: t.textSub, marginBottom: 4 }}>STATUS</div>
                <StatusBadge status={selected.status} darkMode={darkMode} />
              </div>
            </div>
            {selected.fileData && selected.fileType?.startsWith('image') && (
              <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${t.cardBorder}` }}>
                <img src={selected.fileData} alt="Lab Report" style={{ width: '100%', display: 'block' }} />
              </div>
            )}
            {selected.doctorNotes && (
              <div style={{ background: 'rgba(16,185,129,0.07)', borderRadius: 12, padding: 16, border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ fontWeight: 700, color: '#059669', marginBottom: 6 }}>👨‍⚕️ Doctor's Notes</div>
                <div style={{ fontSize: 14, color: t.text, lineHeight: 1.7 }}>{selected.doctorNotes}</div>
                {selected.reviewedAt && <div style={{ fontSize: 12, color: t.textSub, marginTop: 8 }}>Reviewed: {new Date(selected.reviewedAt).toLocaleString('en-IN')}</div>}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
