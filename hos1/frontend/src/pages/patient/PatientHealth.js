import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTheme, cardStyle } from '../../utils/theme';
import { PageHeader, Btn } from '../../components/common/UI';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SAMPLE_DATA = [
  { date: 'Jan', weight: 72, bp: 118, sugar: 95, heartRate: 74 },
  { date: 'Feb', weight: 71, bp: 122, sugar: 98, heartRate: 76 },
  { date: 'Mar', weight: 70, bp: 120, sugar: 92, heartRate: 72 },
  { date: 'Apr', weight: 71, bp: 125, sugar: 102, heartRate: 78 },
  { date: 'May', weight: 69, bp: 119, sugar: 90, heartRate: 71 },
  { date: 'Jun', weight: 70, bp: 121, sugar: 96, heartRate: 75 },
];

const SYSTEM_PROMPT = `You are a helpful AI medical assistant integrated into MediCare+, a healthcare platform. 
When a user describes symptoms, you must respond in this exact JSON format (no markdown, no code blocks, raw JSON only):
{
  "assessment": "2-3 sentence plain-language assessment of the symptoms",
  "severity": "mild|moderate|severe",
  "possibleConditions": ["Condition 1", "Condition 2", "Condition 3"],
  "suggestedMedicines": [
    { "name": "Medicine Name Dosage", "use": "What it treats", "otc": true },
    { "name": "Medicine Name Dosage", "use": "What it treats", "otc": false }
  ],
  "homeRemedies": ["Remedy 1", "Remedy 2", "Remedy 3"],
  "whenToSeeDoctor": "Clear guidance on when to seek professional care",
  "disclaimer": "Always consult a licensed doctor before taking any medication. This AI suggestion is for informational purposes only and is not a substitute for professional medical advice."
}
Keep suggestedMedicines to 3-5 items. Mark otc: true only for over-the-counter medicines. Be accurate and responsible.`;

