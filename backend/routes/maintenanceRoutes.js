const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getMaintenanceRecords, createMaintenanceRecord, updateMaintenanceRecord, deleteMaintenanceRecord
} = require('../controllers/maintenanceController');

router.route('/')
  .get(protect, getMaintenanceRecords)
  .post(protect, createMaintenanceRecord);

router.route('/:id')
  .put(protect, updateMaintenanceRecord)
  .delete(protect, adminOnly, deleteMaintenanceRecord);

module.exports = router;
