const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getSchedules, getSchedule, createSchedule, updateSchedule, deleteSchedule
} = require('../controllers/scheduleController');

router.route('/')
  .get(protect, getSchedules)
  .post(protect, createSchedule);

router.route('/:id')
  .get(protect, getSchedule)
  .put(protect, updateSchedule)
  .delete(protect, adminOnly, deleteSchedule);

module.exports = router;
