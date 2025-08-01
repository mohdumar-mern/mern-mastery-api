import expressAsyncHandler from 'express-async-handler';
import Course from '../models/courseModel.js';
import cloudinary from '../utils/cloudinary.js';
import { uploadFile } from '../middlewares/uploadMiddleware.js';
import logger from '../utils/logger.js';
import { createCipheriv, randomBytes } from 'crypto';


const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || 300 * 1024 * 1024; // 300 MB in bytes


export const createCourse = expressAsyncHandler(async (req, res) => {
  const { title, description, category } = req.body;
  const course = new Course({
    title,
    description,
    category,
    createdBy: req.user.id,
  });
  await course.save();
  logger.info(`Course created: ${title} by user ${req.user.id}`);
  res.status(201).json(course);
});

export const addUnit = expressAsyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { title } = req.body;
  if (!req.file) {
    logger.warn(`No file uploaded for unit in course ${courseId}`);
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const course = await Course.findById(courseId);
  if (!course) {
    logger.warn(`Course not found: ${courseId}`);
    return res.status(404).json({ message: 'Course not found' });
  }
  if (course.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    logger.warn(`Unauthorized unit add attempt by user ${req.user.id} on course ${courseId}`);
    return res.status(403).json({ message: 'Unauthorized' });
  }

  const { publicId, url, fileType, version } = await uploadFile(
    req.file,
    `courses/${courseId}/units`,
    req.file.mimetype === 'application/pdf'
  );

  logger.info(`Unit file uploaded: publicId=${publicId}, version=${version}, fileType=${fileType}, url=${url}`);
  course.units.push({
    title,
    introduction: {
      fileUrl: url,
      publicId,
      fileType,
      version,
    },
    lectures: [],
  });

  await course.save();
  logger.info(`Unit added to course ${courseId}: ${title}`);
  res.status(201).json(course);
});

export const addLecture = expressAsyncHandler(async (req, res) => {
  const { courseId, unitId } = req.params;
  const { title, order } = req.body;
  if (!req.file) {
    logger.warn(`No file uploaded for lecture in course ${courseId}, unit ${unitId}`);
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const course = await Course.findById(courseId);
  if (!course) {
    logger.warn(`Course not found: ${courseId}`);
    return res.status(404).json({ message: 'Course not found' });
  }
  if (course.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    logger.warn(`Unauthorized lecture add attempt by user ${req.user.id} on course ${courseId}`);
    return res.status(403).json({ message: 'Unauthorized' });
  }

  const unit = course.units.id(unitId);
  if (!unit) {
    logger.warn(`Unit not found: ${unitId} in course ${courseId}`);
    return res.status(404).json({ message: 'Unit not found' });
  }

  const { publicId, url, fileType, version } = await uploadFile(
    req.file,
    `courses/${courseId}/units/${unitId}/lectures`,
    req.file.mimetype === 'application/pdf'
  );

  logger.info(`Lecture file uploaded: publicId=${publicId}, version=${version}, fileType=${fileType}, url=${url}`);
  unit.lectures.push({
    title,
    fileUrl: url,
    publicId,
    fileType,
    version,
    order: Number(order),
  });

  await course.save();
  logger.info(`Lecture added to unit ${unitId} in course ${courseId}: ${title}`);
  res.status(201).json(course);
});

export const getCourses = expressAsyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', category = '' } = req.query;
  const query = {
    ...(search && { title: { $regex: search, $options: 'i' } }),
    ...(category && { category }),
  };

  try {
    const courses = await Course.find(query)
      .populate('createdBy', 'username email')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();
    const total = await Course.countDocuments(query);

    logger.info(`Fetched ${courses.length} courses for page ${page}`);
    res.json({
      courses,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    logger.error(`Error fetching courses: ${err.message}`);
    throw err;
  }
});

export const getCourseById = expressAsyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate('createdBy', 'username email').lean();
  if (!course) {
    logger.warn(`Course not found: ${req.params.id}`);
    return res.status(404).json({ message: 'Course not found' });
  }
  logger.info(`Fetched course: ${course.title}`);
  res.json(course);
});

export const updateCourse = expressAsyncHandler(async (req, res) => {
  const { title, description, category } = req.body;
  const course = await Course.findById(req.params.id);
  if (!course) {
    logger.warn(`Course not found for update: ${req.params.id}`);
    return res.status(404).json({ message: 'Course not found' });
  }
  if (course.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    logger.warn(`Unauthorized update attempt by user ${req.user.id} on course ${req.params.id}`);
    return res.status(403).json({ message: 'Unauthorized' });
  }

  course.title = title || course.title;
  course.description = description || course.description;
  course.category = category || course.category;
  await course.save();


  logger.info(`Course updated: ${course.title} by user ${req.user.id}`);
  res.json(course);
});

export const deleteCourse = expressAsyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    logger.warn(`Course not found for deletion: ${req.params.id}`);
    return res.status(404).json({ message: 'Course not found' });
  }
  if (course.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    logger.warn(`Unauthorized delete attempt by user ${req.user.id} on course ${req.params.id}`);
    return res.status(403).json({ message: 'Unauthorized' });
  }

  for (const unit of course.units) {
    if (unit.introduction.publicId) {
      await cloudinary.uploader.destroy(unit.introduction.publicId, {
        resource_type: unit.introduction.fileType === 'video' ? 'video' : 'raw',
      });
    }
    for (const lecture of unit.lectures) {
      if (lecture.publicId) {
        await cloudinary.uploader.destroy(lecture.publicId, {
          resource_type: lecture.fileType === 'video' ? 'video' : 'raw',
        });
      }
    }
  }

  await course.deleteOne();
  logger.info(`Course deleted: ${course.title} by user ${req.user.id}`);
  res.json({ message: 'Course deleted successfully' });
});

