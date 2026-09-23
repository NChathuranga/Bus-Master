const mongoose = require('mongoose');
const Driver = require('../models/Driver');
const Depot = require('../models/Depot');
const { drivers: memoryDrivers, routes: memoryRoutes } = require('../config/memoryStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

exports.getDrivers = async (req, res) => {
  try {
    if (isDbConnected()) {
      const drivers = await Driver.find().populate('assignedRoute').populate('depotId');
      return res.json(drivers);
    }
    const populated = memoryDrivers.map(d => ({
      ...d,
      assignedRoute: memoryRoutes.find(r => r._id === d.assignedRoute) || null
    }));
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDriver = async (req, res) => {
  try {
    if (isDbConnected()) {
      const driver = await Driver.findById(req.params.id).populate('assignedRoute').populate('depotId');
      if (!driver) return res.status(404).json({ message: 'Driver not found' });
      return res.json(driver);
    }
    const driver = memoryDrivers.find(d => d._id === req.params.id);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    const populated = {
      ...driver,
      assignedRoute: memoryRoutes.find(r => r._id === driver.assignedRoute) || null
    };
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createDriver = async (req, res) => {
  try {
    if (isDbConnected()) {
      const { name, licenseNumber, contact, licenseExpiry, workingHours, status, depotId, assignedRoute } = req.body;
      
      const payload = {
        name,
        licenseNumber,
        contact,
        licenseExpiry,
        workingHours: Number(workingHours) || 40,
        status: status || 'active'
      };

      if (depotId && mongoose.Types.ObjectId.isValid(depotId)) {
        payload.depotId = depotId;
      } else {
        const firstDepot = await Depot.findOne();
        if (firstDepot) payload.depotId = firstDepot._id;
      }

      if (assignedRoute && mongoose.Types.ObjectId.isValid(assignedRoute)) {
        payload.assignedRoute = assignedRoute;
      }

      const driver = await Driver.create(payload);
      const populated = await Driver.findById(driver._id).populate('assignedRoute').populate('depotId');
      return res.status(201).json(populated);
    }
    const newDriver = {
      _id: 'driver_' + Date.now(),
      ...req.body,
      status: req.body.status || 'active',
      createdAt: new Date()
    };
    memoryDrivers.push(newDriver);
    res.status(201).json(newDriver);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateDriver = async (req, res) => {
  try {
    if (isDbConnected()) {
      const { name, licenseNumber, contact, licenseExpiry, workingHours, status, depotId, assignedRoute } = req.body;
      
      const payload = {};
      if (name !== undefined) payload.name = name;
      if (licenseNumber !== undefined) payload.licenseNumber = licenseNumber;
      if (contact !== undefined) payload.contact = contact;
      if (licenseExpiry !== undefined) payload.licenseExpiry = licenseExpiry;
      if (workingHours !== undefined) payload.workingHours = Number(workingHours);
      if (status !== undefined) payload.status = status;

      if (depotId) {
        if (mongoose.Types.ObjectId.isValid(depotId)) {
          payload.depotId = depotId;
        } else {
          const firstDepot = await Depot.findOne();
          if (firstDepot) payload.depotId = firstDepot._id;
        }
      }

      if (assignedRoute !== undefined) {
        if (assignedRoute && mongoose.Types.ObjectId.isValid(assignedRoute)) {
          payload.assignedRoute = assignedRoute;
        } else {
          payload.assignedRoute = null;
        }
      }

      const driver = await Driver.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true })
        .populate('assignedRoute')
        .populate('depotId');

      if (!driver) return res.status(404).json({ message: 'Driver not found' });
      return res.json(driver);
    }
    const idx = memoryDrivers.findIndex(d => d._id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Driver not found' });
    memoryDrivers[idx] = { ...memoryDrivers[idx], ...req.body };
    res.json(memoryDrivers[idx]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteDriver = async (req, res) => {
  try {
    if (isDbConnected()) {
      const driver = await Driver.findByIdAndDelete(req.params.id);
      if (!driver) return res.status(404).json({ message: 'Driver not found' });
      return res.json({ message: 'Driver deleted' });
    }
    const idx = memoryDrivers.findIndex(d => d._id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Driver not found' });
    memoryDrivers.splice(idx, 1);
    res.json({ message: 'Driver deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


