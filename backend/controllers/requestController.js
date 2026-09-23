const Request = require('../models/Request');
const Fuel = require('../models/FuelLog');
const Maintenance = require('../models/Maintenance');
const mongoose = require('mongoose');
const memoryStore = require('../config/memoryStore');


// @desc    Get all fuel and maintenance requests (filtered by depot if depot_admin)
// @route   GET /api/requests
// @access  Protected
const getRequests = async (req, res) => {
  try {
    const userDepotId = req.user?.depotId ? (typeof req.user.depotId === 'object' ? req.user.depotId._id : req.user.depotId) : null;
    const filterDepot = req.query.depotId || (req.user?.role === 'driver' || req.user?.role === 'depot_admin' ? userDepotId : null);
    const { status } = req.query;

    if (mongoose.connection.readyState !== 1) {
      let list = memoryStore.requests || [];
      if (req.user?.role === 'driver') {
        list = list.filter(r => String(r.requestedBy) === String(req.user._id) || String(r.depotId) === String(filterDepot));
      } else if (filterDepot) {
        list = list.filter(r => String(r.depotId) === String(filterDepot));
      }
      if (status) {
        list = list.filter(r => r.status === status);
      }
      return res.json(list);
    }

    let filter = {};
    if (req.user?.role === 'driver') {
      filter.$or = [{ requestedBy: req.user._id }, { depotId: filterDepot }];
    } else if (filterDepot) {
      filter.depotId = filterDepot;
    }
    if (status) filter.status = status;

    const requests = await Request.find(filter)
      .populate('depotId', 'name city code')
      .populate('vehicleId', 'registrationNumber type')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit a fuel or maintenance request (by Driver or Staff)
// @route   POST /api/requests
// @access  Protected
const createRequest = async (req, res) => {
  try {
    const { requestType, depotId, vehicleId, vehicleReg, details } = req.body;

    const newReq = {
      _id: 'req_' + Date.now(),
      requestType,
      depotId,
      requestedBy: req.user._id,
      requestedByName: req.user.username || req.user.name || 'Driver / Staff',
      requestedByRole: req.user.role || 'driver',
      vehicleId,
      vehicleReg,
      details: {
        liters: Number(details.liters) || 0,
        serviceType: details.serviceType || '',
        description: details.description || '',
        estimatedCost: Number(details.estimatedCost) || 0
      },
      status: 'pending',
      createdAt: new Date()
    };

    if (mongoose.connection.readyState !== 1) {
      if (!memoryStore.requests) memoryStore.requests = [];
      memoryStore.requests.unshift(newReq);
      return res.status(201).json(newReq);
    }

    const request = new Request({
      requestType,
      depotId,
      requestedBy: req.user._id,
      requestedByName: req.user.username || req.user.name || 'Driver / Staff',
      requestedByRole: req.user.role || 'driver',
      vehicleId,
      vehicleReg,
      details: {
        liters: Number(details.liters) || 0,
        serviceType: details.serviceType || '',
        description: details.description || '',
        estimatedCost: Number(details.estimatedCost) || 0
      },
      status: 'pending'
    });

    const savedRequest = await request.save();
    res.status(201).json(savedRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Approve or Reject a request (Super Admin & Depot Admin)
// @route   PUT /api/requests/:id/action
// @access  Protected (Super Admin / Depot Admin)
const handleRequestAction = async (req, res) => {
  try {
    const { action, actionNotes } = req.body; // action: 'approve' | 'reject'
    const statusResult = action === 'approve' ? 'approved' : 'rejected';

    if (mongoose.connection.readyState !== 1) {
      const index = (memoryStore.requests || []).findIndex(r => r._id === req.params.id);
      if (index === -1) return res.status(404).json({ message: 'Request not found' });

      const target = memoryStore.requests[index];
      target.status = statusResult;
      target.approvedBy = req.user._id;
      target.approvedByName = req.user.username || 'Admin';
      target.actionNotes = actionNotes || '';

      // If approved, automatically create actual Fuel or Maintenance log entry!
      if (action === 'approve') {
        if (target.requestType === 'fuel') {
          if (!memoryStore.fuelLogs) memoryStore.fuelLogs = [];
          memoryStore.fuelLogs.unshift({
            _id: 'fuel_' + Date.now(),
            vehicleId: target.vehicleId,
            date: new Date(),
            liters: target.details.liters,
            cost: target.details.estimatedCost,
            createdAt: new Date()
          });
        } else if (target.requestType === 'maintenance') {
          if (!memoryStore.maintenanceLogs) memoryStore.maintenanceLogs = [];
          memoryStore.maintenanceLogs.unshift({
            _id: 'maint_' + Date.now(),
            vehicleId: target.vehicleId,
            type: target.details.serviceType || 'Approved Service',
            description: target.details.description,
            cost: target.details.estimatedCost,
            status: 'in-progress',
            date: new Date(),
            createdAt: new Date()
          });
        }
      }

      return res.json(target);
    }

    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = statusResult;
    request.approvedBy = req.user._id;
    request.approvedByName = req.user.username || 'Admin';
    request.actionNotes = actionNotes || '';

    const updatedRequest = await request.save();

    // If approved, create Fuel or Maintenance record
    if (action === 'approve') {
      if (request.requestType === 'fuel') {
        await Fuel.create({
          vehicleId: request.vehicleId,
          date: new Date(),
          liters: request.details.liters,
          cost: request.details.estimatedCost
        });
      } else if (request.requestType === 'maintenance') {
        await Maintenance.create({
          vehicleId: request.vehicleId,
          type: request.details.serviceType || 'Approved Maintenance Work',
          description: request.details.description,
          cost: request.details.estimatedCost,
          status: 'in-progress',
          date: new Date()
        });
      }
    }

    res.json(updatedRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getRequests,
  createRequest,
  handleRequestAction
};
