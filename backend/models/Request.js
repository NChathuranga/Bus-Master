const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  requestType: { type: String, enum: ['fuel', 'maintenance'], required: true },
  depotId: { type: mongoose.Schema.Types.Mixed, ref: 'Depot', required: true },
  requestedBy: { type: mongoose.Schema.Types.Mixed, ref: 'User', required: true },
  requestedByName: { type: String, required: true },
  requestedByRole: { type: String, required: true },
  vehicleId: { type: mongoose.Schema.Types.Mixed, ref: 'Vehicle', required: true },
  vehicleReg: { type: String, required: true },
  details: {
    liters: { type: Number, default: 0 },
    serviceType: { type: String, default: '' },
    description: { type: String, default: '' },
    estimatedCost: { type: Number, default: 0 }
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.Mixed, ref: 'User' },
  approvedByName: { type: String },
  actionNotes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);

