const express = require('express');
const router = express.Router();
const { getRequests, createRequest, handleRequestAction } = require('../controllers/requestController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getRequests)
  .post(protect, createRequest);

router.route('/:id/action')
  .put(protect, handleRequestAction);

module.exports = router;
