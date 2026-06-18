const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  addComment,
  deleteComment,
  editComment,
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');
const {
  createEventValidator,
  updateEventValidator,
  commentValidator,
  mongoIdParam,
} = require('../middleware/validators');

// ── Public ───────────────────────────────────────────────────────────────────
router.get('/', getEvents);
router.get('/:id', ...mongoIdParam('id'), getEvent);

// ── Auth required ─────────────────────────────────────────────────────────────
router.post('/', protect, createEventValidator, createEvent);
router.put('/:id', protect, ...mongoIdParam('id'), updateEventValidator, updateEvent);
router.delete('/:id', protect, ...mongoIdParam('id'), deleteEvent);

// ── Comments ──────────────────────────────────────────────────────────────────
router.post('/:id/comments', protect, ...mongoIdParam('id'), commentValidator, addComment);
router.put('/:id/comments/:commentId', protect, ...mongoIdParam('id'), commentValidator, editComment);
router.delete('/:id/comments/:commentId', protect, ...mongoIdParam('id'), deleteComment);

module.exports = router;