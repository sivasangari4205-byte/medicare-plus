import React from 'react';
import { getTheme } from '../../utils/theme';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 600, darkMode }) => {
  const t = getTheme(darkMode);
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: t.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div style={{ background: t.card, borderRadius: 24, padding: 32, maxWidth, width: '100%', maxHeight: '92vh', overflowY: 'auto', position: 'relative', animation: 'scaleIn .25s ease-out' }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14, color: t.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        {title && <h2 style={{ color: t.text, fontSize: 20, fontWeight: 800, marginBottom: 24, paddingRight: 40 }}>{title}</h2>}
        {children}
      </div>
    </div>
  );
};

export const StatCard = ({ icon, label, value, color = '#0891b2', sub, darkMode, onClick }) => {
  const t = getTheme(darkMode);
  return (
    <div onClick={onClick} className={onClick ? 'card-hover' : ''} style={{ background: t.card, borderRadius: 18, padding: '22px 24px', border: `1px solid ${t.cardBorder}`, boxShadow: t.shadow, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 48, height: 48, background: color + '18', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
        <span style={{ fontSize: 30, fontWeight: 900, color }}>{value}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: t.textSub, marginTop: 4 }}>{sub}</div>}
    </div>
  );
};

export const Badge = ({ children, color = '#0891b2', bg }) => (
  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: bg || color + '18', color, whiteSpace: 'nowrap', display: 'inline-block' }}>
    {children}
  </span>
);

export const Spinner = ({ size = 36 }) => (
  <div style={{ width: size, height: size, border: `3px solid rgba(8,145,178,0.2)`, borderTop: '3px solid #0891b2', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto' }} />
);

export const PageLoader = ({ darkMode }) => {
  const t = getTheme(darkMode);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <Spinner size={48} />
      <p style={{ color: t.textSub, fontSize: 14 }}>Loading...</p>
    </div>
  );
};

export const EmptyState = ({ icon = '📭', title, desc, action, darkMode }) => {
  const t = getTheme(darkMode);
  return (
    <div style={{ textAlign: 'center', padding: '56px 24px' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ color: t.text, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
      {desc && <p style={{ color: t.textSub, fontSize: 14 }}>{desc}</p>}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
};

export const PageHeader = ({ title, subtitle, action, darkMode }) => {
  const t = getTheme(darkMode);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 'clamp(1.4rem,3vw,1.9rem)', fontWeight: 800, color: t.text, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ color: t.textSub, marginTop: 6, fontSize: 14 }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const StatusBadge = ({ status, darkMode }) => {
  const t = getTheme(darkMode);
  const colorMap = t.statusColors;
  const bgMap = t.statusBg;
  return <Badge color={colorMap[status] || t.textSub} bg={bgMap[status]}>{status?.toUpperCase()}</Badge>;
};

export const Btn = ({ children, onClick, variant = 'primary', disabled, style: extra, size = 'md' }) => {
  const pad = size === 'sm' ? '7px 14px' : size === 'lg' ? '14px 32px' : '10px 22px';
  const fs = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;
  const bg = variant === 'primary' ? 'linear-gradient(135deg,#0891b2,#06b6d4)' :
             variant === 'success' ? 'linear-gradient(135deg,#059669,#0d9488)' :
             variant === 'danger'  ? 'rgba(239,68,68,0.12)' :
             variant === 'ghost'   ? 'rgba(0,0,0,0.06)' :
             variant === 'purple'  ? 'linear-gradient(135deg,#8b5cf6,#7c3aed)' : 'transparent';
  const color = ['primary','success','purple'].includes(variant) ? 'white' : variant === 'danger' ? '#ef4444' : '#374151';
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: bg, color, border: 'none', borderRadius: 10, padding: pad, fontSize: fs, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, transition: 'all .15s', ...extra }}>
      {children}
    </button>
  );
};
