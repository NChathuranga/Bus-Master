const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  vehicleId: { type: mongoose.Schema.Types.Mixed, ref: 'Vehicle', required: true },
  serviceType: { type: String },
  type: { type: String },
  cost: { type: Number, default: 0 },
  notes: { type: String },
  description: { type: String },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'completed' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

maintenanceSchema.pre('save', function (next) {
  if (!this.serviceType && this.type) this.serviceType = this.type;
  if (!this.type && this.serviceType) this.type = this.serviceType;
  if (!this.notes && this.description) this.notes = this.description;
  if (!this.description && this.notes) this.description = this.notes;
  next();
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);

