const mongoose = require('mongoose');
const Maintenance = require('../models/Maintenance');
const { maintenanceLogs: memoryMaintenance, vehicles: memoryVehicles } = require('../config/memoryStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

exports.getMaintenanceRecords = async (req, res) => {
  try {
    if (isDbConnected()) {
      const records = await Maintenance.find().populate('vehicleId').sort('-date');
      return res.json(records);
    }
    const populated = memoryMaintenance.map(m => ({
      ...m,
      vehicleId: memoryVehicles.find(v => v._id === String(m.vehicleId)) || m.vehicleId
    }));
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createMaintenanceRecord = async (req, res) => {
  try {
    if (isDbConnected()) {
      const record = await Maintenance.create(req.body);
      return res.status(201).json(record);
    }
    const newRecord = {
      _id: 'maint_' + Date.now(),
      ...req.body,
      date: req.body.date ? new Date(req.body.date).toISOString() : new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    memoryMaintenance.push(newRecord);
    res.status(201).json(newRecord);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateMaintenanceRecord = async (req, res) => {
  try {
    if (isDbConnected()) {
      const record = await Maintenance.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!record) return res.status(404).json({ message: 'Maintenance record not found' });
      return res.json(record);
    }
    const idx = memoryMaintenance.findIndex(m => m._id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Maintenance record not found' });
    memoryMaintenance[idx] = { ...memoryMaintenance[idx], ...req.body };
    res.json(memoryMaintenance[idx]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteMaintenanceRecord = async (req, res) => {
  try {
    if (isDbConnected()) {
      const record = await Maintenance.findByIdAndDelete(req.params.id);
      if (!record) return res.status(404).json({ message: 'Maintenance record not found' });
      return res.json({ message: 'Maintenance record deleted' });
    }
    const idx = memoryMaintenance.findIndex(m => m._id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Maintenance record not found' });
    memoryMaintenance.splice(idx, 1);
    res.json({ message: 'Maintenance record deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

