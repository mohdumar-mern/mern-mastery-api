import express from 'express';
import { createCourse, addUnit, addLecture, getCourses, getCourseById, updateCourse, deleteCourse, rateCourse, commentCourse, getSignedUrl, proxyVideo } from '../controllers/courseController.js';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware.js';
import { validateCourse, validateUnit, validateLecture, handleValidationErrors } from '../middlewares/validateMiddleware.js';
import upload, { handleMulterError } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, adminMiddleware, validateCourse, handleValidationErrors, createCourse);
// router.post('/:courseId/units', authMiddleware, adminMiddleware, validateUnit, handleValidationErrors, upload.single('introductionFile'), handleMulterError, addUnit);
router.post('/:courseId/units', authMiddleware, adminMiddleware,  upload.single('introductionFile'), handleMulterError, addUnit);
// router.post('/:courseId/units/:unitId/lectures', authMiddleware, adminMiddleware, validateLecture, handleValidationErrors, upload.single('lectureFile'), handleMulterError, addLecture);
router.post('/:courseId/units/:unitId/lectures', authMiddleware, adminMiddleware, upload.single('lectureFile'), handleMulterError, addLecture);
router.get('/', getCourses);
router.get('/:id', authMiddleware, getCourseById);
router.put('/:id', authMiddleware, adminMiddleware, validateCourse, handleValidationErrors, updateCourse);
router.delete('/:id', authMiddleware, adminMiddleware, deleteCourse);
router.post('/:courseId/rate', authMiddleware, rateCourse);
router.post('/:courseId/comment', authMiddleware, commentCourse);
router.post('/signed-url', authMiddleware, getSignedUrl);
router.post('/proxy-video', authMiddleware, proxyVideo);
// router.post('/signed-url', getSignedUrl);


export default router; 