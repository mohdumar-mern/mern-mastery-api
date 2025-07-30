// middlewares/uploadMiddleware.js
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../utils/cloudinary.js';
import logger from '../utils/logger.js';

const allowedFormats = ['pdf', 'mp4', 'mov', 'avi', 'mkv', 'webm'];

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    const isPDF = ext === 'pdf';
    const folder = isPDF ? 'pdfs' : 'videos';
    const resourceType = isPDF ? 'raw' : 'video';
    const originalName = file.originalname.split('.')[0].replace(/\s+/g, '_');

    const config = {
      folder: `mern-mastery/${folder}`,
      resource_type: resourceType,
      allowed_formats: allowedFormats,
      public_id: `${Date.now()}-${originalName}-${Math.random().toString(36).substring(2, 8)}`,
      secure: true,
      // access_mode: 'authenticated',
      access_mode: 'public',
      transformation: isPDF
        ? undefined
        : [
            { streaming_profile: 'hd', format: 'm3u8' },
            { fetch_format: 'auto', quality: 'auto' },
          ],
    };

    logger.info(`Uploading file: ${file.originalname}, Config: ${JSON.stringify(config)}`);
    return config;
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (allowedFormats.includes(ext)) {
      cb(null, true);
    } else {
      const error = new Error(`File type not supported. Allowed types: ${allowedFormats.join(', ')}`);
      logger.warn(`Upload rejected: ${file.originalname} - ${error.message}`);
      cb(error, false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
});

export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    logger.error(`Multer error: ${err.message}`);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size exceeds 100MB limit' });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    logger.error(`Upload error: ${err.message}`);
    return res.status(400).json({ message: err.message });
  }
  next();
};

export const uploadFile = async (file, folder, isPDF) => {
  try {
    const ext = file.originalname.split('.').pop().toLowerCase();
    const originalName = file.originalname.split('.')[0].replace(/\s+/g, '_');

    const result = await cloudinary.uploader.upload(file.path, {
      folder: `mern-mastery/${folder}`,
      resource_type: isPDF ? 'raw' : 'video',
      allowed_formats: allowedFormats,
      public_id: `${Date.now()}-${originalName}-${Math.random().toString(36).substring(2, 8)}`,
      secure: true,
      // access_mode: 'authenticated',
      transformation: isPDF
        ? undefined
        : [
            { streaming_profile: 'hd', format: 'm3u8' },
            { fetch_format: 'auto', quality: 'auto' },
          ],
    });

    logger.info(`File uploaded successfully: ${file.originalname}, Public ID: ${result.public_id}, Version: ${result.version}, URL: ${result.secure_url}`);
    return {
      publicId: result.public_id,
      url: result.secure_url,
      fileType: isPDF ? 'pdf' : 'video',
      version: result.version.toString(),
    };
  } catch (error) {
    logger.error(`Upload failed: ${file.originalname} - ${error.message}`);
    throw new Error('File upload failed');
  }
};

export default upload;