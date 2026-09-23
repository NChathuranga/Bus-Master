const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getDrivers, getDriver, createDriver, updateDriver, deleteDriver
} = require('../controllers/driverController');

router.route('/')
  .get(protect, getDrivers)
  .post(protect, createDriver);

router.route('/:id')
  .get(protect, getDriver)
  .put(protect, updateDriver)
  .delete(protect, adminOnly, deleteDriver);

module.exports = router;
