const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialization: { type: String, required: true },
  experience: { type: String, required: true },
  qualification: { type: String, required: true },
  licenseNumber: { type: String, default: '' },
  consultationFee: { type: Number, default: 500 },
  rating: { type: Number, default: 4.5, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  available: { type: Boolean, default: true },
  availableSlots: [{
    day: String,
    slots: [String]
  }],
  bio: { type: String, default: '' },
  hospital: { type: String, default: 'MediCare+ Hospital' },
  languages: [{ type: String }],
  verified: { type: Boolean, default: false },
}, { timestamps: true });

doctorSchema.virtual('name', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('Doctor', doctorSchema);
