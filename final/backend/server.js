require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const connectDB = require('./config/db');

// ─── Services ─────────────────────────────────────────────────────────────────
const { generateTokens } = require('./services/authService');
const { encrypt, decrypt } = require('./utils/encryption');
const {
  encryptAppointment, decryptAppointment,
  encryptLabReport,   decryptLabReport,
  encryptUserSensitive, decryptUserSensitive,
  decryptList,
} = require('./middleware/encryptedFields');
const { router: authRouter, init: initAuth } = require('./routes/authRoutes');
const { router: paymentRouter, init: initPayment } = require('./routes/paymentRoutes');
const { router: webrtcRouter, init: initWebRTC } = require('./routes/webrtcRoutes');
const { router: metricsRouter, countRequests } = require('./routes/metricsRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, message: { error: 'Too many requests' } });
app.use('/api/', limiter);



// ─── Models ───────────────────────────────────────────────────────────────────
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');
const MedicineOrder = require('./models/MedicineOrder');
const LabReport = require('./models/LabReport');

// ─── Auth Middleware ──────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
};
const adminAuth = (req, res, next) => auth(req, res, () => req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admin only' }));
const doctorAuth = (req, res, next) => auth(req, res, () => ['doctor','admin'].includes(req.user.role) ? next() : res.status(403).json({ error: 'Doctor only' }));
const pharmacistAuth = (req, res, next) => auth(req, res, () => ['pharmacist','admin'].includes(req.user.role) ? next() : res.status(403).json({ error: 'Pharmacist only' }));

// ─── Swagger ──────────────────────────────────────────────────────────────────
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = swaggerJsdoc({
  definition: { openapi: '3.0.0', info: { title: 'MediCare+ API', version: '2.0.0', description: 'Enterprise Hospital Management API' }, servers: [{ url: 'http://localhost:5000' }] },
  apis: ['./server.js'],
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customCss: '.swagger-ui .topbar { display: none }', customSiteTitle: 'MediCare+ API Docs' }));

// ─── Request Metrics Counter ──────────────────────────────────────────────────
app.use(countRequests);

// ─── In-Memory Fallback Store ─────────────────────────────────────────────────
let useMongo = false;
let memStore = { users: [], doctors: [], appointments: [], orders: [], labReports: [], nextId: 1 };

const getId = () => String(memStore.nextId++);

// ─── Seed Data ────────────────────────────────────────────────────────────────
const seedMongo = async () => {
  const count = await User.countDocuments();
  if (count > 0) return;

  const adminUser = await User.create({ name: 'Super Admin', email: 'admin@medicare.com', password: 'admin123', phone: '9000000000', role: 'admin' });
  const pharmUser = await User.create({ name: 'PharmaCare Store', email: 'pharmacy@medicare.com', password: 'pharma123', phone: '9000000001', role: 'pharmacist' });

  const d1User = await User.create({ name: 'Dr. Sarah Johnson', email: 'doctor@medicare.com', password: 'doctor123', phone: '9876543210', role: 'doctor' });
  const d2User = await User.create({ name: 'Dr. Raj Patel', email: 'doctor2@medicare.com', password: 'doctor456', phone: '9876543211', role: 'doctor' });
  const d3User = await User.create({ name: 'Dr. Priya Sharma', email: 'doctor3@medicare.com', password: 'doctor789', phone: '9876543212', role: 'doctor' });

  const doc1 = await Doctor.create({ userId: d1User._id, specialization: 'Cardiologist', experience: '10 years', qualification: 'MD, FACC', consultationFee: 800, rating: 4.8, available: true, hospital: 'MediCare+ Heart Institute', verified: true });
  const doc2 = await Doctor.create({ userId: d2User._id, specialization: 'Neurologist', experience: '8 years', qualification: 'MD, DM Neurology', consultationFee: 900, rating: 4.6, available: true, hospital: 'MediCare+ Brain Center', verified: true });
  const doc3 = await Doctor.create({ userId: d3User._id, specialization: 'Dermatologist', experience: '6 years', qualification: 'MD Dermatology', consultationFee: 600, rating: 4.7, available: true, hospital: 'MediCare+ Skin Clinic', verified: true });

  const patUser = await User.create({ name: 'John Doe', email: 'patient@medicare.com', password: 'patient123', phone: '1234567890', role: 'patient', bloodGroup: 'O+', address: 'Chennai, Tamil Nadu' });

  const tomorrow = new Date(Date.now() + 86400000);
  const nextWeek = new Date(Date.now() + 7 * 86400000);

  // Seed with encrypted symptoms
  const enc1 = encryptAppointment({ symptoms: 'Chest pain and shortness of breath' });
  const enc2 = encryptAppointment({ symptoms: 'Persistent headache' });
  await Appointment.create({ patientId: patUser._id, doctorId: doc1._id, date: tomorrow, type: 'video', symptoms: enc1.symptoms, status: 'confirmed', amount: 800 });
  await Appointment.create({ patientId: patUser._id, doctorId: doc2._id, date: nextWeek, type: 'clinic', symptoms: enc2.symptoms, status: 'pending', amount: 900 });

  console.log('✅ MongoDB seeded with demo data');
};

