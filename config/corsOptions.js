
export const corsOptions = {
  origin: (origin, callback) => {
    // Whitelist of allowed origins (including development and production)
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'https://mern-mastery.vercel.app', // Production URL
      'http://localhost:5173', // Development URL
      'https://mern-mastery.vercel.app', // Explicit production URL (redundant if env is set)
    ].filter(Boolean); // Remove undefined/null values

    // Allow requests with no origin (e.g., curl, some mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy blocked request from origin: ${origin}`));
    }
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Include OPTIONS for preflight
  allowedHeaders: ['Content-Type', 'Authorization'], // Standard headers
  exposedHeaders: ['Content-Length', 'Authorization'], // Expose additional headers if needed
  maxAge: 86400, // Cache preflight request for 24 hours
};
