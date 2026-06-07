import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';

axios.defaults.baseURL = 'http://localhost:5000';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    try { return JSON.parse(localStorage.getItem('darkMode')) || false; } catch { return false; }
  });
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Apply dark mode to body
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    document.documentElement.style.background = darkMode ? '#0f172a' : '#f0f4f8';
    document.body.style.background = darkMode ? '#0f172a' : '#f0f4f8';
  }, [darkMode]);

  // Init socket
  useEffect(() => {
    const s = io('http://localhost:5000', { transports: ['websocket','polling'] });
    setSocket(s);
    s.on('new_appointment', (data) => addNotification('📅 New appointment booked!', 'info'));
    s.on('prescription_added', (data) => addNotification('💊 Prescription added to your appointment', 'success'));
    s.on('new_order', (data) => addNotification('📦 New medicine order received', 'info'));
    s.on('order_updated', (data) => addNotification(`📦 Order status: ${data.status}`, 'success'));
    s.on('new_lab_report', (data) => addNotification('🔬 New lab report uploaded', 'info'));
    return () => s.disconnect();
  }, []);

  const addNotification = (message, type) => {
    const id = Date.now();
    setNotifications(prev => [{ id, message, type }, ...prev.slice(0, 9)]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  // Restore session
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      const parsed = JSON.parse(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(parsed);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const { token, refreshToken, user } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken || '');
    localStorage.setItem('user', JSON.stringify(user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    // Route based on role
    if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'doctor') navigate('/doctor');
    else if (user.role === 'pharmacist') navigate('/pharmacy');
    else navigate('/patient');
    return user;
  };

  const register = async (data) => {
    const res = await axios.post('/api/auth/register', data);
    const { token, refreshToken, user } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken || '');
    localStorage.setItem('user', JSON.stringify(user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    if (user.role === 'doctor') navigate('/doctor');
    else navigate('/patient');
    return user;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    navigate('/');
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, darkMode, setDarkMode, socket, notifications, addNotification }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
