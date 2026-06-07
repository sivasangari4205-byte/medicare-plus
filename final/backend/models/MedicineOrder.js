const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  medicineId: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  category: { type: String },
  requiresPrescription: { type: Boolean, default: false },
});

const medicineOrderSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientName: { type: String },
  patientPhone: { type: String },
  patientAddress: { type: String },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  paymentId: { type: String, default: '' },
  prescriptionId: { type: String, default: '' },
  deliveryAddress: { type: String, required: true },
  deliveryNotes: { type: String, default: '' },
  estimatedDelivery: { type: Date },
  assignedPharmacist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  trackingNumber: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('MedicineOrder', medicineOrderSchema);
