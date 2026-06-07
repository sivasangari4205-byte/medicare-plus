# 🏥 MediCare+ — Enterprise Hospital Management & Telemedicine Platform

**A full-stack enterprise-grade hospital management and telemedicine platform built on the MERN stack. Supports 4 user roles, real-time communication, video consultations, medicine ordering with Razorpay payments, and AES-256-GCM encrypted medical records.**

[Features](#-features) • [Demo](#-demo-accounts) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API Docs](#-api-endpoints) • [Deployment](#-deployment)

</div>

---

## 📸 Platform Overview

| Role | Dashboard Highlights |
|------|---------------------|
| 👑 **Admin** | Analytics, user management, doctor verification, all appointments & orders |
| 👨‍⚕️ **Doctor** | Appointments, prescriptions, lab report reviews, video consultations, patient list |
| 🧑 **Patient** | Book appointments, order medicines, lab reports, video call, health analytics |
| 💊 **Pharmacist** | Live order queue, inventory management, order status updates |

---

## ✨ Features

### 🔐 Security & Authentication
- JWT access tokens + refresh token rotation
- AES-256-GCM encryption for all sensitive medical data (symptoms, prescriptions, diagnoses, lab notes)
- bcrypt password hashing (12 rounds)
- Role-Based Access Control (RBAC) — 4 distinct roles
- Rate limiting, Helmet.js security headers, CORS

### 👥 User Roles & Pages

**Patient (7 pages)**
- 🏠 Dashboard with health summary
- 📅 Book & manage appointments
- 💊 Medicine store — 60+ medicines with Razorpay payment (UPI/Card/Netbanking)
- 🔬 Lab report upload & tracking
- 📹 WebRTC video consultation
- 🩺 Health analytics with vitals charts
- 🔍 Find & filter doctors

**Doctor (5 pages)**
- 🏠 Dashboard with today's schedule
- 📋 Appointments with prescription writing
- 🔬 Lab report review
- 📹 Video consultation room
- 👥 Patient list with medical history

**Admin (6 pages)**
- 📊 Analytics dashboard with Recharts
- 👥 User management (activate/deactivate)
- 👨‍⚕️ Doctor management & verification
- 📅 All appointments overview
- 📦 Medicine orders overview
- 📈 System monitoring dashboard

**Pharmacist (3 pages)**
- 🏠 Live order queue with Socket.IO alerts
- 📦 Order management (pending → confirmed → processing → shipped → delivered)
- 🏪 Inventory management with reorder alerts

### 🏥 Medical Features
- Video consultation via WebRTC (peer-to-peer, STUN servers)
- Real-time Socket.IO notifications across all roles
- Prescription generation with HTML download
- Lab report upload (base64) with doctor review workflow
- Emergency ambulance request tracker
- AI-powered symptom checker
- Health metrics tracking (weight, BP, blood sugar, heart rate)

### 💳 Payments
- Razorpay integration (UPI, Card, Netbanking, Wallets)
- Medicine order payments
- Appointment consultation fee payments
- Cash on Delivery option

### 🛠 Technical
- Dual-mode backend — MongoDB or in-memory fallback (all features work without a DB)
- Socket.IO real-time events for orders, appointments, prescriptions, notifications
- Swagger API documentation at `/api-docs`
- Docker + docker-compose ready
- GitHub Actions CI/CD pipeline
- NGINX reverse proxy configuration
- Winston structured logging
- Recharts for analytics visualizations
- Dark / Light mode with localStorage persistence

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB (optional — app works without it using in-memory store)

### 1. Clone the repository
```bash
cd medicare-plus
```

### 2. Start the Backend
```bash
cd backend
npm install
node server.js
# Server runs on http://localhost:5000
# API Docs at http://localhost:5000/api-docs
```

### 3. Start the Frontend
```bash
# Open a new terminal
cd frontend
npm install
npm start
# App runs on http://localhost:3000
```

> **No MongoDB?** No problem. The backend automatically falls back to an in-memory store with pre-seeded demo data. All features work.

---

## 🔐 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| 👑 Admin | admin@medicare.com | admin123 |
| 👨‍⚕️ Doctor | doctor@medicare.com | doctor123 |
| 👨‍⚕️ Doctor 2 | doctor2@medicare.com | doctor456 |
| 👨‍⚕️ Doctor 3 | doctor3@medicare.com | doctor789 |
| 🧑 Patient | patient@medicare.com | patient123 |
| 💊 Pharmacist | pharmacy@medicare.com | pharma123 |

---

## 🏗 Architecture

```
medicare-plus/
├── backend/
│   ├── server.js                    # Main Express + Socket.IO server
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── models/
│   │   ├── User.js                  # Patient / Doctor / Admin / Pharmacist
│   │   ├── Doctor.js                # Doctor profile & availability
│   │   ├── Appointment.js           # Appointments with encrypted fields
│   │   ├── MedicineOrder.js         # Medicine orders
│   │   └── LabReport.js             # Lab reports with encryption
│   ├── middleware/
│   │   ├── auth.js                  # JWT middleware
│   │   └── encryptedFields.js       # AES-256-GCM field-level encryption
│   ├── routes/
│   │   ├── authRoutes.js            # Refresh token, logout
│   │   ├── paymentRoutes.js         # Razorpay order creation
│   │   ├── webrtcRoutes.js          # WebRTC signaling
│   │   └── metricsRoutes.js         # System metrics
│   ├── services/
│   │   ├── authService.js           # Token generation
│   │   └── paymentService.js        # Payment processing
│   ├── utils/
│   │   ├── encryption.js            # AES-256-GCM encrypt/decrypt
│   │   └── logger.js                # Winston logger
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── payment.test.js
│   │   └── api.integration.test.js
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.js                   # React Router v6 setup
│   │   ├── context/
│   │   │   ├── AuthContext.js       # Auth state, dark mode
│   │   │   └── SocketContext.js     # Socket.IO connection
│   │   ├── components/
│   │   │   ├── layout/Navbar.js     # Role-aware navigation
│   │   │   ├── common/UI.js         # Shared UI components
│   │   │   └── common/NotificationToast.js
│   │   ├── pages/
│   │   │   ├── auth/                # Landing, Login, Register
│   │   │   ├── patient/             # 7 patient pages
│   │   │   ├── doctor/              # 5 doctor pages
│   │   │   ├── admin/               # 6 admin pages
│   │   │   └── pharmacy/            # 3 pharmacy pages
│   │   └── utils/
│   │       ├── api.js               # Axios instance + interceptors
│   │       └── theme.js             # Dark/light theme tokens
│   ├── public/
│   │   └── index.html
│   └── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── .github/
    └── workflows/
        └── ci.yml
```

---

## 🔒 Medical Data Encryption

All sensitive patient data is encrypted at rest using **AES-256-GCM** before storing in MongoDB:

| Field | Model | Encrypted |
|-------|-------|-----------|
| `symptoms` | Appointment | ✅ |
| `prescription` | Appointment | ✅ |
| `notes` | Appointment | ✅ |
| `doctorNotes` | LabReport | ✅ |
| `fileData` | LabReport | ✅ |
| `address` | User | ✅ |
| `allergies` | User | ✅ |
| `password` | User | ✅ bcrypt |

Decryption happens automatically on the API response — the frontend always receives plain text.

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login & get tokens |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| POST | `/api/auth/logout` | Public | Logout & revoke token |
| GET | `/api/auth/me` | Any | Get current user |
| GET | `/api/doctors` | Any | List available doctors |
| GET | `/api/appointments/my` | Patient | My appointments |
| GET | `/api/appointments/doctor` | Doctor | Doctor's appointments |
| POST | `/api/appointments` | Patient | Book appointment |
| PATCH | `/api/appointments/:id/prescription` | Doctor | Add prescription |
| PATCH | `/api/appointments/:id/status` | Any | Update status |
| DELETE | `/api/appointments/:id` | Patient | Cancel appointment |
| GET | `/api/appointments/all` | Admin | All appointments |
| POST | `/api/orders` | Patient | Place medicine order |
| GET | `/api/orders/my` | Patient | My orders |
| GET | `/api/orders/all` | Pharmacist/Admin | All orders |
| PATCH | `/api/orders/:id/status` | Pharmacist/Admin | Update order status |
| POST | `/api/lab-reports` | Patient | Upload lab report |
| GET | `/api/lab-reports/my` | Patient | My lab reports |
| GET | `/api/lab-reports/all` | Doctor/Admin | All lab reports |
| PATCH | `/api/lab-reports/:id/review` | Doctor | Review lab report |
| GET | `/api/admin/stats` | Admin | Dashboard statistics |
| GET | `/api/admin/users` | Admin | All users |
| POST | `/api/payment/create-order` | Any | Create Razorpay order |

> Full interactive docs at `http://localhost:5000/api-docs`

---

## 🐳 Deployment

### Docker Compose (Recommended)
```bash
docker-compose up --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
# MongoDB:  localhost:27017
```

### Environment Variables

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/medicare
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=7d
ENCRYPTION_KEY=your_32_char_encryption_key_here
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### Run Tests
```bash
cd backend
npm test                  # Unit tests
npm run test:integration  # Integration tests
npm run test:all          # All tests
```

---

## 🔄 Real-Time Events (Socket.IO)

| Event | Trigger | Receivers |
|-------|---------|-----------|
| `new_appointment` | Patient books | Doctor |
| `prescription_added` | Doctor writes prescription | Patient |
| `new_order` | Patient places order | Pharmacist, Admin |
| `order_updated` | Pharmacist updates status | Patient |
| `new_lab_report` | Patient uploads report | Doctor, Admin |

---

## 🧪 Tech Stack

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- Socket.IO (real-time)
- JWT + bcryptjs (auth)
- AES-256-GCM (encryption)
- Razorpay (payments)
- Swagger (API docs)
- Winston (logging)
- Helmet + express-rate-limit (security)
- Docker

**Frontend**
- React 18
- React Router v6
- Axios (HTTP + interceptors)
- Socket.IO Client
- Recharts (analytics)
- WebRTC (video calls)

**DevOps**
- Docker + docker-compose
- GitHub Actions CI/CD
- NGINX reverse proxy
- AWS ECS ready (task definition included)

---

## 📄 License

MIT License — feel free to use this project for learning and academic purposes.

---

<div align="center">
Built with ❤️ for the MediCare+ Enterprise Hospital Management Platform
</div>
