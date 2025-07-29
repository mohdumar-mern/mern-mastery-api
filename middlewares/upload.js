import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from 'cloudinary';

// Allowed file formats: PDF and common video formats
const allowedFormats = ['pdf', 'mp4', 'mov', 'avi', 'mkv', 'webm'];

const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: async (req, file) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    const isPDF = ext === 'pdf';

    const folder = isPDF ? 'pdfs' : 'videos';
    const resourceType = isPDF ? 'raw' : 'video';
    const originalName = file.originalname.split('.')[0].replace(/\s+/g, '_');

    return {
      folder: `Mern Mastery/${folder}`,
      resource_type: resourceType,
      allowed_formats: allowedFormats,
      public_id: `${Date.now()}-${originalName}-${Math.random().toString(36).substring(2, 8)}`,
      secure: true,
      access_mode: 'authenticated', // Restrict access to authenticated users
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
      cb(new Error(`File type not supported. Allowed types: ${allowedFormats.join(', ')}`), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
});

export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size exceeds 100MB limit' });
    }
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

export default upload;