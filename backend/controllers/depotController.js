const Depot = require('../models/Depot');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const memoryStore = require('../config/memoryStore');

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

// Helper to auto-purge depots inactive for more than 10 days
const cleanupExpiredDepots = async () => {
  const tenDaysAgo = new Date(Date.now() - TEN_DAYS_MS);

  if (mongoose.connection.readyState === 1) {
    try {
      await Depot.deleteMany({
        status: 'inactive',
        inactivatedAt: { $lte: tenDaysAgo }
      });
    } catch (err) {
      console.error('Error auto-cleaning expired depots:', err);
    }
  }

  if (memoryStore.depots) {
    memoryStore.depots = memoryStore.depots.filter(d => {
      if (d.status === 'inactive' && d.inactivatedAt) {
        const inactiveTime = new Date(d.inactivatedAt).getTime();
        if (Date.now() - inactiveTime >= TEN_DAYS_MS) {
          return false; // Permanent delete after 10 days
        }
      }
      return true;
    });
  }
};

// @desc    Get all depots
// @route   GET /api/depots
// @access  Protected
const getDepots = async (req, res) => {
  try {
    await cleanupExpiredDepots();
    if (mongoose.connection.readyState !== 1) {
      return res.json(memoryStore.depots || []);
    }
    const depots = await Depot.find().sort({ createdAt: -1 });
    res.json(depots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new depot (Super Admin only)
// @route   POST /api/depots
// @access  Protected (Super Admin)
const createDepot = async (req, res) => {
  try {
    const { name, code, city, location, contactNumber, capacity, adminUsername, adminPassword, adminName } = req.body;

    if (adminUsername && adminPassword) {
      if (mongoose.connection.readyState === 1) {
        const existingUser = await User.findOne({ username: adminUsername });
        if (existingUser) {
          return res.status(400).json({ message: `Username '${adminUsername}' already exists. Please use a unique username.` });
        }
      } else {
        const existingUser = (memoryStore.users || []).find(u => u.username.toLowerCase() === adminUsername.toLowerCase());
        if (existingUser) {
          return res.status(400).json({ message: `Username '${adminUsername}' already exists. Please use a unique username.` });
        }
      }
    }

    if (mongoose.connection.readyState !== 1) {
      const newDepot = {
        _id: 'depot_' + Date.now(),
        name,
        code: code.toUpperCase(),
        city,
        location,
        contactNumber,
        capacity: Number(capacity) || 50,
        status: 'active',
        inactivatedAt: null,
        createdAt: new Date()
      };
      if (!memoryStore.depots) memoryStore.depots = [];
      memoryStore.depots.unshift(newDepot);

      let createdUser = null;
      if (adminUsername && adminPassword) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        createdUser = {
          _id: 'user_depot_' + Date.now(),
          username: adminUsername,
          password: hashedPassword,
          role: 'depot_admin',
          depotId: newDepot._id,
          name: adminName || `${name} Manager`,
          createdAt: new Date()
        };
        if (!memoryStore.users) memoryStore.users = [];
        memoryStore.users.push(createdUser);
      }

      return res.status(201).json({
        ...newDepot,
        adminUser: createdUser ? { username: createdUser.username, role: createdUser.role } : null
      });
    }

    const depot = new Depot({
      name,
      code,
      city,
      location,
      contactNumber,
      capacity: Number(capacity) || 50
    });

    const createdDepot = await depot.save();

    let createdUser = null;
    if (adminUsername && adminPassword) {
      createdUser = await User.create({
        username: adminUsername,
        password: adminPassword,
        role: 'depot_admin',
        depotId: createdDepot._id,
        name: adminName || `${name} Manager`
      });
    }

    res.status(201).json({
      ...createdDepot.toObject(),
      adminUser: createdUser ? { username: createdUser.username, role: createdUser.role } : null
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update depot
// @route   PUT /api/depots/:id
// @access  Protected (Super Admin)
const updateDepot = async (req, res) => {
  try {
    const { status } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const index = (memoryStore.depots || []).findIndex(d => d._id === req.params.id);
      if (index !== -1) {
        let inactivatedAt = memoryStore.depots[index].inactivatedAt;
        if (status === 'active') {
          inactivatedAt = null;
        } else if (status === 'inactive' && !inactivatedAt) {
          inactivatedAt = new Date();
        }
        memoryStore.depots[index] = { 
          ...memoryStore.depots[index], 
          ...req.body,
          inactivatedAt
        };
        return res.json(memoryStore.depots[index]);
      }
      return res.status(404).json({ message: 'Depot not found' });
    }

    const depot = await Depot.findById(req.params.id);
    if (depot) {
      depot.name = req.body.name || depot.name;
      depot.code = req.body.code || depot.code;
      depot.city = req.body.city || depot.city;
      depot.location = req.body.location || depot.location;
      depot.contactNumber = req.body.contactNumber || depot.contactNumber;
      depot.capacity = req.body.capacity !== undefined ? Number(req.body.capacity) : depot.capacity;
      
      if (status) {
        depot.status = status;
        if (status === 'active') {
          depot.inactivatedAt = null;
        } else if (status === 'inactive' && !depot.inactivatedAt) {
          depot.inactivatedAt = new Date();
        }
      }

      const updatedDepot = await depot.save();
      res.json(updatedDepot);
    } else {
      res.status(404).json({ message: 'Depot not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Soft delete depot (Inactivate for 10 days, Super Admin only)
// @route   DELETE /api/depots/:id
// @access  Protected (Super Admin)
const deleteDepot = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      if (!memoryStore.depots) memoryStore.depots = [];
      const index = memoryStore.depots.findIndex(d => d._id === req.params.id);
      if (index !== -1) {
        memoryStore.depots[index].status = 'inactive';
        memoryStore.depots[index].inactivatedAt = new Date();
        return res.json({ 
          message: 'Depot set to inactive and scheduled for permanent deletion in 10 days',
          depot: memoryStore.depots[index]
        });
      }
      return res.status(404).json({ message: 'Depot not found' });
    }

    const depot = await Depot.findById(req.params.id);
    if (depot) {
      depot.status = 'inactive';
      depot.inactivatedAt = new Date();
      await depot.save();
      res.json({ 
        message: 'Depot set to inactive and scheduled for permanent deletion in 10 days',
        depot 
      });
    } else {
      res.status(404).json({ message: 'Depot not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Restore inactive depot back to active
// @route   PUT /api/depots/:id/restore
// @access  Protected (Super Admin)
const restoreDepot = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const index = (memoryStore.depots || []).findIndex(d => d._id === req.params.id);
      if (index !== -1) {
        memoryStore.depots[index].status = 'active';
        memoryStore.depots[index].inactivatedAt = null;
        return res.json(memoryStore.depots[index]);
      }
      return res.status(404).json({ message: 'Depot not found' });
    }

    const depot = await Depot.findById(req.params.id);
    if (depot) {
      depot.status = 'active';
      depot.inactivatedAt = null;
      const restoredDepot = await depot.save();
      res.json(restoredDepot);
    } else {
      res.status(404).json({ message: 'Depot not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getDepots,
  createDepot,
  updateDepot,
  deleteDepot,
  restoreDepot,
  cleanupExpiredDepots
};