export default function PatientHealth() {
  const { darkMode } = useAuth();
  const t = getTheme(darkMode);
  const [data, setData] = useState(SAMPLE_DATA);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ weight: '', bp: '', sugar: '', heartRate: '' });
  const [activeTab, setActiveTab] = useState('vitals');

  // AI Checker state
  const [symptoms, setSymptoms] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [aiError, setAiError] = useState('');
  const abortRef = useRef(null);
  const latest = data[data.length - 1];

  const addMetric = () => {
    if (!form.weight && !form.bp) return;
    const now = new Date();
    setData([...data, { date: now.toLocaleDateString('en-IN', { month: 'short' }), weight: +form.weight || latest.weight, bp: +form.bp || latest.bp, sugar: +form.sugar || latest.sugar, heartRate: +form.heartRate || latest.heartRate }]);
    setForm({ weight: '', bp: '', sugar: '', heartRate: '' }); setShowAdd(false);
  };

  const checkSymptoms = async () => {
    if (!symptoms.trim()) return;
    setAiLoading(true); setAiResult(null); setStreamText(''); setAiError('');
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: abortRef.current.signal,
        headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          stream: true,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: `Patient symptoms: ${symptoms}` }],
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6));
            if (json.type === 'content_block_delta' && json.delta?.text) {
              accumulated += json.delta.text;
              setStreamText(accumulated);
            }
          } catch {}
        }
      }

      // Parse final JSON
      const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        setAiResult(JSON.parse(jsonMatch[0]));
        setStreamText('');
      } else {
        setAiError('Could not parse AI response. Please try again.');
      }
    } catch (e) {
      if (e.name !== 'AbortError') setAiError('Failed to reach AI. Please check your connection.');
    }
    setAiLoading(false);
  };

  useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

  const inp = { padding: '11px 14px', borderRadius: 10, border: `1px solid ${t.cardBorder}`, background: t.inputBg || t.card, color: t.text, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' };

  const severityColor = { mild: '#10b981', moderate: '#f59e0b', severe: '#ef4444' };

  const Metric = ({ icon, label, value, unit, color }) => (
    <div style={{ ...cardStyle(t), padding: 22 }}>
      <div style={{ width: 44, height: 44, background: color + '18', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color }}>{value}<span style={{ fontSize: 13, color: t.textSub, fontWeight: 600 }}> {unit}</span></div>
      <div style={{ fontSize: 13, color: t.textSub, marginTop: 4 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <PageHeader title="❤️ My Health" subtitle="Track vitals & AI symptom checker" darkMode={darkMode}
          action={<Btn variant="primary" onClick={() => setShowAdd(!showAdd)}>+ Add Vitals</Btn>} />

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {[{ id: 'vitals', label: '📊 Vitals & Charts' }, { id: 'ai', label: '🤖 AI Symptom Checker' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '10px 22px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: activeTab === tab.id ? 'linear-gradient(135deg,#0891b2,#06b6d4)' : (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'), color: activeTab === tab.id ? 'white' : t.textSub }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* VITALS TAB */}
        {activeTab === 'vitals' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 18, marginBottom: 28 }}>
              <Metric icon="⚖️" label="Body Weight" value={latest.weight} unit="kg" color="#0891b2" />
              <Metric icon="🩸" label="Blood Pressure" value={latest.bp} unit="mmHg" color="#10b981" />
              <Metric icon="🍬" label="Blood Sugar" value={latest.sugar} unit="mg/dL" color="#f59e0b" />
              <Metric icon="💓" label="Heart Rate" value={latest.heartRate} unit="bpm" color="#ef4444" />
            </div>

            {showAdd && (
              <div style={{ ...cardStyle(t), padding: 24, marginBottom: 24 }}>
                <h3 style={{ color: t.text, marginBottom: 16, fontSize: 16, fontWeight: 700 }}>Add Today's Vitals</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 16 }}>
                  {[['weight','⚖️ Weight (kg)'],['bp','🩸 Blood Pressure'],['sugar','🍬 Blood Sugar'],['heartRate','💓 Heart Rate']].map(([k, l]) => (
                    <div key={k}><label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: t.textSub, marginBottom: 5, textTransform: 'uppercase' }}>{l}</label>
                      <input type="number" value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} style={inp} /></div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10 }}><Btn variant="primary" onClick={addMetric}>Save Vitals</Btn><Btn variant="ghost" style={{ color: t.text }} onClick={() => setShowAdd(false)}>Cancel</Btn></div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(440px,1fr))', gap: 24 }}>
              {[{ key: 'weight', label: 'Weight Trend', color: '#0891b2', unit: 'kg' }, { key: 'heartRate', label: 'Heart Rate Trend', color: '#ef4444', unit: 'bpm' }].map(chart => (
                <div key={chart.key} style={{ ...cardStyle(t), padding: 24 }}>
                  <h3 style={{ color: t.text, fontWeight: 700, fontSize: 15, marginBottom: 20 }}>📊 {chart.label}</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={data}>
                      <defs><linearGradient id={`g-${chart.key}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={chart.color} stopOpacity={0.18} /><stop offset="95%" stopColor={chart.color} stopOpacity={0} /></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="date" tick={{ fill: t.textSub, fontSize: 11 }} />
                      <YAxis tick={{ fill: t.textSub, fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 10, color: t.text }} />
                      <Area type="monotone" dataKey={chart.key} stroke={chart.color} strokeWidth={2.5} fill={`url(#g-${chart.key})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          </>
        )}

        {/* AI CHECKER TAB */}
        {activeTab === 'ai' && (
          <div>
            {/* Input Card */}
            <div style={{ ...cardStyle(t), padding: 28, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🤖</div>
                <div>
                  <div style={{ fontWeight: 800, color: t.text, fontSize: 17 }}>AI Symptom Checker</div>
                  <div style={{ fontSize: 12, color: t.textSub }}>Powered by Claude AI · Real-time analysis</div>
                </div>
              </div>

              {/* Disclaimer banner */}
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: 12, color: '#dc2626', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <span><b>Medical Disclaimer:</b> This tool is for informational purposes only. It does not replace professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical concerns. In emergencies, call 112 immediately.</span>
              </div>

              <textarea
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) checkSymptoms(); }}
                placeholder="Describe your symptoms in detail... e.g. 'I have a severe headache for 2 days, mild fever of 101°F, sore throat and body aches. No known allergies.'"
                style={{ ...inp, minHeight: 110, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                <span style={{ fontSize: 12, color: t.textSub }}>Ctrl+Enter to submit</span>
                <div style={{ display: 'flex', gap: 10 }}>
                  {aiLoading && <button onClick={() => { abortRef.current?.abort(); setAiLoading(false); }} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>⏹ Stop</button>}
                  <button onClick={checkSymptoms} disabled={aiLoading || !symptoms.trim()} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: symptoms.trim() && !aiLoading ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#94a3b8', color: 'white', fontWeight: 700, cursor: symptoms.trim() && !aiLoading ? 'pointer' : 'default', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {aiLoading ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Analysing...</> : '🔍 Check Symptoms'}
                  </button>
                </div>
              </div>
            </div>

            {/* Streaming text */}
            {aiLoading && streamText && (
              <div style={{ ...cardStyle(t), padding: 24, marginBottom: 20, borderLeft: '4px solid #6366f1' }}>
                <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 700, marginBottom: 10 }}>⚡ AI is thinking...</div>
                <pre style={{ color: t.textSub, fontSize: 12, fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0, maxHeight: 200, overflow: 'auto' }}>{streamText}</pre>
              </div>
            )}

            {/* Error */}
            {aiError && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14 }}>{aiError}</div>}

            {/* Results */}
            {aiResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Assessment + Severity */}
                <div style={{ ...cardStyle(t), padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ fontWeight: 800, color: t.text, fontSize: 16 }}>🩺 Assessment</div>
                    <span style={{ background: severityColor[aiResult.severity] + '18', color: severityColor[aiResult.severity], fontWeight: 700, fontSize: 12, padding: '4px 14px', borderRadius: 20, textTransform: 'capitalize' }}>
                      {aiResult.severity === 'mild' ? '🟢' : aiResult.severity === 'moderate' ? '🟡' : '🔴'} {aiResult.severity}
                    </span>
                  </div>
                  <p style={{ color: t.text, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{aiResult.assessment}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
                  {/* Possible Conditions */}
                  <div style={{ ...cardStyle(t), padding: 22 }}>
                    <div style={{ fontWeight: 800, color: t.text, fontSize: 15, marginBottom: 14 }}>🔬 Possible Conditions</div>
                    {aiResult.possibleConditions?.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < aiResult.possibleConditions.length - 1 ? `1px solid ${t.cardBorder}` : 'none' }}>
                        <span style={{ width: 24, height: 24, background: 'rgba(99,102,241,0.1)', color: '#6366f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ color: t.text, fontSize: 14 }}>{c}</span>
                      </div>
                    ))}
                  </div>

                  {/* Home Remedies */}
                  <div style={{ ...cardStyle(t), padding: 22 }}>
                    <div style={{ fontWeight: 800, color: t.text, fontSize: 15, marginBottom: 14 }}>🏠 Home Remedies</div>
                    {aiResult.homeRemedies?.map((r, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: i < aiResult.homeRemedies.length - 1 ? `1px solid ${t.cardBorder}` : 'none' }}>
                        <span style={{ color: '#10b981', fontSize: 14, flexShrink: 0 }}>✓</span>
                        <span style={{ color: t.text, fontSize: 14 }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested Medicines */}
                <div style={{ ...cardStyle(t), padding: 24 }}>
                  <div style={{ fontWeight: 800, color: t.text, fontSize: 16, marginBottom: 6 }}>💊 Suggested Medicines</div>
                  <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '8px 14px', marginBottom: 16, fontSize: 12, color: '#d97706' }}>
                    ⚠️ Prescription medicines (Rx) require a valid doctor's prescription. Do not self-medicate with prescription drugs.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
                    {aiResult.suggestedMedicines?.map((med, i) => (
                      <div key={i} style={{ background: darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc', borderRadius: 12, padding: 16, border: `1px solid ${t.cardBorder}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <span style={{ fontSize: 16 }}>💊</span>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: med.otc ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: med.otc ? '#059669' : '#ef4444' }}>{med.otc ? 'OTC' : 'Rx'}</span>
                        </div>
                        <div style={{ fontWeight: 700, color: t.text, fontSize: 13, marginBottom: 4 }}>{med.name}</div>
                        <div style={{ fontSize: 12, color: t.textSub }}>{med.use}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* When to see doctor */}
                <div style={{ ...cardStyle(t), padding: 22, borderLeft: `4px solid ${severityColor[aiResult.severity]}` }}>
                  <div style={{ fontWeight: 800, color: t.text, fontSize: 15, marginBottom: 10 }}>🏥 When to See a Doctor</div>
                  <p style={{ color: t.text, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{aiResult.whenToSeeDoctor}</p>
                </div>

                {/* Final Disclaimer */}
                <div style={{ background: 'rgba(100,116,139,0.08)', border: `1px solid ${t.cardBorder}`, borderRadius: 12, padding: '14px 18px', fontSize: 12, color: t.textSub, lineHeight: 1.6 }}>
                  <b style={{ color: t.text }}>⚕️ Important Disclaimer: </b>{aiResult.disclaimer}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!aiResult && !aiLoading && !streamText && (
              <div style={{ ...cardStyle(t), padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: 16 }}>🤖</div>
                <div style={{ fontWeight: 700, color: t.text, fontSize: 17, marginBottom: 8 }}>Describe Your Symptoms</div>
                <div style={{ color: t.textSub, fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
                  Enter your symptoms above and get an instant AI-powered health assessment with medicine suggestions and home remedies.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