const seedMemory = async () => {
  const hashPwd = async (p) => bcrypt.hash(p, 10);
  const users = memStore.users;
  const doctors = memStore.doctors;

  const admin = { _id: getId(), id: null, name: 'Super Admin', email: 'admin@medicare.com', password: await hashPwd('admin123'), phone: '9000000000', role: 'admin', isActive: true, createdAt: new Date() };
  admin.id = admin._id;
  const pharma = { _id: getId(), id: null, name: 'PharmaCare Store', email: 'pharmacy@medicare.com', password: await hashPwd('pharma123'), phone: '9000000001', role: 'pharmacist', isActive: true, createdAt: new Date() };
  pharma.id = pharma._id;
  const d1u = { _id: getId(), id: null, name: 'Dr. Sarah Johnson', email: 'doctor@medicare.com', password: await hashPwd('doctor123'), phone: '9876543210', role: 'doctor', isActive: true, createdAt: new Date() };
  d1u.id = d1u._id;
  const d2u = { _id: getId(), id: null, name: 'Dr. Raj Patel', email: 'doctor2@medicare.com', password: await hashPwd('doctor456'), phone: '9876543211', role: 'doctor', isActive: true, createdAt: new Date() };
  d2u.id = d2u._id;
  const d3u = { _id: getId(), id: null, name: 'Dr. Priya Sharma', email: 'doctor3@medicare.com', password: await hashPwd('doctor789'), phone: '9876543212', role: 'doctor', isActive: true, createdAt: new Date() };
  d3u.id = d3u._id;
  const pat = { _id: getId(), id: null, name: 'John Doe', email: 'patient@medicare.com', password: await hashPwd('patient123'), phone: '1234567890', role: 'patient', bloodGroup: 'O+', address: 'Chennai, Tamil Nadu', isActive: true, createdAt: new Date() };
  pat.id = pat._id;
  users.push(admin, pharma, d1u, d2u, d3u, pat);

  const doc1 = { _id: getId(), userId: d1u._id, specialization: 'Cardiologist', experience: '10 years', qualification: 'MD, FACC', consultationFee: 800, rating: 4.8, available: true, hospital: 'MediCare+ Heart Institute', verified: true };
  const doc2 = { _id: getId(), userId: d2u._id, specialization: 'Neurologist', experience: '8 years', qualification: 'MD, DM Neurology', consultationFee: 900, rating: 4.6, available: true, hospital: 'MediCare+ Brain Center', verified: true };
  const doc3 = { _id: getId(), userId: d3u._id, specialization: 'Dermatologist', experience: '6 years', qualification: 'MD Dermatology', consultationFee: 600, rating: 4.7, available: true, hospital: 'MediCare+ Skin Clinic', verified: true };
  doctors.push(doc1, doc2, doc3);

  const tomorrow = new Date(Date.now() + 86400000);
  const nextWeek = new Date(Date.now() + 7 * 86400000);
  const encS1 = encryptAppointment({ symptoms: 'Chest pain and shortness of breath' });
  const encS2 = encryptAppointment({ symptoms: 'Persistent headache' });
  memStore.appointments.push(
    { _id: getId(), patientId: pat._id, doctorId: doc1._id, date: tomorrow, type: 'video', symptoms: encS1.symptoms, status: 'confirmed', amount: 800, prescription: '', createdAt: new Date() },
    { _id: getId(), patientId: pat._id, doctorId: doc2._id, date: nextWeek, type: 'clinic', symptoms: encS2.symptoms, status: 'pending', amount: 900, prescription: '', createdAt: new Date() }
  );

  memStore.orders.push({
    _id: getId(), patientId: pat._id, patientName: pat.name, patientPhone: pat.phone,
    items: [{ medicineId: '1', name: 'Paracetamol 500mg', quantity: 2, price: 25, category: 'Pain Relief' }],
    totalAmount: 50, status: 'pending', paymentStatus: 'pending', deliveryAddress: 'Chennai, Tamil Nadu', createdAt: new Date()
  });
  console.log('✅ In-memory store seeded');
};

