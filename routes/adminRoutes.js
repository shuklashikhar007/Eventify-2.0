const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getAllUsers,
  getUserById,
  toggleUserStatus,
  deleteUser,
  getAllEvents,
  restoreEvent,
  getDetailedStats,
} = require('../controllers/adminController');
const {
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { protect, adminOnly } = require('../middleware/auth');
const { updateEventValidator, mongoIdParam } = require('../middleware/validators');

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// Dashboard & stats
router.get('/dashboard', getDashboard);
router.get('/stats', getDetailedStats);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', ...mongoIdParam('id'), getUserById);
router.patch('/users/:id/toggle', ...mongoIdParam('id'), toggleUserStatus);
router.delete('/users/:id', ...mongoIdParam('id'), deleteUser);

// Event management (admin can see + manage all)
router.get('/events', getAllEvents);
router.put('/events/:id', ...mongoIdParam('id'), updateEventValidator, updateEvent);
router.delete('/events/:id', ...mongoIdParam('id'), deleteEvent);
router.patch('/events/:id/restore', ...mongoIdParam('id'), restoreEvent);

module.exports = router;