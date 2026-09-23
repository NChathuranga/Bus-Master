const mongoose = require('mongoose');

const depotSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  city: { type: String, required: true, trim: true },
  location: { type: String, required: true },
  contactNumber: { type: String, required: true },
  capacity: { type: Number, default: 50 },
  status: { type: String, enum: ['active', 'maintenance', 'inactive'], default: 'active' },
  inactivatedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Depot', depotSchema);
