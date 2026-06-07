import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTheme, cardStyle } from '../../utils/theme';
import { PageHeader } from '../../components/common/UI';
import API from '../../utils/api';

export default function MonitoringDashboard() {
  const { darkMode } = useAuth();
  const t = getTheme(darkMode);
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const [mRes, hRes] = await Promise.all([
        API.get('/metrics'),
        API.get('/health'),
      ]);
      setMetrics(mRes.data);
      setHealth(hRes.data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Metrics fetch failed', e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMetrics(); const id = setInterval(fetchMetrics, 10000); return () => clearInterval(id); }, [fetchMetrics]);

  const uptimeFmt = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };

  const Metric = ({ label, value, color, sub }) => (
    <div style={{ ...cardStyle(t), padding: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || '#0ea5e9' }}>{value}</div>
      <div style={{ fontWeight: 600, color: t.text, fontSize: 14, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ color: t.textSub, fontSize: 12, marginTop: 2 }}>{sub}</div>}
    </div>
  );

  const Bar = ({ label, value, max, color }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: t.text }}>{label}</span>
        <span style={{ fontSize: 13, color: t.textSub }}>{value}%</span>
      </div>
      <div style={{ height: 8, background: darkMode ? '#1e293b' : '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color || '#0ea5e9', borderRadius: 999, transition: 'width 0.5s' }} />
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ background: t.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: t.textSub, fontSize: 16 }}>Loading metrics…</div>
    </div>
  );

  const sys = metrics?.system || {};
  const proc = metrics?.process || {};
  const reqs = metrics?.requests || {};

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <PageHeader title="📊 Monitoring Dashboard" subtitle={`Live system metrics · Updated: ${lastUpdated || '—'}`} darkMode={darkMode} />

        {/* Health status */}
        <div style={{ ...cardStyle(t), padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: health?.status === 'ok' ? '#10b981' : '#ef4444', boxShadow: health?.status === 'ok' ? '0 0 8px #10b981' : '0 0 8px #ef4444' }} />
          <span style={{ fontWeight: 700, color: t.text }}>System Status: {health?.status === 'ok' ? 'Healthy ✓' : 'Degraded ⚠'}</span>
          <span style={{ color: t.textSub, fontSize: 13, marginLeft: 'auto' }}>Node {proc?.uptimeSeconds ? uptimeFmt(proc.uptimeSeconds) : '—'} uptime</span>
          <button onClick={fetchMetrics} style={{ background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>↻ Refresh</button>
        </div>

        {/* Top metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
          <Metric label="Total Requests" value={reqs.total || 0} />
          <Metric label="Success Rate" value={`${reqs.successRate || 100}%`} color="#10b981" />
          <Metric label="Heap Used" value={`${proc.heapUsedMB || 0} MB`} color="#f59e0b" />
          <Metric label="Memory Usage" value={`${sys.usedMemoryPercent || 0}%`} color={sys.usedMemoryPercent > 80 ? '#ef4444' : '#0ea5e9'} sub={`${sys.freeMemoryMB || 0} MB free`} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Resource bars */}
          <div style={{ ...cardStyle(t), padding: 24 }}>
            <div style={{ fontWeight: 700, color: t.text, marginBottom: 20, fontSize: 15 }}>⚙️ Resource Usage</div>
            <Bar label="Memory (System)" value={sys.usedMemoryPercent || 0} color="#0ea5e9" />
            <Bar label="Heap (Process)" value={proc.heapTotalMB ? Math.round((proc.heapUsedMB / proc.heapTotalMB) * 100) : 0} color="#8b5cf6" />
            <Bar label="Request Error Rate" value={reqs.total ? Math.round((reqs.errors / reqs.total) * 100) : 0} color="#ef4444" />
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${t.border}` }}>
              <div style={{ color: t.textSub, fontSize: 13 }}>CPU Cores: <b style={{ color: t.text }}>{sys.cpuCount || '—'}</b></div>
              <div style={{ color: t.textSub, fontSize: 13, marginTop: 4 }}>Platform: <b style={{ color: t.text }}>{sys.platform || '—'}</b></div>
              <div style={{ color: t.textSub, fontSize: 13, marginTop: 4 }}>Load Avg: <b style={{ color: t.text }}>{sys.loadAvg?.map(n => n.toFixed(2)).join(', ') || '—'}</b></div>
            </div>
          </div>

          {/* Top routes */}
          <div style={{ ...cardStyle(t), padding: 24 }}>
            <div style={{ fontWeight: 700, color: t.text, marginBottom: 20, fontSize: 15 }}>🔥 Top API Routes</div>
            {reqs.topRoutes?.length ? reqs.topRoutes.map((r, i) => (
              <div key={r.route} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0ea5e9', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                <code style={{ fontSize: 12, color: t.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.route}</code>
                <span style={{ fontWeight: 700, color: '#0ea5e9', fontSize: 13 }}>{r.count}</span>
              </div>
            )) : <div style={{ color: t.textSub, fontSize: 14 }}>No requests recorded yet.</div>}
          </div>
        </div>

        {/* Process info */}
        <div style={{ ...cardStyle(t), padding: 24, marginTop: 20 }}>
          <div style={{ fontWeight: 700, color: t.text, marginBottom: 16, fontSize: 15 }}>🖥️ Process Info</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              ['PID', proc.pid],
              ['RSS Memory', `${proc.rssMemoryMB || 0} MB`],
              ['Heap Total', `${proc.heapTotalMB || 0} MB`],
              ['Uptime', proc.uptimeSeconds ? uptimeFmt(proc.uptimeSeconds) : '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ background: darkMode ? '#1e293b' : '#f8fafc', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ color: t.textSub, fontSize: 12 }}>{label}</div>
                <div style={{ color: t.text, fontWeight: 700, fontSize: 16, marginTop: 4 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
