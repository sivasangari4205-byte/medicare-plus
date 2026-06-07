import axios from 'axios';

// ── Axios instance with automatic refresh token rotation ─────────────────────
const API = axios.create({ baseURL: '/api' });

// Attach JWT to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 → try refresh token, then retry original request once
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          orig.headers.Authorization = `Bearer ${token}`;
          return API(orig);
        }).catch(e => Promise.reject(e));
      }
      orig._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.clear();
        window.location.href = '/';
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        API.defaults.headers.common.Authorization = `Bearer ${data.token}`;
        processQueue(null, data.token);
        orig.headers.Authorization = `Bearer ${data.token}`;
        return API(orig);
      } catch (err) {
        processQueue(err, null);
        localStorage.clear();
        window.location.href = '/';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default API;

// ── Legacy named api object (keep for backward compatibility) ─────────────────
export const api = {
  auth: {
    login: (email, password) => API.post('/auth/login', { email, password }),
    register: (data) => API.post('/auth/register', data),
    me: () => API.get('/auth/me'),
    refresh: (refreshToken) => API.post('/auth/refresh', { refreshToken }),
    logout: (refreshToken) => API.post('/auth/logout', { refreshToken }),
  },
  doctors: {
    getAll: () => API.get('/doctors'),
    getAllAdmin: () => API.get('/doctors/all'),
    toggle: (id) => API.patch(`/doctors/${id}/toggle`),
    verify: (id) => API.patch(`/doctors/${id}/verify`),
  },
  appointments: {
    my: () => API.get('/appointments/my'),
    doctor: () => API.get('/appointments/doctor'),
    all: () => API.get('/appointments/all'),
    create: (data) => API.post('/appointments', data),
    addPrescription: (id, prescription) => API.patch(`/appointments/${id}/prescription`, { prescription }),
    updateStatus: (id, status) => API.patch(`/appointments/${id}/status`, { status }),
    cancel: (id) => API.delete(`/appointments/${id}`),
  },
  orders: {
    my: () => API.get('/orders/my'),
    all: () => API.get('/orders/all'),
    create: (data) => API.post('/orders', data),
    updateStatus: (id, status) => API.patch(`/orders/${id}/status`, { status }),
  },
  labReports: {
    my: () => API.get('/lab-reports/my'),
    all: () => API.get('/lab-reports/all'),
    upload: (data) => API.post('/lab-reports', data),
    review: (id, doctorNotes) => API.patch(`/lab-reports/${id}/review`, { doctorNotes }),
  },
  admin: {
    stats: () => API.get('/admin/stats'),
    users: () => API.get('/admin/users'),
    toggleUser: (id) => API.patch(`/admin/users/${id}/toggle`),
    deleteUser: (id) => API.delete(`/admin/users/${id}`),
  },
  payment: {
    createOrder: (data) => API.post('/payment/create-order', data),
    verify: (data) => API.post('/payment/verify', data),
    createPlan: (data) => API.post('/payment/subscription/plan', data),
    createSubscription: (data) => API.post('/payment/subscription/create', data),
    verifySubscription: (data) => API.post('/payment/subscription/verify', data),
    invoice: (appointmentId) => `/api/payment/invoice/${appointmentId}`,
  },
  metrics: {
    get: () => API.get('/metrics'),
    health: () => API.get('/health'),
  },
};
