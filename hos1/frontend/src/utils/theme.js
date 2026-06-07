export const getTheme = (dark) => ({
  bg: dark ? '#0f172a' : '#f0f4f8',
  bgSecondary: dark ? '#1e293b' : '#ffffff',
  bgTertiary: dark ? '#0f172a' : '#f8fafc',
  card: dark ? '#1e293b' : '#ffffff',
  cardBorder: dark ? '#334155' : '#e2e8f0',
  text: dark ? '#f8fafc' : '#0f172a',
  textSub: dark ? '#94a3b8' : '#64748b',
  textMuted: dark ? '#64748b' : '#94a3b8',
  inputBg: dark ? '#0f172a' : '#f8fafc',
  inputBorder: dark ? '#334155' : '#e2e8f0',
  shadow: dark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.07)',
  shadowLg: dark ? '0 20px 48px rgba(0,0,0,0.5)' : '0 20px 48px rgba(0,0,0,0.1)',
  overlay: 'rgba(0,0,0,0.65)',
  // Brand
  primary: '#0891b2',
  primaryDark: '#0e7490',
  primaryLight: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  // Status
  statusColors: {
    confirmed: '#0891b2', pending: '#f59e0b',
    completed: '#10b981', cancelled: '#ef4444',
    processing: '#8b5cf6', shipped: '#0d9488', delivered: '#10b981',
  },
  statusBg: {
    confirmed: 'rgba(8,145,178,0.1)', pending: 'rgba(245,158,11,0.1)',
    completed: 'rgba(16,185,129,0.1)', cancelled: 'rgba(239,68,68,0.1)',
    processing: 'rgba(139,92,246,0.1)', shipped: 'rgba(13,148,136,0.1)', delivered: 'rgba(16,185,129,0.1)',
  },
});

export const cardStyle = (t, extra = {}) => ({
  background: t.card,
  borderRadius: 20,
  border: `1px solid ${t.cardBorder}`,
  boxShadow: t.shadow,
  ...extra,
});

export const inputStyle = (t, extra = {}) => ({
  width: '100%',
  padding: '12px 16px',
  borderRadius: 10,
  border: `1px solid ${t.inputBorder}`,
  background: t.inputBg,
  color: t.text,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color .2s',
  ...extra,
});

export const btnPrimary = (extra = {}) => ({
  background: 'linear-gradient(135deg,#0891b2,#06b6d4)',
  color: 'white',
  border: 'none',
  borderRadius: 12,
  padding: '12px 28px',
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'opacity .18s, transform .18s',
  ...extra,
});
