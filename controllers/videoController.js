import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname in ES Module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple XOR encryption (for demonstration)
function encryptVideo(buffer) {
  const key = [0x5f, 0x2a, 0x7b]; // Basic XOR key
  const encrypted = new Uint8Array(buffer);
  for (let i = 0; i < encrypted.length; i++) {
    encrypted[i] ^= key[i % key.length];
  }
  return encrypted;
}

// 📤 Upload video
export const uploadVideo = async (req, res) => {
  if (req.file) {
    res.status(200).json({
      message: "✅ File uploaded successfully",
      file: req.file,
    });
  } else {
    res.status(400).json({ message: "❌ No file uploaded" });
  }
};

// 📁 Get all videos in /uploads
export const getVideos = async (req, res) => {
  try {
    const uploadPath = path.join(__dirname,  '..',"uploads");
    const videos = await fs.promises.readdir(uploadPath);
    res.status(200).json({ data: videos });
  } catch (error) {
    console.error("❌ Error reading uploads directory:", error);
    res.status(500).json({ message: "Failed to list videos" });
  }
};

// 🔐 Get single encrypted video by name and download it
export const getVideo = async (req, res) => {
  const filename = req.params.name;
  const inputFilePath = path.join(__dirname, '..', "uploads", filename);
  const outputFilePath = path.join(__dirname,  '..', "temp", `enc-${Date.now()}-${filename}`);
console.log(outputFilePath)
  try {
    // Check existence
    if (!fs.existsSync(inputFilePath)) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Read & encrypt video
    const videoBuffer = await fs.promises.readFile(inputFilePath);
    const encryptedBuffer = encryptVideo(videoBuffer);
    await fs.promises.writeFile(outputFilePath, encryptedBuffer);

    // Send download response
    res.download(outputFilePath, filename, (err) => {
      if (err) {
        console.error("❌ Error sending file:", err);
        return res.status(500).json({ message: "Failed to send video" });
      }
      // Delete temp encrypted file
      fs.unlink(outputFilePath, () => {});
    });

  } catch (error) {
    console.error("❌ Error processing video:", error);
    res.status(500).json({ message: "Failed to process video" });
  }
};
