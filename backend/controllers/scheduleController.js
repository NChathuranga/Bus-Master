const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const { schedules: memorySchedules, routes: memoryRoutes, vehicles: memoryVehicles, drivers: memoryDrivers } = require('../config/memoryStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

const populateScheduleMem = (s) => {
  const routeObj = typeof s.routeId === 'object' ? s.routeId : memoryRoutes.find(r => r._id === String(s.routeId)) || s.routeId;
  const vehicleObj = typeof s.vehicleId === 'object' ? s.vehicleId : memoryVehicles.find(v => v._id === String(s.vehicleId)) || s.vehicleId;
  const driverObj = typeof s.driverId === 'object' ? s.driverId : memoryDrivers.find(d => d._id === String(s.driverId)) || s.driverId;
  return {
    ...s,
    routeId: routeObj,
    vehicleId: vehicleObj,
    driverId: driverObj
  };
};

exports.getSchedules = async (req, res) => {
  try {
    const userDepotId = req.user?.depotId ? (typeof req.user.depotId === 'object' ? req.user.depotId._id : req.user.depotId) : null;
    const filterDepot = req.query.depotId || (req.user?.role === 'driver' || req.user?.role === 'depot_admin' ? userDepotId : null);

    if (isDbConnected()) {
      const schedules = await Schedule.find()
        .populate('routeId')
        .populate('vehicleId')
        .populate('driverId')
        .sort('departureTime');
      
      let filtered = schedules;
      if (filterDepot) {
        filtered = schedules.filter(s => {
          const vDepot = s.vehicleId?.depotId ? String(typeof s.vehicleId.depotId === 'object' ? s.vehicleId.depotId._id : s.vehicleId.depotId) : null;
          const rDepot = s.routeId?.depotId ? String(typeof s.routeId.depotId === 'object' ? s.routeId.depotId._id : s.routeId.depotId) : null;
          const dDepot = s.driverId?.depotId ? String(typeof s.driverId.depotId === 'object' ? s.driverId.depotId._id : s.driverId.depotId) : null;
          return vDepot === String(filterDepot) || rDepot === String(filterDepot) || dDepot === String(filterDepot);
        });
      }
      return res.json(filtered);
    }

    let populated = memorySchedules.map(populateScheduleMem);
    if (filterDepot) {
      populated = populated.filter(s => {
        const vDepot = s.vehicleId?.depotId ? String(typeof s.vehicleId.depotId === 'object' ? s.vehicleId.depotId._id : s.vehicleId.depotId) : null;
        const rDepot = s.routeId?.depotId ? String(typeof s.routeId.depotId === 'object' ? s.routeId.depotId._id : s.routeId.depotId) : null;
        const dDepot = s.driverId?.depotId ? String(typeof s.driverId.depotId === 'object' ? s.driverId.depotId._id : s.driverId.depotId) : null;
        return vDepot === String(filterDepot) || rDepot === String(filterDepot) || dDepot === String(filterDepot);
      });
    }
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSchedule = async (req, res) => {
  try {
    if (isDbConnected()) {
      const schedule = await Schedule.findById(req.params.id)
        .populate('routeId').populate('vehicleId').populate('driverId');
      if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
      return res.json(schedule);
    }
    const schedule = memorySchedules.find(s => s._id === req.params.id);
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json(populateScheduleMem(schedule));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const findConflict = async (vehicleId, driverId, departureTime, arrivalTime, excludeId = null) => {
  const query = {
    $or: [{ vehicleId }, { driverId }],
    departureTime: { $lt: arrivalTime },
    arrivalTime: { $gt: departureTime }
  };
  if (excludeId) query._id = { $ne: excludeId };
  return Schedule.findOne(query).populate('vehicleId').populate('driverId');
};

exports.createSchedule = async (req, res) => {
  try {
    const { routeId, vehicleId, driverId, departureTime, arrivalTime } = req.body;

    if (new Date(arrivalTime) <= new Date(departureTime)) {
      return res.status(400).json({ message: 'Arrival time must be after departure time' });
    }

    if (isDbConnected()) {
      const conflict = await findConflict(vehicleId, driverId, departureTime, arrivalTime);
      if (conflict) {
        return res.status(409).json({
          message: 'Time conflict: the selected vehicle or driver is already booked during this time window'
        });
      }

      const schedule = await Schedule.create({ routeId, vehicleId, driverId, departureTime, arrivalTime });
      return res.status(201).json(schedule);
    }

    // In-memory conflict detection
    const dep = new Date(departureTime);
    const arr = new Date(arrivalTime);
    const memConflict = memorySchedules.find(s => {
      const sVid = typeof s.vehicleId === 'object' ? s.vehicleId._id : s.vehicleId;
      const sDid = typeof s.driverId === 'object' ? s.driverId._id : s.driverId;
      const sDep = new Date(s.departureTime);
      const sArr = new Date(s.arrivalTime);
      return (String(sVid) === String(vehicleId) || String(sDid) === String(driverId))
        && sDep < arr && sArr > dep;
    });
    if (memConflict) {
      return res.status(409).json({
        message: 'Time conflict: the selected vehicle or driver is already booked during this time window'
      });
    }

    const newSchedule = {
      _id: 'sched_' + Date.now(),
      routeId,
      vehicleId,
      driverId,
      departureTime: dep,
      arrivalTime: arr,
      status: req.body.status || 'on time',
      notes: req.body.notes || '',
      createdAt: new Date()
    };
    memorySchedules.push(newSchedule);
    res.status(201).json(populateScheduleMem(newSchedule));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    if (isDbConnected()) {
      const existing = await Schedule.findById(req.params.id);
      if (!existing) return res.status(404).json({ message: 'Schedule not found' });

      const vehicleId = req.body.vehicleId || existing.vehicleId;
      const driverId = req.body.driverId || existing.driverId;
      const departureTime = req.body.departureTime || existing.departureTime;
      const arrivalTime = req.body.arrivalTime || existing.arrivalTime;

      if (new Date(arrivalTime) <= new Date(departureTime)) {
        return res.status(400).json({ message: 'Arrival time must be after departure time' });
      }

      const conflict = await findConflict(vehicleId, driverId, departureTime, arrivalTime, req.params.id);
      if (conflict) {
        return res.status(409).json({
          message: 'Time conflict: the selected vehicle or driver is already booked during this time window'
        });
      }

      const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      return res.json(schedule);
    }

    const idx = memorySchedules.findIndex(s => s._id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Schedule not found' });

    // In-memory conflict detection for updates
    const existing = memorySchedules[idx];
    const updVehicleId = req.body.vehicleId || (typeof existing.vehicleId === 'object' ? existing.vehicleId._id : existing.vehicleId);
    const updDriverId = req.body.driverId || (typeof existing.driverId === 'object' ? existing.driverId._id : existing.driverId);
    const updDep = new Date(req.body.departureTime || existing.departureTime);
    const updArr = new Date(req.body.arrivalTime || existing.arrivalTime);

    if (updArr <= updDep) {
      return res.status(400).json({ message: 'Arrival time must be after departure time' });
    }

    const memConflict = memorySchedules.find((s, i) => {
      if (i === idx) return false;
      const sVid = typeof s.vehicleId === 'object' ? s.vehicleId._id : s.vehicleId;
      const sDid = typeof s.driverId === 'object' ? s.driverId._id : s.driverId;
      const sDep = new Date(s.departureTime);
      const sArr = new Date(s.arrivalTime);
      return (String(sVid) === String(updVehicleId) || String(sDid) === String(updDriverId))
        && sDep < updArr && sArr > updDep;
    });
    if (memConflict) {
      return res.status(409).json({
        message: 'Time conflict: the selected vehicle or driver is already booked during this time window'
      });
    }

    memorySchedules[idx] = { ...memorySchedules[idx], ...req.body };
    res.json(populateScheduleMem(memorySchedules[idx]));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    if (isDbConnected()) {
      const schedule = await Schedule.findByIdAndDelete(req.params.id);
      if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
      return res.json({ message: 'Schedule deleted' });
    }
    const idx = memorySchedules.findIndex(s => s._id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Schedule not found' });
    memorySchedules.splice(idx, 1);
    res.json({ message: 'Schedule deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

