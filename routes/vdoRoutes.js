// routes/vdoRoutes.js
import express from "express";
import multer from "multer";
import { getVideo, getVideos, uploadVideo } from "../controllers/videoController.js";
import {  renderVideoPage } from "../controllers/vdoTokenController.js";

const router = express.Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads"); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });
router.post("/upload", upload.single("video"), uploadVideo);
// router.get("/otp/:videoId", getVdoOtp);
// router.get("/watch/:videoId", renderVideoPage);
router.get("/videos", getVideos);
router.get("/videos/:name", getVideo);


export default router;
