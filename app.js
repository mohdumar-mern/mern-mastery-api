import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";
const app = express();

// Get __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import rate limiter and routes
import { limiter } from "./utils/rateLimiter.js";
import vdoRouter from './routes/vdoRoutes.js'

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// Static Files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));
app.use(limiter);
app.use(cors());
app.use(morgan("dev"));
app.use(cookieParser());

// Routes
app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello Coders..." });
});






// ✅ Video file direct download
app.get("/download", (req, res) => {
  res.download(path.join(__dirname, "uploads", "1.mp4"));
});

// ✅ Render video page with embedded player
app.get("/video", (req, res) => {
  res.render("video", { title: "Video Page", videoFile: "1.mp4" });
});


app.use("/api", vdoRouter);


// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

export default app;