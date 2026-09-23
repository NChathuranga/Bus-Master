const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const { vehicles: memoryVehicles } = require('../config/memoryStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

exports.getVehicles = async (req, res) => {
  try {
    const userDepotId = req.user?.depotId ? (typeof req.user.depotId === 'object' ? req.user.depotId._id : req.user.depotId) : null;
    const filterDepot = req.query.depotId || (req.user?.role === 'driver' || req.user?.role === 'depot_admin' ? userDepotId : null);

    if (isDbConnected()) {
      const query = filterDepot ? { depotId: filterDepot } : {};
      const vehicles = await Vehicle.find(query);
      return res.json(vehicles);
    }
    let result = memoryVehicles;
    if (filterDepot) {
      result = result.filter(v => String(v.depotId) === String(filterDepot));
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getVehicle = async (req, res) => {
  try {
    if (isDbConnected()) {
      const vehicle = await Vehicle.findById(req.params.id);
      if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
      return res.json(vehicle);
    }
    const v = memoryVehicles.find(item => item._id === req.params.id);
    if (!v) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(v);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createVehicle = async (req, res) => {
  try {
    if (isDbConnected()) {
      const vehicle = await Vehicle.create(req.body);
      return res.status(201).json(vehicle);
    }
    const newVehicle = {
      _id: 'veh_' + Date.now(),
      ...req.body,
      status: req.body.status || 'available',
      createdAt: new Date()
    };
    memoryVehicles.push(newVehicle);
    res.status(201).json(newVehicle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    if (isDbConnected()) {
      const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
      return res.json(vehicle);
    }
    const idx = memoryVehicles.findIndex(v => v._id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Vehicle not found' });
    memoryVehicles[idx] = { ...memoryVehicles[idx], ...req.body };
    res.json(memoryVehicles[idx]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    if (isDbConnected()) {
      const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
      if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
      return res.json({ message: 'Vehicle deleted' });
    }
    const idx = memoryVehicles.findIndex(v => v._id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Vehicle not found' });
    memoryVehicles.splice(idx, 1);
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

