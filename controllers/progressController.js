// controllers/progressController.js
import expressAsyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Course from '../models/courseModel.js';
import logger from '../utils/logger.js';

export const markLectureCompleted = expressAsyncHandler(async (req, res) => {
    const { courseId, unitId, lectureId } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
        logger.warn(`User not found: ${req.user.id}`);
        return res.status(404).json({ message: 'User not found' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
        logger.warn(`Course not found: ${courseId}`);
        return res.status(404).json({ message: 'Course not found' });
    }

    const unit = course.units.id(unitId);
    if (!unit) {
        logger.warn(`Unit not found: ${unitId}`);
        return res.status(404).json({ message: 'Unit not found' });
    }

    const lecture = unit.lectures.id(lectureId);
    if (!lecture) {
        logger.warn(`Lecture not found: ${lectureId}`);
        return res.status(404).json({ message: 'Lecture not found' });
    }

    const progressEntry = user.progress.find(
        p => p.courseId.toString() === courseId && p.unitId.toString() === unitId && p.lectureId.toString() === lectureId
    );

    if (progressEntry) {
        progressEntry.completed = true;
        progressEntry.completedAt = new Date();
    } else {
        user.progress.push({ courseId, unitId, lectureId, completed: true, completedAt: new Date() });
    }

    await user.save();
    logger.info(`Lecture marked completed: ${lectureId} by user ${req.user.id}`);
    res.json({ message: 'Lecture marked as completed' });
});

export const getProgress = expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('progress').lean();
    if (!user) {
        logger.warn(`User not found: ${req.user.id}`);
        return res.status(404).json({ message: 'User not found' });
    }

    logger.info(`Fetched progress for user ${req.user.id}`);
    res.json(user.progress);
});