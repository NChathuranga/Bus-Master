const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getVehicles, getVehicle, createVehicle, updateVehicle, deleteVehicle
} = require('../controllers/vehicleController');

router.route('/')
  .get(protect, getVehicles)
  .post(protect, createVehicle);

router.route('/:id')
  .get(protect, getVehicle)
  .put(protect, updateVehicle)
  .delete(protect, adminOnly, deleteVehicle);

module.exports = router;
