const Event = require('../models/Event');
const { asyncHandler } = require('../middleware/errorHandler');

// ── helpers ──────────────────────────────────────────────────────────────────
const buildPagination = (query, total) => {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 10, 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip, totalPages: Math.ceil(total / limit) };
};

// ── @GET /api/events ─────────────────────────────────────────────────────────
// Public. Supports ?page, ?limit, ?category, ?club, ?search, ?upcoming
const getEvents = asyncHandler(async (req, res) => {
  const filter = { isActive: true };

  if (req.query.category) filter.category = req.query.category;
  if (req.query.club) filter.club = new RegExp(req.query.club, 'i');
  if (req.query.upcoming === 'true') filter.eventDate = { $gte: new Date() };
  if (req.query.search) {
    const re = new RegExp(req.query.search, 'i');
    filter.$or = [{ title: re }, { description: re }, { club: re }, { tags: re }];
  }

  const total = await Event.countDocuments(filter);
  const { page, limit, skip, totalPages } = buildPagination(req.query, total);

  const events = await Event.find(filter)
    .select('-comments')          // omit comments in list view for performance
    .sort({ eventDate: 1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'name designation department');

  res.status(200).json({
    success: true,
    total,
    page,
    totalPages,
    count: events.length,
    events,
  });
});

// ── @GET /api/events/:id ─────────────────────────────────────────────────────
// Public.
const getEvent = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ _id: req.params.id, isActive: true })
    .populate('author', 'name designation department email')
    .populate('comments.author', 'name designation');

  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }
  res.status(200).json({ success: true, event });
});

// ── @POST /api/events ────────────────────────────────────────────────────────
// Auth required.
const createEvent = asyncHandler(async (req, res) => {
  const {
    title, description, club, location,
    eventDate, eventTime, requirements,
    category, registrationLink, maxParticipants,
    bannerImage, tags,
  } = req.body;

  const event = await Event.create({
    title,
    description,
    club,
    location,
    eventDate,
    eventTime,
    requirements,
    category,
    registrationLink,
    maxParticipants,
    bannerImage,
    tags,
    author: req.user._id === 'admin' ? null : req.user._id,
    authorName: req.user.name,
    authorDesignation: req.user.designation,
  });

  res.status(201).json({ success: true, message: 'Event created successfully', event });
});

// ── @PUT /api/events/:id ─────────────────────────────────────────────────────
// Owner or admin.
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event || !event.isActive) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  // Ownership check (admin bypasses)
  const isOwner = event.author && event.author.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorised to edit this event' });
  }

  const allowed = [
    'title', 'description', 'club', 'location', 'eventDate', 'eventTime',
    'requirements', 'category', 'registrationLink', 'maxParticipants', 'bannerImage', 'tags',
  ];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) event[field] = req.body[field];
  });

  event.lastModifiedBy = req.user._id === 'admin' ? null : req.user._id;
  await event.save();

  res.status(200).json({ success: true, message: 'Event updated successfully', event });
});

// ── @DELETE /api/events/:id ──────────────────────────────────────────────────
// Owner or admin. Soft-delete (isActive = false).
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event || !event.isActive) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  const isOwner = event.author && event.author.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorised to delete this event' });
  }

  event.isActive = false;
  event.lastModifiedBy = req.user._id === 'admin' ? null : req.user._id;
  await event.save();

  res.status(200).json({ success: true, message: 'Event deleted successfully' });
});

// ── @POST /api/events/:id/comments ──────────────────────────────────────────
// Auth required.
const addComment = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ _id: req.params.id, isActive: true });
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  const comment = {
    author: req.user._id === 'admin' ? undefined : req.user._id,
    authorName: req.user.name,
    authorDesignation: req.user.designation,
    content: req.body.content,
  };

  event.comments.push(comment);
  await event.save();

  const newComment = event.comments[event.comments.length - 1];
  res.status(201).json({ success: true, message: 'Comment added', comment: newComment });
});

// ── @DELETE /api/events/:id/comments/:commentId ──────────────────────────────
// Comment owner or admin.
const deleteComment = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ _id: req.params.id, isActive: true });
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  const comment = event.comments.id(req.params.commentId);
  if (!comment) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }

  const isCommentOwner = comment.author && comment.author.toString() === req.user._id.toString();
  if (!isCommentOwner && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorised to delete this comment' });
  }

  comment.deleteOne();
  await event.save();

  res.status(200).json({ success: true, message: 'Comment deleted' });
});

// ── @PUT /api/events/:id/comments/:commentId ─────────────────────────────────
// Comment owner only.
const editComment = asyncHandler(async (req, res) => {
  const event = await Event.findOne({ _id: req.params.id, isActive: true });
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }

  const comment = event.comments.id(req.params.commentId);
  if (!comment) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }

  const isCommentOwner = comment.author && comment.author.toString() === req.user._id.toString();
  if (!isCommentOwner) {
    return res.status(403).json({ success: false, message: 'Not authorised to edit this comment' });
  }

  comment.content = req.body.content;
  comment.isEdited = true;
  await event.save();

  res.status(200).json({ success: true, message: 'Comment updated', comment });
});

module.exports = {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  addComment,
  deleteComment,
  editComment,
};