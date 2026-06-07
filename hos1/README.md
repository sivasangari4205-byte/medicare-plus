# 🏥 MediCare+ — Enterprise Hospital Management & Telemedicine Platform

> Full-stack MERN application with React Router, MongoDB, Socket.IO, JWT auth, role-based access, and real-time medicine order tracking.

---

## 🚀 Quick Start (3 commands)

```bash
# 1. Start backend
cd backend && npm install && node server.js

# 2. Start frontend (new terminal)
cd frontend && npm install && npm start

# 3. Open browser
# http://localhost:3000
```

---

## 🔐 Demo Accounts

| Role         | Email                     | Password    |
|--------------|---------------------------|-------------|
| 👑 Admin      | admin@medicare.com        | admin123    |
| 👨‍⚕️ Doctor    | doctor@medicare.com       | doctor123   |
| 🧑 Patient    | patient@medicare.com      | patient123  |
| 💊 Pharmacy   | pharmacy@medicare.com     | pharma123   |

Additional doctors:
- doctor2@medicare.com / doctor456 — Dr. Raj Patel (Neurologist)
- doctor3@medicare.com / doctor789 — Dr. Priya Sharma (Dermatologist)

---

## ✅ All Features Implemented

### Architecture
- ✅ MERN Stack (MongoDB + Express + React + Node.js)
- ✅ React Router v6 (full page navigation, no single-page scroll)
- ✅ Socket.IO real-time events
- ✅ Docker + docker-compose
- ✅ GitHub Actions CI/CD pipeline
- ✅ NGINX reverse proxy config
- ✅ Swagger API docs at `/api-docs`

### 4 User Roles
- ✅ **Patient** — Book appointments, find doctors, order medicines, lab reports, video call, health analytics
- ✅ **Doctor** — View appointments, write prescriptions, review lab reports, video call, patient list
- ✅ **Admin** — Full dashboard, user management, doctor management, all appointments, analytics with charts, orders view
- ✅ **Pharmacist** — Receive medicine orders from patients, update status (pending → confirmed → processing → shipped → delivered), inventory management

### Medicine Order Flow (Cross-Dashboard)
1. Patient orders medicines from `/patient/medicines`
2. Order appears instantly in Pharmacy dashboard via Socket.IO
3. Pharmacist confirms → processes → ships → delivers
4. Patient sees real-time status updates on their orders page

### Security
- ✅ JWT authentication
- ✅ RBAC (role-based access control) — protected routes per role
- ✅ Rate limiting (express-rate-limit)
- ✅ Helmet.js security headers
- ✅ bcrypt password hashing (12 rounds)
- ✅ CORS configured

### Features
- ✅ Video consultation (WebRTC via browser API)
- ✅ AI symptom checker (rule-based intelligent responses)
- ✅ Emergency ambulance tracker with progress bar
- ✅ Prescription generation + HTML download
- ✅ Lab report upload (base64), doctor review
- ✅ Health analytics charts (recharts)
- ✅ Dark / light mode toggle (persists in localStorage)
- ✅ Real-time notifications via Socket.IO
- ✅ Pharmacy inventory management with reorder alerts

---

## 📁 Project Structure

```
medicare-v2/
├── backend/
│   ├── server.js           # Main Express server
│   ├── models/             # MongoDB models
│   ├── config/db.js        # MongoDB connection
│   ├── middleware/auth.js  # JWT middleware
│   ├── utils/logger.js     # Winston logger
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.js           # React Router setup
│   │   ├── context/AuthContext.js
│   │   ├── pages/
│   │   │   ├── auth/        # Landing, Login, Register
│   │   │   ├── patient/     # 7 pages
│   │   │   ├── doctor/      # 5 pages
│   │   │   ├── admin/       # 6 pages
│   │   │   └── pharmacy/    # 3 pages
│   │   ├── components/
│   │   │   ├── layout/Navbar.js
│   │   │   └── common/UI.js
│   │   └── utils/
│   │       ├── api.js
│   │       └── theme.js
│   └── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── .github/workflows/ci.yml
```

---

## 🐳 Docker Deployment

```bash
docker-compose up --build
```

---

## 📡 API Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | Public | Register user |
| POST | /api/auth/login | Public | Login |
| GET | /api/doctors | Auth | List doctors |
| GET | /api/appointments/my | Patient | My appointments |
| GET | /api/appointments/doctor | Doctor | Doctor's appointments |
| POST | /api/appointments | Patient | Book appointment |
| PATCH | /api/appointments/:id/prescription | Doctor | Add prescription |
| POST | /api/orders | Patient | Place medicine order |
| GET | /api/orders/all | Pharmacist/Admin | All orders |
| PATCH | /api/orders/:id/status | Pharmacist/Admin | Update order status |
| POST | /api/lab-reports | Patient | Upload lab report |
| PATCH | /api/lab-reports/:id/review | Doctor | Review lab report |
| GET | /api/admin/stats | Admin | Dashboard stats |

Full Swagger docs: `http://localhost:5000/api-docs`

---

## ⚠️ MongoDB Note

The backend runs in **dual mode**:
- **With MongoDB**: Set `MONGODB_URI` in `.env` — full persistence
- **Without MongoDB**: Auto-falls back to in-memory store with pre-seeded demo data

All features work in both modes.
