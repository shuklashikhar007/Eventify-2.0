const mongoose = require('mongoose');

// ── Comment Sub-document ─────────────────────────────────────────────────────
const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Denormalised snapshot so comments survive user updates
    authorName: { type: String, required: true },
    authorDesignation: { type: String, required: true },
    content: {
      type: String,
      required: [true, 'Comment cannot be empty'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Event Model ──────────────────────────────────────────────────────────────
const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    club: {
      type: String,
      required: [true, 'Club/Organization name is required'],
      trim: true,
      maxlength: [100, 'Club name cannot exceed 100 characters'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    eventTime: {
      type: String,          // "10:00 AM – 12:00 PM" free-form string
      required: [true, 'Event time is required'],
      trim: true,
      maxlength: [50, 'Event time cannot exceed 50 characters'],
    },
    requirements: {
      type: String,          // eligibility, registration links, what to bring, etc.
      trim: true,
      maxlength: [2000, 'Requirements cannot exceed 2000 characters'],
      default: '',
    },
    category: {
      type: String,
      enum: [
        'Technical',
        'Cultural',
        'Sports',
        'Academic',
        'Workshop',
        'Seminar',
        'Social',
        'Other',
      ],
      default: 'Other',
    },
    registrationLink: {
      type: String,
      trim: true,
      default: '',
    },
    maxParticipants: {
      type: Number,
      min: [1, 'Max participants must be at least 1'],
      default: null,
    },
    bannerImage: {
      type: String,
      default: '',
    },
    tags: [{ type: String, trim: true }],
    // ── Author info ──────────────────────────────────────────────────────────
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {         // denormalised snapshot
      type: String,
      required: true,
    },
    authorDesignation: {  // denormalised snapshot
      type: String,
      required: true,
    },
    // ── Moderation ───────────────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // ── Comments ─────────────────────────────────────────────────────────────
    comments: [commentSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual — comment count
eventSchema.virtual('commentCount').get(function () {
  return this.comments ? this.comments.length : 0;
});

// Index for fast sorting / filtering
eventSchema.index({ eventDate: 1 });
eventSchema.index({ author: 1 });
eventSchema.index({ club: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ isActive: 1 });

module.exports = mongoose.model('Event', eventSchema);