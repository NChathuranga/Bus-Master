const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const { users: memoryUsers } = require('../config/memoryStore');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
};

const isDbConnected = () => mongoose.connection.readyState === 1;

// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { username, password, role, depotId, name } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (isDbConnected()) {
      const userExists = await User.findOne({ username });
      if (userExists) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      const user = await User.create({ username, password, role, depotId, name });

      return res.status(201).json({
        _id: user._id,
        username: user.username,
        role: user.role,
        depotId: user.depotId,
        name: user.name,
        token: generateToken(user._id)
      });
    } else {
      const existingUser = memoryUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        _id: 'mem_user_' + Date.now(),
        username,
        password: hashedPassword,
        role: role || 'staff',
        depotId: depotId || 'depot_001',
        name: name || username,
        createdAt: new Date()
      };
      memoryUsers.push(newUser);

      return res.status(201).json({
        _id: newUser._id,
        username: newUser.username,
        role: newUser.role,
        depotId: newUser.depotId,
        name: newUser.name,
        token: generateToken(newUser._id)
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (isDbConnected()) {
      const user = await User.findOne({ username }).populate('depotId', 'name code city');

      if (user && (await user.matchPassword(password))) {
        return res.json({
          _id: user._id,
          username: user.username,
          role: user.role,
          depotId: user.depotId,
          name: user.name || user.username,
          token: generateToken(user._id)
        });
      } else {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
    } else {
      const user = memoryUsers.find(u => u.username.toLowerCase() === username.toLowerCase());

      if (user && (await bcrypt.compare(password, user.password))) {
        return res.json({
          _id: user._id,
          username: user.username,
          role: user.role,
          depotId: user.depotId || 'depot_001',
          name: user.name || user.username,
          token: generateToken(user._id)
        });
      } else {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json(req.user);
};