// ─── Helper: populate appointment (memory) ───────────────────────────────────
const populateAppointmentMem = (apt) => {
  const patient = memStore.users.find(u => u._id === apt.patientId);
  const doctor = memStore.doctors.find(d => d._id === apt.doctorId);
  const doctorUser = doctor ? memStore.users.find(u => u._id === doctor.userId) : null;
  return {
    ...apt,
    patientId: patient ? { _id: patient._id, name: patient.name, email: patient.email, phone: patient.phone, bloodGroup: patient.bloodGroup } : { _id: apt.patientId, name: 'Patient' },
    doctorId: doctor ? { _id: doctor._id, userId: { _id: doctorUser?._id, name: doctorUser?.name }, specialization: doctor.specialization, consultationFee: doctor.consultationFee, hospital: doctor.hospital } : { _id: apt.doctorId },
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, specialization, experience, qualification, consultationFee } = req.body;
    if (!name || !email || !password || !phone) return res.status(400).json({ error: 'All fields required' });

    if (useMongo) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ error: 'Email already registered' });
      const user = await User.create({ name, email, password, phone, role: role || 'patient' });
      if (role === 'doctor') {
        await Doctor.create({ userId: user._id, specialization: specialization || 'General', experience: experience || '1 year', qualification: qualification || 'MBBS', consultationFee: consultationFee || 500 });
      }
      const token = jwt.sign({ id: user._id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
      return res.status(201).json({ success: true, token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone } });
    } else {
      if (memStore.users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already registered' });
      const hashed = await bcrypt.hash(password, 12);
      const id = getId();
      const newUser = { _id: id, name, email, password: hashed, phone, role: role || 'patient', isActive: true, createdAt: new Date() };
      memStore.users.push(newUser);
      if (role === 'doctor') {
        const did = getId();
        memStore.doctors.push({ _id: did, userId: id, specialization: specialization || 'General', experience: experience || '1 year', qualification: qualification || 'MBBS', consultationFee: consultationFee || 500, rating: 4.5, available: true, hospital: 'MediCare+ Hospital', verified: false });
      }
      const token = jwt.sign({ id: id, email, role: role || 'patient', name }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
      return res.status(201).json({ success: true, token, user: { _id: id, name, email, role: role || 'patient', phone } });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    if (useMongo) {
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.matchPassword(password))) return res.status(401).json({ error: 'Invalid credentials' });
      if (!user.isActive) return res.status(403).json({ error: 'Account deactivated' });
      user.lastLogin = new Date();
      const tokens = generateTokens({ id: user._id, email: user.email, role: user.role, name: user.name });
      user.refreshToken = tokens.refreshToken;
      await user.save();
      return res.json({ success: true, token: tokens.accessToken, refreshToken: tokens.refreshToken, user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone } });
    } else {
      const user = memStore.users.find(u => u.email === email);
      if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid credentials' });
      if (!user.isActive) return res.status(403).json({ error: 'Account deactivated' });
      const tokens = generateTokens({ id: user._id, email: user.email, role: user.role, name: user.name });
      user.refreshToken = tokens.refreshToken;
      return res.json({ success: true, token: tokens.accessToken, refreshToken: tokens.refreshToken, user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone } });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    if (useMongo) {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json(user);
    } else {
      const user = memStore.users.find(u => u._id === req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const { password, ...safe } = user;
      return res.json(safe);
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── DOCTOR ROUTES ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/doctors', auth, async (req, res) => {
  try {
    if (useMongo) {
      const doctors = await Doctor.find({ available: true }).populate('userId', 'name email phone');
      return res.json(doctors);
    } else {
      const list = memStore.doctors.map(d => {
        const u = memStore.users.find(u => u._id === d.userId);
        return { ...d, userId: { _id: u?._id, name: u?.name, email: u?.email, phone: u?.phone } };
      });
      return res.json(list);
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/doctors/all', adminAuth, async (req, res) => {
  try {
    if (useMongo) {
      const doctors = await Doctor.find().populate('userId', 'name email phone isActive');
      return res.json(doctors);
    } else {
      const list = memStore.doctors.map(d => {
        const u = memStore.users.find(u => u._id === d.userId);
        const appts = memStore.appointments.filter(a => a.doctorId === d._id);
        return { ...d, userId: { _id: u?._id, name: u?.name, email: u?.email, phone: u?.phone, isActive: u?.isActive }, appointmentCount: appts.length };
      });
      return res.json(list);
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/doctors/:id/toggle', adminAuth, async (req, res) => {
  try {
    if (useMongo) {
      const doc = await Doctor.findById(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Doctor not found' });
      doc.available = !doc.available;
      await doc.save();
      return res.json({ message: 'Toggled', available: doc.available });
    } else {
      const doc = memStore.doctors.find(d => d._id === req.params.id);
      if (!doc) return res.status(404).json({ error: 'Not found' });
      doc.available = !doc.available;
      return res.json({ message: 'Toggled', available: doc.available });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/doctors/:id/verify', adminAuth, async (req, res) => {
  try {
    if (useMongo) {
      const doc = await Doctor.findByIdAndUpdate(req.params.id, { verified: true }, { new: true });
      return res.json(doc);
    } else {
      const doc = memStore.doctors.find(d => d._id === req.params.id);
      if (doc) doc.verified = true;
      return res.json(doc);
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── APPOINTMENT ROUTES ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// Patient: get my appointments
app.get('/api/appointments/my', auth, async (req, res) => {
  try {
    if (useMongo) {
      const apts = await Appointment.find({ patientId: req.user.id })
        .sort({ date: -1 })
        .populate('patientId', 'name email phone bloodGroup')
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email phone' } });
      return res.json(decryptList(apts, decryptAppointment));
    } else {
      const apts = memStore.appointments
        .filter(a => a.patientId === req.user.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.json(apts.map(a => decryptAppointment(populateAppointmentMem(a))));
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Doctor: get my appointments
app.get('/api/appointments/doctor', auth, async (req, res) => {
  try {
    if (useMongo) {
      const doctor = await Doctor.findOne({ userId: req.user.id });
      if (!doctor) return res.json([]);
      const apts = await Appointment.find({ doctorId: doctor._id })
        .sort({ date: -1 })
        .populate('patientId', 'name email phone bloodGroup address')
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } });
      return res.json(decryptList(apts, decryptAppointment));
    } else {
      const doctor = memStore.doctors.find(d => d.userId === req.user.id);
      if (!doctor) return res.json([]);
      const apts = memStore.appointments
        .filter(a => a.doctorId === doctor._id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.json(apts.map(a => decryptAppointment(populateAppointmentMem(a))));
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Book appointment
app.post('/api/appointments', auth, async (req, res) => {
  try {
    const { doctorId, date, symptoms, type } = req.body;
    if (!doctorId || !date) return res.status(400).json({ error: 'Doctor and date required' });

    if (useMongo) {
      const doctor = await Doctor.findById(doctorId).populate('userId', 'name');
      if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
      const encryptedApt = encryptAppointment({ symptoms: symptoms || '' });
      const apt = await Appointment.create({
        patientId: req.user.id, doctorId, date: new Date(date),
        symptoms: encryptedApt.symptoms, type: type || 'clinic',
        amount: doctor.consultationFee, status: 'confirmed'
      });
      const populated = await Appointment.findById(apt._id)
        .populate('patientId', 'name email phone')
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } });
      io.emit('new_appointment', { doctorUserId: doctor.userId._id, appointment: decryptAppointment(populated) });
      return res.status(201).json(decryptAppointment(populated));
    } else {
      const doctor = memStore.doctors.find(d => d._id === doctorId);
      if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
      const id = getId();
      const encApt = encryptAppointment({ symptoms: symptoms || '' });
      const apt = { _id: id, patientId: req.user.id, doctorId, date: new Date(date), symptoms: encApt.symptoms, type: type || 'clinic', status: 'confirmed', amount: doctor.consultationFee, prescription: '', createdAt: new Date() };
      memStore.appointments.push(apt);
      const populated = decryptAppointment(populateAppointmentMem(apt));
      io.emit('new_appointment', { doctorUserId: doctor.userId, appointment: populated });
      return res.status(201).json(populated);
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add prescription  ← BUG FIXED: removed duplicate dead code
app.patch('/api/appointments/:id/prescription', auth, async (req, res) => {
  try {
    const { prescription } = req.body;
    if (useMongo) {
      const enc = encryptAppointment({ prescription });
      const apt = await Appointment.findByIdAndUpdate(
        req.params.id,
        { prescription: enc.prescription, status: 'completed', prescriptionDate: new Date() },
        { new: true }
      )
        .populate('patientId', 'name email phone')
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });
      if (!apt) return res.status(404).json({ error: 'Not found' });
      const decrypted = decryptAppointment(apt);
      io.emit('prescription_added', { patientId: apt.patientId._id, appointment: decrypted });
      return res.json(decrypted);
    } else {
      const apt = memStore.appointments.find(a => a._id === req.params.id);
      if (!apt) return res.status(404).json({ error: 'Not found' });
      const enc = encryptAppointment({ prescription });
      apt.prescription = enc.prescription;
      apt.status = 'completed';
      apt.prescriptionDate = new Date();
      const populated = decryptAppointment(populateAppointmentMem(apt));
      io.emit('prescription_added', { patientId: apt.patientId, appointment: populated });
      return res.json(populated);
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update status
app.patch('/api/appointments/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (useMongo) {
      const apt = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true });
      return res.json(apt);
    } else {
      const apt = memStore.appointments.find(a => a._id === req.params.id);
      if (!apt) return res.status(404).json({ error: 'Not found' });
      apt.status = status;
      return res.json(populateAppointmentMem(apt));
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Cancel
app.delete('/api/appointments/:id', auth, async (req, res) => {
  try {
    if (useMongo) {
      await Appointment.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
    } else {
      const apt = memStore.appointments.find(a => a._id === req.params.id);
      if (apt) apt.status = 'cancelled';
    }
    res.json({ message: 'Appointment cancelled' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// All appointments (admin) — decrypt for admin view too
app.get('/api/appointments/all', adminAuth, async (req, res) => {
  try {
    if (useMongo) {
      const apts = await Appointment.find()
        .sort({ createdAt: -1 })
        .populate('patientId', 'name email phone')
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });
      return res.json(decryptList(apts, decryptAppointment));
    } else {
      return res.json(
        memStore.appointments
          .map(a => decryptAppointment(populateAppointmentMem(a)))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      );
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MEDICINE ORDER ROUTES ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// Patient: place order
app.post('/api/orders', auth, async (req, res) => {
  try {
    const { items, deliveryAddress, deliveryNotes } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'No items in order' });
    const totalAmount = items.reduce((s, i) => s + (i.price * i.quantity), 0);

    if (useMongo) {
      const patient = await User.findById(req.user.id).select('name phone');
      const order = await MedicineOrder.create({ patientId: req.user.id, patientName: patient.name, patientPhone: patient.phone, items, totalAmount, deliveryAddress, deliveryNotes: deliveryNotes || '', estimatedDelivery: new Date(Date.now() + 2 * 86400000) });
      io.emit('new_order', { order });
      return res.status(201).json(order);
    } else {
      const patient = memStore.users.find(u => u._id === req.user.id);
      const id = getId();
      const order = { _id: id, patientId: req.user.id, patientName: patient?.name, patientPhone: patient?.phone, items, totalAmount, status: 'pending', paymentStatus: 'pending', deliveryAddress, deliveryNotes: deliveryNotes || '', estimatedDelivery: new Date(Date.now() + 2 * 86400000), createdAt: new Date() };
      memStore.orders.push(order);
      io.emit('new_order', { order });
      return res.status(201).json(order);
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Patient: my orders
app.get('/api/orders/my', auth, async (req, res) => {
  try {
    if (useMongo) {
      const orders = await MedicineOrder.find({ patientId: req.user.id }).sort({ createdAt: -1 });
      return res.json(orders);
    } else {
      return res.json(memStore.orders.filter(o => o.patientId === req.user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Pharmacist/Admin: all orders
app.get('/api/orders/all', auth, async (req, res) => {
  try {
    if (!['pharmacist', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
    if (useMongo) {
      const orders = await MedicineOrder.find().sort({ createdAt: -1 }).populate('patientId', 'name phone email');
      return res.json(orders);
    } else {
      return res.json(memStore.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update order status
app.patch('/api/orders/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pharmacist', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
    if (useMongo) {
      const order = await MedicineOrder.findByIdAndUpdate(req.params.id, { status }, { new: true });
      if (!order) return res.status(404).json({ error: 'Not found' });
      io.emit('order_updated', { orderId: order._id, status, patientId: order.patientId });
      return res.json(order);
    } else {
      const order = memStore.orders.find(o => o._id === req.params.id);
      if (!order) return res.status(404).json({ error: 'Not found' });
      order.status = status;
      io.emit('order_updated', { orderId: order._id, status, patientId: order.patientId });
      return res.json(order);
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── LAB REPORT ROUTES ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/lab-reports', auth, async (req, res) => {
  try {
    const { title, testType, fileData, fileName, fileType } = req.body;
    if (useMongo) {
      const patient = await User.findById(req.user.id).select('name');
      const encReport = encryptLabReport({ fileData, doctorNotes: '' });
      const report = await LabReport.create({ patientId: req.user.id, patientName: patient.name, title, testType, fileData: encReport.fileData, fileName, fileType });
      io.emit('new_lab_report', { report });
      return res.status(201).json(report);
    } else {
      const patient = memStore.users.find(u => u._id === req.user.id);
      const id = getId();
      const report = { _id: id, patientId: req.user.id, patientName: patient?.name, title, testType, fileData, fileName, fileType, status: 'pending', doctorNotes: '', createdAt: new Date() };
      memStore.labReports.push(report);
      io.emit('new_lab_report', { report });
      return res.status(201).json(report);
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/lab-reports/my', auth, async (req, res) => {
  try {
    if (useMongo) {
      const myReports = await LabReport.find({ patientId: req.user.id }).sort({ createdAt: -1 });
      return res.json(decryptList(myReports, decryptLabReport));
    } else {
      return res.json(memStore.labReports.filter(r => r.patientId === req.user.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/lab-reports/all', auth, async (req, res) => {
  try {
    if (!['doctor', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
    if (useMongo) {
      const reports = await LabReport.find().sort({ createdAt: -1 });
      return res.json(decryptList(reports, decryptLabReport));
    } else {
      return res.json(memStore.labReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/lab-reports/:id/review', auth, async (req, res) => {
  try {
    const { doctorNotes } = req.body;
    if (useMongo) {
      const encNotes = encryptLabReport({ doctorNotes });
      const report = await LabReport.findByIdAndUpdate(
        req.params.id,
        { status: 'reviewed', doctorNotes: encNotes.doctorNotes, reviewedBy: req.user.id, reviewedAt: new Date() },
        { new: true }
      );
      return res.json(decryptLabReport(report));
    } else {
      const report = memStore.labReports.find(r => r._id === req.params.id);
      if (report) { report.status = 'reviewed'; report.doctorNotes = doctorNotes; report.reviewedAt = new Date(); }
      return res.json(report);
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    if (useMongo) {
      const [totalPatients, totalDoctors, totalAppointments, completedA, cancelledA, pendingOrders, totalOrders] = await Promise.all([
        User.countDocuments({ role: 'patient' }),
        Doctor.countDocuments(),
        Appointment.countDocuments(),
        Appointment.countDocuments({ status: 'completed' }),
        Appointment.countDocuments({ status: 'cancelled' }),
        MedicineOrder.countDocuments({ status: { $in: ['pending', 'confirmed', 'processing'] } }),
        MedicineOrder.countDocuments(),
      ]);
      const revenue = await Appointment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayApts = await Appointment.countDocuments({ createdAt: { $gte: today } });
      return res.json({ totalPatients, totalDoctors, totalAppointments, completedAppointments: completedA, cancelledAppointments: cancelledA, pendingOrders, totalOrders, revenue: revenue[0]?.total || 0, todayAppointments: todayApts });
    } else {
      const { users, doctors, appointments, orders } = memStore;
      return res.json({
        totalPatients: users.filter(u => u.role === 'patient').length,
        totalDoctors: doctors.length,
        totalAppointments: appointments.length,
        completedAppointments: appointments.filter(a => a.status === 'completed').length,
        cancelledAppointments: appointments.filter(a => a.status === 'cancelled').length,
        pendingOrders: orders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length,
        totalOrders: orders.length,
        revenue: appointments.filter(a => a.status === 'completed').reduce((s, a) => s + (a.amount || 0), 0),
        todayAppointments: appointments.filter(a => new Date(a.createdAt).toDateString() === new Date().toDateString()).length,
      });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    if (useMongo) {
      return res.json(await User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 }));
    } else {
      return res.json(memStore.users.filter(u => u.role !== 'admin').map(({ password, ...u }) => u));
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/admin/users/:id/toggle', adminAuth, async (req, res) => {
  try {
    if (useMongo) {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      user.isActive = !user.isActive;
      await user.save();
      return res.json({ message: 'Toggled', isActive: user.isActive });
    } else {
      const user = memStore.users.find(u => u._id === req.params.id);
      if (!user) return res.status(404).json({ error: 'Not found' });
      user.isActive = !user.isActive;
      return res.json({ message: 'Toggled', isActive: user.isActive });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/users/:id', adminAuth, async (req, res) => {
  try {
    if (useMongo) {
      await User.findByIdAndDelete(req.params.id);
    } else {
      memStore.users = memStore.users.filter(u => u._id !== req.params.id);
    }
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// paste this BEFORE the mount routers section
app.get('/test-encryption', (req, res) => {
  const { encrypt, decrypt } = require('./utils/encryption');
  const { encryptAppointment } = require('./middleware/encryptedFields');

  const original = 'Chest pain test';
  const encrypted = encrypt(original);
  const decrypted = decrypt(encrypted);
  const apt = encryptAppointment({ symptoms: 'headache test' });

  res.json({
    step1_encrypt_works: encrypted !== original,
    step2_decrypt_works: decrypted === original,
    step3_encryptAppointment_works: apt.symptoms !== 'headache test',
    encrypted_value: encrypted,
    appointment_result: apt,
  });
});
// ─── Mount Routers ────────────────────────────────────────────────────────────
initAuth({ User, memStore, useMongo: () => useMongo, getId });
app.use('/api/auth', authRouter);

initPayment({ Appointment, MedicineOrder, User, memStore, useMongo: () => useMongo, auth });
app.use('/api/payment', paymentRouter);

app.use('/api/webrtc', webrtcRouter);
app.use('/api', metricsRouter);

// ─── Socket.IO ────────────────────────────────────────────────────────────────
initWebRTC(io);
io.on('connection', (socket) => {
  socket.on('join_room', (userId) => socket.join(userId));
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`\n🚀 MediCare+ Server running on http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);

  useMongo = await connectDB();
  if (useMongo) {
    await seedMongo();
  } else {
    await seedMemory();
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Demo Accounts:');
  console.log('   👑 Admin:       admin@medicare.com   / admin123');
  console.log('   👨‍⚕️  Doctor:      doctor@medicare.com  / doctor123');
  console.log('   🧑  Patient:     patient@medicare.com / patient123');
  console.log('   💊 Pharmacy:    pharmacy@medicare.com / pharma123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});