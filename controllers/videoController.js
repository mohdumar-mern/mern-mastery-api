import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCipheriv, randomBytes } from 'crypto';
import multer from 'multer';

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory storage for keys (replace with database in production)
const videoKeys = new Map();

// Configure multer for uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// AES-256-CBC Encryption
function encryptVideo(buffer) {
  const key = randomBytes(32); // 256-bit key
  const iv = randomBytes(16);  // 128-bit IV

  const cipher = createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const finalEncrypted = Buffer.concat([iv, encrypted]);

  return { encrypted: finalEncrypted, key };
}

// Upload video with encryption
export const uploadVideo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "❌ No file uploaded" });
  }

  try {
    const inputFilePath = path.join(__dirname, '..', 'uploads', req.file.filename);
    const outputFilePath = path.join(__dirname, '..', 'uploads', `enc-${req.file.filename}`);
    const videoBuffer = await fs.readFile(inputFilePath);

    const { encrypted, key } = encryptVideo(videoBuffer);
    await fs.writeFile(outputFilePath, encrypted);
    await fs.unlink(inputFilePath); // Remove unencrypted file

    // Store key with filename
    videoKeys.set(`enc-${req.file.filename}`, key.toString('hex'));

    res.status(200).json({
      message: "✅ File uploaded and encrypted successfully",
      file: { filename: `enc-${req.file.filename}` },
      key: key.toString('hex'),
    });
  } catch (error) {
    console.error("❌ Error processing upload:", error);
    res.status(500).json({ message: "❌ Failed to process video" });
  }
};

// Get list of encrypted videos
export const getVideos = async (req, res) => {
  try {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    const videos = (await fs.readdir(uploadPath)).filter((file) => file.startsWith('enc-'));
    res.status(200).json({ data: videos });
  } catch (error) {
    console.error("❌ Error reading uploads directory:", error);
    res.status(500).json({ message: "Failed to list videos" });
  }
};

// Get & serve encrypted video with key
export const getVideo = async (req, res) => {
  const filename = req.params.name;
  if (!filename.startsWith('enc-') || filename.includes('..')) {
    return res.status(400).json({ message: "❌ Invalid filename" });
  }

  const inputFilePath = path.join(__dirname, '..', 'uploads', filename);

  try {
    const videoBuffer = await fs.readFile(inputFilePath);
    const key = videoKeys.get(filename); // Retrieve key from storage

    if (!key) {
      return res.status(404).json({ message: "❌ Key not found for this video" });
    }

    // Send video and key in response
    res.status(200).json({
      video: videoBuffer.toString('base64'), // Encode binary data as base64
      key: key,
      filename: filename,
    });
  } catch (error) {
    console.error("❌ Error processing video:", error);
    res.status(500).json({ message: "❌ Failed to process video" });
  }
};