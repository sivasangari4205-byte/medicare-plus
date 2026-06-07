const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, required: true },
  role: { type: String, enum: ['patient', 'doctor', 'admin', 'pharmacist'], default: 'patient' },
  avatar: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  refreshToken: { type: String, default: '' },
  lastLogin: { type: Date },
  // Patient fields
  dateOfBirth: { type: Date },
  bloodGroup: { type: String },
  address: { type: String },
  emergencyContact: { type: String },
  allergies: [String],
  chronicConditions: [String],
  // Health analytics
  healthMetrics: [{
    date: { type: Date, default: Date.now },
    weight: Number,
    bloodPressure: String,
    bloodSugar: Number,
    heartRate: Number,
  }],
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
