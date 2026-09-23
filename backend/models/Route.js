const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  startPoint: { type: String, required: true },
  endPoint: { type: String, required: true },
  stops: [{ type: String }],
  distance: { type: Number, required: true },
  depotId: { type: mongoose.Schema.Types.Mixed, ref: 'Depot' }
}, { timestamps: true });

module.exports = mongoose.model('Route', routeSchema);
