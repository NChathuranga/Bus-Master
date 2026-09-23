const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  contact: { type: String, required: true },
  licenseExpiry: { type: Date, required: true },
  assignedRoute: { type: mongoose.Schema.Types.Mixed, ref: 'Route', default: null },
  depotId: { type: mongoose.Schema.Types.Mixed, ref: 'Depot' },
  userId: { type: mongoose.Schema.Types.Mixed, ref: 'User' },
  workingHours: { type: Number, default: 40 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);



