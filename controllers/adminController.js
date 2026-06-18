const User = require('../models/User');
const Event = require('../models/Event');
const { asyncHandler } = require('../middleware/errorHandler');

// ── @GET /api/admin/dashboard ────────────────────────────────────────────────
const getDashboard = asyncHandler(async (req, res) => {
  const [totalUsers, totalEvents, activeEvents, upcomingEvents, recentEvents, recentUsers] =
    await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Event.countDocuments({ isActive: true }),
      Event.countDocuments({ isActive: true, eventDate: { $gte: new Date() } }),
      Event.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title club authorName eventDate category'),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email designation createdAt'),
    ]);

  // Category breakdown
  const categoryBreakdown = await Event.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.status(200).json({
    success: true,
    dashboard: {
      stats: { totalUsers, totalEvents, activeEvents, upcomingEvents },
      recentEvents,
      recentUsers,
      categoryBreakdown,
    },
  });
});

// ── @GET /api/admin/users ────────────────────────────────────────────────────
const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.search) {
    const re = new RegExp(req.query.search, 'i');
    filter.$or = [{ name: re }, { email: re }, { designation: re }];
  }

  const total = await User.countDocuments(filter);
  const users = await User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

  res.status(200).json({
    success: true,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    users,
  });
});

// ── @GET /api/admin/users/:id ────────────────────────────────────────────────
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const events = await Event.find({ author: user._id }).select('title club eventDate isActive');
  res.status(200).json({ success: true, user, events });
});

// ── @PATCH /api/admin/users/:id/toggle ──────────────────────────────────────
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
    isActive: user.isActive,
  });
});

// ── @DELETE /api/admin/users/:id ─────────────────────────────────────────────
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  // Soft-delete their events too
  await Event.updateMany({ author: user._id }, { isActive: false });
  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({ success: true, message: 'User and their events removed' });
});

// ── @GET /api/admin/events ───────────────────────────────────────────────────
// Admin sees ALL events including soft-deleted ones
const getAllEvents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) {
    const re = new RegExp(req.query.search, 'i');
    filter.$or = [{ title: re }, { club: re }, { authorName: re }];
  }

  const total = await Event.countDocuments(filter);
  const events = await Event.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('-comments')
    .populate('author', 'name email');

  res.status(200).json({
    success: true,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    events,
  });
});

// ── @PATCH /api/admin/events/:id/restore ─────────────────────────────────────
const restoreEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  event.isActive = true;
  event.lastModifiedBy = null;
  await event.save();

  res.status(200).json({ success: true, message: 'Event restored', event });
});

// ── @GET /api/admin/stats ────────────────────────────────────────────────────
const getDetailedStats = asyncHandler(async (req, res) => {
  const [monthlyEvents, clubStats] = await Promise.all([
    Event.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: { year: { $year: '$eventDate' }, month: { $month: '$eventDate' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]),
    Event.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$club', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  res.status(200).json({ success: true, stats: { monthlyEvents, clubStats } });
});

module.exports = {
  getDashboard,
  getAllUsers,
  getUserById,
  toggleUserStatus,
  deleteUser,
  getAllEvents,
  restoreEvent,
  getDetailedStats,
};