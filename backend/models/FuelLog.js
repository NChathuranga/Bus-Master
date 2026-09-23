const mongoose = require('mongoose');

const fuelLogSchema = new mongoose.Schema({
  vehicleId: { type: mongoose.Schema.Types.Mixed, ref: 'Vehicle', required: true },
  liters: { type: Number, required: true },
  cost: { type: Number, default: 0 },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('FuelLog', fuelLogSchema);

