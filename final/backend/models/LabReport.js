const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientName: { type: String },
  title: { type: String, required: true },
  testType: { type: String, required: true },
  fileData: { type: String }, // base64 or file path
  fileName: { type: String },
  fileType: { type: String },
  status: { type: String, enum: ['pending', 'reviewed'], default: 'pending' },
  doctorNotes: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  isEncrypted: { type: Boolean, default: false },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
}, { timestamps: true });

module.exports = mongoose.model('LabReport', labReportSchema);
