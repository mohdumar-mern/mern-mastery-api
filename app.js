import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";
const app = express();

import authRoutes from './routes/authRoutes.js'

// Get __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import rate limiter and routes
import { globalLimiter } from "./utils/rateLimiter.js";
import { errorHandling, pageNotFound } from "./middlewares/errorHandlerMiddleware.js";

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
app.use(globalLimiter);
app.use(cors());
app.use(morgan("dev"));
app.use(cookieParser());

// Routes
app.get("/", (req, res) => {
  res.status(200).json({ message: "Hello Coders..." });
});
app.use("/api/auth", authRoutes)

// page not found
app.use(pageNotFound)

// Error handler middleware
app.use(errorHandling)
export default app;