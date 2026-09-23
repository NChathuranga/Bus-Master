const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  routeId: { type: mongoose.Schema.Types.Mixed, ref: 'Route', required: true },
  vehicleId: { type: mongoose.Schema.Types.Mixed, ref: 'Vehicle', required: true },
  driverId: { type: mongoose.Schema.Types.Mixed, ref: 'Driver', required: true },
  departureTime: { type: Date, required: true },
  arrivalTime: { type: Date, required: true },
  status: { type: String, enum: ['scheduled', 'on time', 'delayed', 'completed', 'cancelled'], default: 'on time' },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);


