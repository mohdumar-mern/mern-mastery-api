import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../utils/cloudinary.js';
import logger from '../utils/logger.js';

// Allowed file formats
const allowedFormats = ['pdf', 'mp4', 'mov', 'avi', 'mkv', 'webm'];

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    const isPDF = ext === 'pdf';

    const folder = isPDF ? 'pdfs' : 'videos';
    const resourceType = isPDF ? 'raw' : 'video';
    const originalName = file.originalname.split('.')[0].replace(/\s+/g, '_');

    return {
      folder: `waquar/${folder}`,
      resource_type: resourceType,
      allowed_formats: allowedFormats,
      public_id: `${Date.now()}-${originalName}-${Math.random().toString(36).substring(2, 8)}`,
      secure: true,
      access_mode: 'authenticated',
    transformation: isPDF ? undefined : [
        { streaming_profile: 'hd' }, // Separate transformation for streaming_profile
        { fetch_format: 'auto', quality: 'auto' }, // Additional optimizations
      ],
    };
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

export default upload;