const mongoose = require('mongoose');
const FuelLog = require('../models/FuelLog');
const { fuelLogs: memoryFuelLogs, vehicles: memoryVehicles } = require('../config/memoryStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

exports.getFuelLogs = async (req, res) => {
  try {
    if (isDbConnected()) {
      const logs = await FuelLog.find().populate('vehicleId').sort('-date');
      return res.json(logs);
    }
    const populated = memoryFuelLogs.map(l => ({
      ...l,
      vehicleId: memoryVehicles.find(v => v._id === String(l.vehicleId)) || l.vehicleId
    }));
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createFuelLog = async (req, res) => {
  try {
    if (isDbConnected()) {
      const log = await FuelLog.create(req.body);
      return res.status(201).json(log);
    }
    const newLog = {
      _id: 'fuel_' + Date.now(),
      ...req.body,
      date: req.body.date ? new Date(req.body.date).toISOString() : new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    memoryFuelLogs.push(newLog);
    res.status(201).json(newLog);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateFuelLog = async (req, res) => {
  try {
    if (isDbConnected()) {
      const log = await FuelLog.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!log) return res.status(404).json({ message: 'Fuel log not found' });
      return res.json(log);
    }
    const idx = memoryFuelLogs.findIndex(l => l._id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Fuel log not found' });
    memoryFuelLogs[idx] = { ...memoryFuelLogs[idx], ...req.body };
    res.json(memoryFuelLogs[idx]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteFuelLog = async (req, res) => {
  try {
    if (isDbConnected()) {
      const log = await FuelLog.findByIdAndDelete(req.params.id);
      if (!log) return res.status(404).json({ message: 'Fuel log not found' });
      return res.json({ message: 'Fuel log deleted' });
    }
    const idx = memoryFuelLogs.findIndex(l => l._id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Fuel log not found' });
    memoryFuelLogs.splice(idx, 1);
    res.json({ message: 'Fuel log deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

