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
    const { username, email, password, role, depotId, name } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    if (cleanUsername.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    }

    if (cleanEmail && !cleanEmail.includes('@')) {
      return res.status(400).json({ message: 'Please enter a valid email address containing @ (e.g. user@busmaster.lk)' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const usernameRegex = new RegExp(`^${cleanUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    if (isDbConnected()) {
      const userExists = await User.findOne({ 
        $or: [
          { username: usernameRegex },
          ...(cleanEmail ? [{ email: cleanEmail }] : [])
        ]
      });

      if (userExists) {
        return res.status(400).json({ message: 'Username or Email already registered. Please use a different one.' });
      }

      const user = await User.create({ 
        username: cleanUsername, 
        email: cleanEmail || undefined,
        password, 
        role: role || 'driver', 
        depotId, 
        name: name || cleanUsername 
      });

      return res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        depotId: user.depotId,
        name: user.name,
        token: generateToken(user._id)
      });
    } else {
      const existingUser = memoryUsers.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase() || (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail));
      if (existingUser) {
        return res.status(400).json({ message: 'Username or Email already registered. Please use a different one.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        _id: 'mem_user_' + Date.now(),
        username: cleanUsername,
        email: cleanEmail || undefined,
        password: hashedPassword,
        role: role || 'driver',
        depotId: depotId || 'depot_001',
        name: name || cleanUsername,
        createdAt: new Date()
      };
      memoryUsers.push(newUser);

      return res.status(201).json({
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
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

    if (!username || !password) {
      return res.status(400).json({ message: 'Username/Email and password are required' });
    }

    const cleanInput = username.trim().toLowerCase();

    if (isDbConnected()) {
      const user = await User.findOne({ 
        $or: [
          { username: new RegExp(`^${cleanInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          { email: cleanInput }
        ]
      }).populate('depotId', 'name code city');

      if (user && (await user.matchPassword(password))) {
        return res.json({
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          depotId: user.depotId,
          name: user.name || user.username,
          token: generateToken(user._id)
        });
      } else {
        return res.status(401).json({ message: 'Invalid username/email or password' });
      }
    } else {
      const user = memoryUsers.find(u => u.username.toLowerCase() === cleanInput || (u.email && u.email.toLowerCase() === cleanInput));

      if (user && (await bcrypt.compare(password, user.password))) {
        return res.json({
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          depotId: user.depotId || 'depot_001',
          name: user.name || user.username,
          token: generateToken(user._id)
        });
      } else {
        return res.status(401).json({ message: 'Invalid username/email or password' });
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

// @route PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, contact } = req.body;
    if (isDbConnected()) {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (name) user.name = name;
      if (contact) user.contact = contact;
      await user.save();
      return res.json({ _id: user._id, username: user.username, role: user.role, name: user.name, depotId: user.depotId });
    } else {
      const user = memoryUsers.find(u => String(u._id) === String(req.user._id));
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (name) user.name = name;
      if (contact) user.contact = contact;
      return res.json({ _id: user._id, username: user.username, role: user.role, name: user.name, depotId: user.depotId });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    if (isDbConnected()) {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }
      user.password = newPassword;
      await user.save();
      return res.json({ message: 'Password updated successfully' });
    } else {
      const user = memoryUsers.find(u => String(u._id) === String(req.user._id));
      if (!user) return res.status(404).json({ message: 'User not found' });
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect current password' });
      }
      user.password = await bcrypt.hash(newPassword, 10);
      return res.json({ message: 'Password updated successfully' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { accountIdentifier, newPassword } = req.body;
    if (!accountIdentifier || !newPassword) {
      return res.status(400).json({ message: 'Username/Email and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const cleanInput = accountIdentifier.trim().toLowerCase();

    if (isDbConnected()) {
      const user = await User.findOne({ 
        $or: [
          { username: new RegExp(`^${cleanInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          { email: cleanInput }
        ]
      });

      if (!user) {
        return res.status(404).json({ message: 'Account with that username or email address was not found.' });
      }

      user.password = newPassword;
      await user.save();
      return res.json({ message: `Password for account '${user.username}' has been reset successfully! You can now log in.` });
    } else {
      const user = memoryUsers.find(u => u.username.toLowerCase() === cleanInput || (u.email && u.email.toLowerCase() === cleanInput));
      if (!user) {
        return res.status(404).json({ message: 'Account with that username or email address was not found.' });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      return res.json({ message: `Password for account '${user.username}' has been reset successfully! You can now log in.` });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


