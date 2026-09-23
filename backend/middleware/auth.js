const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { users: memoryUsers } = require('../config/memoryStore');

// Verifies the JWT token sent in the Authorization header
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (mongoose.connection.readyState === 1) {
        req.user = await User.findById(decoded.id).select('-password');
      } else {
        const memUser = memoryUsers.find(u => u._id === decoded.id);
        if (memUser) {
          const { password, ...userWithoutPassword } = memUser;
          req.user = userWithoutPassword;
        }
      }

      if (!req.user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Restricts a route to admin users only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required for this action' });
  }
};

module.exports = { protect, adminOnly };
