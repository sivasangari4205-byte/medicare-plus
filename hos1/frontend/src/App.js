import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import { getTheme } from './utils/theme';

// Auth pages
import Landing from './pages/auth/Landing';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Patient pages
import PatientHome from './pages/patient/PatientHome';
import PatientAppointments from './pages/patient/PatientAppointments';
import FindDoctors from './pages/patient/FindDoctors';
import Medicines from './pages/patient/Medicines';
import PatientLabReports from './pages/patient/PatientLabReports';
import PatientVideoCall from './pages/patient/PatientVideoCall';
import PatientHealth from './pages/patient/PatientHealth';
import PaymentPage from './pages/patient/PaymentPage';

// Doctor pages
import DoctorHome from './pages/doctor/DoctorHome';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorLabReports from './pages/doctor/DoctorLabReports';
import DoctorVideoCall from './pages/doctor/DoctorVideoCall';

// Admin pages
import AdminHome from './pages/admin/AdminHome';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDoctors from './pages/admin/AdminDoctors';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminOrders from './pages/admin/AdminOrders';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import MonitoringDashboard from './pages/admin/MonitoringDashboard';

// Pharmacy pages
import PharmacyHome from './pages/pharmacy/PharmacyHome';
import PharmacyOrders from './pages/pharmacy/PharmacyOrders';
import PharmacyInventory from './pages/pharmacy/PharmacyInventory';

// Notification toast
import NotificationToast from './components/common/NotificationToast';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role === 'pharmacist' ? 'pharmacy' : user.role}`} replace />;
  return children;
};

const AppContent = () => {
  const { darkMode } = useAuth();
  const t = getTheme(darkMode);

  return (
    <div style={{ background: t.bg, minHeight: '100vh', transition: 'background .3s' }}>
      <Navbar />
      <NotificationToast />
      <main>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login/:role" element={<LoginPage />} />
          <Route path="/register/:role" element={<RegisterPage />} />

          {/* Patient */}
          <Route path="/patient" element={<PrivateRoute roles={['patient']}><PatientHome /></PrivateRoute>} />
          <Route path="/patient/appointments" element={<PrivateRoute roles={['patient']}><PatientAppointments /></PrivateRoute>} />
          <Route path="/patient/doctors" element={<PrivateRoute roles={['patient']}><FindDoctors /></PrivateRoute>} />
          <Route path="/patient/medicines" element={<PrivateRoute roles={['patient']}><Medicines /></PrivateRoute>} />
          <Route path="/patient/lab-reports" element={<PrivateRoute roles={['patient']}><PatientLabReports /></PrivateRoute>} />
          <Route path="/patient/video-call" element={<PrivateRoute roles={['patient']}><PatientVideoCall /></PrivateRoute>} />
          <Route path="/patient/health" element={<PrivateRoute roles={['patient']}><PatientHealth /></PrivateRoute>} />
          <Route path="/patient/payment" element={<PrivateRoute roles={['patient']}><PaymentPage /></PrivateRoute>} />

          {/* Doctor */}
          <Route path="/doctor" element={<PrivateRoute roles={['doctor']}><DoctorHome /></PrivateRoute>} />
          <Route path="/doctor/appointments" element={<PrivateRoute roles={['doctor']}><DoctorAppointments /></PrivateRoute>} />
          <Route path="/doctor/patients" element={<PrivateRoute roles={['doctor']}><DoctorPatients /></PrivateRoute>} />
          <Route path="/doctor/lab-reports" element={<PrivateRoute roles={['doctor']}><DoctorLabReports /></PrivateRoute>} />
          <Route path="/doctor/video-call" element={<PrivateRoute roles={['doctor']}><DoctorVideoCall /></PrivateRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminHome /></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute roles={['admin']}><AdminUsers /></PrivateRoute>} />
          <Route path="/admin/doctors" element={<PrivateRoute roles={['admin']}><AdminDoctors /></PrivateRoute>} />
          <Route path="/admin/appointments" element={<PrivateRoute roles={['admin']}><AdminAppointments /></PrivateRoute>} />
          <Route path="/admin/orders" element={<PrivateRoute roles={['admin']}><AdminOrders /></PrivateRoute>} />
          <Route path="/admin/analytics" element={<PrivateRoute roles={['admin']}><AdminAnalytics /></PrivateRoute>} />
          <Route path="/admin/monitoring" element={<PrivateRoute roles={['admin']}><MonitoringDashboard /></PrivateRoute>} />

          {/* Pharmacy */}
          <Route path="/pharmacy" element={<PrivateRoute roles={['pharmacist','admin']}><PharmacyHome /></PrivateRoute>} />
          <Route path="/pharmacy/orders" element={<PrivateRoute roles={['pharmacist','admin']}><PharmacyOrders /></PrivateRoute>} />
          <Route path="/pharmacy/inventory" element={<PrivateRoute roles={['pharmacist','admin']}><PharmacyInventory /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