export const rateCourse = expressAsyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { rating } = req.body;
  const course = await Course.findById(courseId);
  if (!course) {
    logger.warn(`Course not found for rating: ${courseId}`);
    return res.status(404).json({ message: 'Course not found' });
  }

  const existingRating = course.ratings.find((r) => r.userId.toString() === req.user.id);
  if (existingRating) {
    existingRating.rating = rating;
    existingRating.createdAt = new Date();
  } else {
    course.ratings.push({ userId: req.user.id, rating });
  }

  await course.save();
  logger.info(`Course rated: ${courseId} by user ${req.user.id} with rating ${rating}`);
  res.json({ message: 'Rating submitted' });
});

export const commentCourse = expressAsyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { comment } = req.body;
  const course = await Course.findById(courseId);
  if (!course) {
    logger.warn(`Course not found for comment: ${courseId}`);
    return res.status(404).json({ message: 'Course not found' });
  }

  course.comments.push({ userId: req.user.id, comment });
  await course.save();
  logger.info(`Comment added to course ${courseId} by user ${req.user.id}`);
  res.json({ message: 'Comment submitted' });
});






export const getSignedUrl = expressAsyncHandler(async (req, res) => {
  const { publicId, fileType = 'video', version } = req.body;

  if (!publicId || !fileType || !version) {
    return res.status(400).json({ message: 'publicId, fileType, and version are required' });
  }

  // Validate AES secret key (expecting 64-char hex string = 32 bytes)
  const secretKey = process.env.AES_SECRET_KEY;
  if (!secretKey) {
    logger.error('AES_SECRET_KEY is not set in environment variables.');
    return res.status(500).json({ message: 'Server configuration error: AES_SECRET_KEY is not set. Please set a 64-character hex string in .env.' });
  }
  const keyBuffer = Buffer.from(secretKey, 'hex');
  if (keyBuffer.length !== 32) {
    logger.error(`Invalid AES secret key length: ${keyBuffer.length} bytes, expected 32 bytes.`);
    return res.status(500).json({ message: 'Server configuration error: AES_SECRET_KEY must be a 64-character hex string (32 bytes).' });
  }

  try {
    // Check user access to the course
    const course = await Course.findOne({
      $or: [
        { 'units.introduction.publicId': publicId },
        { 'units.lectures.publicId': publicId },
      ],
    });
    if (!course) {
      logger.warn(`No course found for publicId: ${publicId}`);
      return res.status(404).json({ message: 'Resource not found' });
    }
    if (course.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      logger.warn(`Unauthorized signed URL request by user ${req.user.id} for publicId: ${publicId}`);
      return res.status(403).json({ message: 'Unauthorized access to resource' });
    }

    // Verify asset
    const asset = await cloudinary.api.resource(publicId, { resource_type: fileType });
    if (asset.version.toString() !== version) {
      return res.status(400).json({ message: `Version mismatch: expected ${version}, found ${asset.version}` });
    }
    // if (asset.access_mode !== 'authenticated') {
    //   logger.warn(`Asset not configured for authenticated access: ${publicId}`);
    //   return res.status(400).json({ message: 'Asset must be configured with authenticated access mode' });
    // }

    const timestamp = Math.floor(Date.now() / 1000);
    const expiresAt = timestamp + 300; // 5 min in seconds

    const signedUrl = cloudinary.url(publicId, {
      resource_type: fileType,
      format: 'm3u8',
      secure: true,
      sign_url: true,
      version,
      // type: 'authenticated',
      transformation: [
        {
          streaming_profile: 'hd',
          // overlay: {
          //   font_family: 'Arial',
          //   font_size: 20,
          //   text: `User: ${req.user.id}`,
          //   position: 'center',
          // },
        },
      ],
      expires_at: expiresAt,
      timestamp,
    });

    // AES Encryption
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', keyBuffer, iv);
    let encrypted = cipher.update(signedUrl, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const encryptedUrl = iv.toString('hex') + ':' + encrypted.toString('hex');

    logger.info(`Generated encrypted signed URL at ${new Date().toISOString()} for publicId: ${publicId}`);
    res.json({ encryptedUrl });
  } catch (error) {
    logger.error(`Failed to generate signed URL for publicId: ${publicId}, fileType: ${fileType} at ${new Date().toISOString()}: ${error.message}`);
    if (error.message.includes('Rate limit exceeded')) {
      return res.status(429).json({ message: 'Cloudinary rate limit exceeded' });
    }
    if (error.message.includes('Resource not found')) {
      return res.status(404).json({ message: 'Resource not found in Cloudinary' });
    }
    if (error.message.includes('Invalid API key')) {
      return res.status(401).json({ message: 'Invalid Cloudinary configuration' });
    }
    res.status(500).json({ message: 'Failed to generate signed URL', error: error.message });
  }
});