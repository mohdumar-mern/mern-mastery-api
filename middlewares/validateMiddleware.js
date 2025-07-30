import { body, validationResult } from 'express-validator';

export const validateUser = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('email').isEmail().withMessage('Invalid email format'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

export const validateLogin = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required'),
];


export const validateCourse = [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
  body('category').optional().trim().isLength({ max: 50 }).withMessage('Category must not exceed 50 characters'),
];

export const validateUnit = [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Unit title must be between 3 and 100 characters'),
  body('introductionFile').custom((value, { req }) => {
    if (!req.file) throw new Error('Introduction file is required');
    return true;
  }),
];

export const validateLecture = [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Lecture title must be between 3 and 100 characters'),
  body('order').isInt({ min: 1 }).withMessage('Lecture order must be a positive integer'),
  body('lectureFile').custom((value, { req }) => {
    if (!req.file) throw new Error('Lecture file is required');
    return true;
  }),
];

export const validateProgress = [
  body('courseId').isMongoId().withMessage('Invalid course ID'),
  body('unitId').isMongoId().withMessage('Invalid unit ID'),
  body('lectureId').isMongoId().withMessage('Invalid lecture ID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    next();
  },
];

export const validateRating = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
];

export const validateComment = [
  body('comment').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters'),
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }
  next();
};