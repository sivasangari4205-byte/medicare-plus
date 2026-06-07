import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { getTheme, cardStyle, inputStyle } from '../../utils/theme';
import { PageHeader, StatusBadge, PageLoader, EmptyState, Btn, Modal } from '../../components/common/UI';

export default function DoctorLabReports() {
  const { darkMode } = useAuth();
  const t = getTheme(darkMode);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => { api.labReports.all().then(r => setReports(r.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  const saveReview = async () => {
    setSaving(true);
    try {
      await api.labReports.review(reviewing._id, notes);
      setSuccess('✅ Review saved!'); setReviewing(null); setNotes('');
      const r = await api.labReports.all(); setReports(r.data);
      setTimeout(() => setSuccess(''), 3000);
    } catch { alert('Failed'); }
    setSaving(false);
  };

  const inp = inputStyle(t, { marginBottom: 0 });
  if (loading) return <PageLoader darkMode={darkMode} />;

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <PageHeader title="🔬 Patient Lab Reports" subtitle={`${reports.length} reports to review`} darkMode={darkMode} />
        {success && <div style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)', color: '#059669', borderRadius: 12, padding: '14px 20px', marginBottom: 20, fontWeight: 600 }}>{success}</div>}
        {reports.length === 0 ? <div style={{ ...cardStyle(t) }}><EmptyState icon="🔬" title="No lab reports" darkMode={darkMode} /></div>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 18 }}>
            {reports.map(r => (
              <div key={r._id} style={{ ...cardStyle(t), padding: 22 }} className="card-hover">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: '2rem' }}>🔬</div>
                  <StatusBadge status={r.status} darkMode={darkMode} />
                </div>
                <div style={{ fontWeight: 700, color: t.text, marginBottom: 4 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 600, marginBottom: 4 }}>{r.testType}</div>
                <div style={{ fontSize: 12, color: t.textSub, marginBottom: 4 }}>👤 {r.patientName}</div>
                <div style={{ fontSize: 12, color: t.textSub, marginBottom: 14 }}>📅 {new Date(r.createdAt).toLocaleDateString('en-IN')}</div>
                {r.fileData && r.fileType?.startsWith('image') && (
                  <div style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 12, maxHeight: 120 }}><img src={r.fileData} alt="Report" style={{ width: '100%', objectFit: 'cover' }} /></div>
                )}
                {r.doctorNotes ? <div style={{ fontSize: 12, color: t.textSub, background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>📝 {r.doctorNotes}</div> : null}
                <Btn size="sm" variant={r.status === 'reviewed' ? 'ghost' : 'primary'} onClick={() => { setReviewing(r); setNotes(r.doctorNotes || ''); }} style={{ color: r.status === 'reviewed' ? t.text : undefined }}>
                  {r.status === 'reviewed' ? '📝 Edit Review' : '📝 Add Review'}
                </Btn>
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal isOpen={!!reviewing} onClose={() => setReviewing(null)} title={`📝 Review: ${reviewing?.title}`} darkMode={darkMode} maxWidth={520}>
        {reviewing && <>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Enter your medical observations and recommendations..." style={{ ...inp, width: '100%', minHeight: 140, resize: 'vertical', marginBottom: 16, boxSizing: 'border-box' }} />
          <Btn variant="success" disabled={saving} onClick={saveReview} style={{ width: '100%' }}>{saving ? '⏳ Saving...' : '💾 Save Review'}</Btn>
        </>}
      </Modal>
    </div>
  );
}
