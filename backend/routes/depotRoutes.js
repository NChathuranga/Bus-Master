const express = require('express');
const router = express.Router();
const { getDepots, createDepot, updateDepot, deleteDepot, restoreDepot } = require('../controllers/depotController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getDepots)
  .post(protect, createDepot);

router.route('/:id/restore')
  .put(protect, restoreDepot);

router.route('/:id')
  .put(protect, updateDepot)
  .delete(protect, deleteDepot);

module.exports = router;
