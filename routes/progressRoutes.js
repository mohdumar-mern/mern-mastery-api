// routes/progressRoutes.js
import express from 'express';
import { markLectureCompleted, getProgress } from '../controllers/progressController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { validateProgress } from '../middlewares/validateMiddleware.js';

const router = express.Router();



// router.post('/mark-completed', authMiddleware, validateProgress, markLectureCompleted);
router.post('/mark-completed', authMiddleware, markLectureCompleted);
router.get('/', authMiddleware, getProgress);

export default router;