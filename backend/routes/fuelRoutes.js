const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getFuelLogs, createFuelLog, updateFuelLog, deleteFuelLog
} = require('../controllers/fuelController');

router.route('/')
  .get(protect, getFuelLogs)
  .post(protect, createFuelLog);

router.route('/:id')
  .put(protect, updateFuelLog)
  .delete(protect, adminOnly, deleteFuelLog);

module.exports = router;
