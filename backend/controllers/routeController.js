const mongoose = require('mongoose');
const Route = require('../models/Route');
const { routes: memoryRoutes } = require('../config/memoryStore');

const isDbConnected = () => mongoose.connection.readyState === 1;

exports.getRoutes = async (req, res) => {
  try {
    if (isDbConnected()) {
      const routes = await Route.find();
      return res.json(routes);
    }
    res.json(memoryRoutes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRoute = async (req, res) => {
  try {
    if (isDbConnected()) {
      const route = await Route.findById(req.params.id);
      if (!route) return res.status(404).json({ message: 'Route not found' });
      return res.json(route);
    }
    const r = memoryRoutes.find(item => item._id === req.params.id);
    if (!r) return res.status(404).json({ message: 'Route not found' });
    res.json(r);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createRoute = async (req, res) => {
  try {
    if (isDbConnected()) {
      const route = await Route.create(req.body);
      return res.status(201).json(route);
    }
    const newRoute = {
      _id: 'route_' + Date.now(),
      ...req.body,
      createdAt: new Date()
    };
    memoryRoutes.push(newRoute);
    res.status(201).json(newRoute);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateRoute = async (req, res) => {
  try {
    if (isDbConnected()) {
      const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!route) return res.status(404).json({ message: 'Route not found' });
      return res.json(route);
    }
    const idx = memoryRoutes.findIndex(r => r._id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Route not found' });
    memoryRoutes[idx] = { ...memoryRoutes[idx], ...req.body };
    res.json(memoryRoutes[idx]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteRoute = async (req, res) => {
  try {
    if (isDbConnected()) {
      const route = await Route.findByIdAndDelete(req.params.id);
      if (!route) return res.status(404).json({ message: 'Route not found' });
      return res.json({ message: 'Route deleted' });
    }
    const idx = memoryRoutes.findIndex(r => r._id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Route not found' });
    memoryRoutes.splice(idx, 1);
    res.json({ message: 'Route deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

