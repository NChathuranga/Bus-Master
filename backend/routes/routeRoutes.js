const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getRoutes, getRoute, createRoute, updateRoute, deleteRoute
} = require('../controllers/routeController');

router.route('/')
  .get(protect, getRoutes)
  .post(protect, createRoute);

router.route('/:id')
  .get(protect, getRoute)
  .put(protect, updateRoute)
  .delete(protect, adminOnly, deleteRoute);

module.exports = router;
