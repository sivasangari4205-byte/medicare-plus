import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function NotificationToast() {
  const { notifications, darkMode } = useAuth();
  return (
    <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {notifications.map(n => (
        <div key={n.id} className="animate-fadeInUp" style={{ background: darkMode ? '#1e293b' : 'white', border: `1px solid ${n.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(8,145,178,0.3)'}`, borderLeft: `4px solid ${n.type === 'success' ? '#10b981' : '#0891b2'}`, borderRadius: 12, padding: '12px 16px', fontSize: 13, fontWeight: 600, color: darkMode ? '#f8fafc' : '#0f172a', boxShadow: '0 8px 24px rgba(0,0,0,.12)', maxWidth: 300, animation: 'fadeInUp .3s ease-out' }}>
          {n.message}
        </div>
      ))}
    </div>
  );
}
