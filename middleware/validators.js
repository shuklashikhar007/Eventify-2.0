const { body, param, validationResult } = require('express-validator');

// Collect validation errors and short-circuit with 400
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Auth validators ──────────────────────────────────────────────────────────
const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 60 }),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .custom((email) => {
      const lower = email.toLowerCase();
      if (!lower.endsWith('@itbhu.ac.in') && !lower.endsWith('@iitbhu.ac.in')) {
        throw new Error('Only @itbhu.ac.in or @iitbhu.ac.in emails are allowed');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('designation')
    .trim()
    .notEmpty()
    .withMessage('Designation is required')
    .isLength({ max: 100 }),
  body('department').optional().trim().isLength({ max: 100 }),
  validate,
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// ── Event validators ─────────────────────────────────────────────────────────
const createEventValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 5000 }),
  body('club').trim().notEmpty().withMessage('Club name is required').isLength({ max: 100 }),
  body('location').trim().notEmpty().withMessage('Location is required').isLength({ max: 200 }),
  body('eventDate').isISO8601().withMessage('Valid event date (ISO 8601) is required'),
  body('eventTime').trim().notEmpty().withMessage('Event time is required').isLength({ max: 50 }),
  body('requirements').optional().trim().isLength({ max: 2000 }),
  body('category')
    .optional()
    .isIn(['Technical', 'Cultural', 'Sports', 'Academic', 'Workshop', 'Seminar', 'Social', 'Other'])
    .withMessage('Invalid category'),
  body('registrationLink').optional().trim().isURL({ require_protocol: true }).withMessage('Invalid registration URL'),
  body('maxParticipants').optional().isInt({ min: 1 }).withMessage('Max participants must be a positive integer'),
  validate,
];

const updateEventValidator = [
  body('title').optional().trim().isLength({ max: 150 }),
  body('description').optional().trim().isLength({ max: 5000 }),
  body('club').optional().trim().isLength({ max: 100 }),
  body('location').optional().trim().isLength({ max: 200 }),
  body('eventDate').optional().isISO8601().withMessage('Valid event date is required'),
  body('eventTime').optional().trim().isLength({ max: 50 }),
  body('requirements').optional().trim().isLength({ max: 2000 }),
  body('category')
    .optional()
    .isIn(['Technical', 'Cultural', 'Sports', 'Academic', 'Workshop', 'Seminar', 'Social', 'Other']),
  body('registrationLink').optional().trim().isURL({ require_protocol: true }),
  body('maxParticipants').optional().isInt({ min: 1 }),
  validate,
];

// ── Comment validators ───────────────────────────────────────────────────────
const commentValidator = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
  validate,
];

// ── Param validators ─────────────────────────────────────────────────────────
const mongoIdParam = (paramName) => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
  validate,
];

module.exports = {
  registerValidator,
  loginValidator,
  createEventValidator,
  updateEventValidator,
  commentValidator,
  mongoIdParam,
};