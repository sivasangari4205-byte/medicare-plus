const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ['clinic', 'video'], default: 'clinic' },
  symptoms: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'confirmed' },
  prescription: { type: String, default: '' },
  prescriptionDate: { type: Date },
  notes: { type: String, default: '' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  paymentId: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  videoRoomId: { type: String, default: '' },
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
