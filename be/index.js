import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import userRoutes from "./src/routes/userRoutes.js";
import admin from './src/config/firebase.js'; // Initialize Firebase Admin SDK

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS configuration - allow frontend domain and localhost for development
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (avatars)
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use('/api/uploads', express.static(join(__dirname, 'public', 'uploads')));



// Log all requests for debugging (before routes)
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.originalUrl || req.path}`);
  next();
});

// Routes
app.get("/", (req, res) => {
  res.send("Fitora API is running 🚀");
});

// Debug endpoint to inspect Firestore/emulator connection
app.get('/api/debug/firestore', async (req, res) => {
  try {
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || null;
    const projectId = (admin.app && admin.app().options && admin.app().options.projectId) || null;
    let collections = [];
    try {
      const cols = await admin.firestore().listCollections();
      collections = cols.map(c => c.id);
    } catch (err) {
      console.warn('Could not list collections:', err && err.message);
    }

    return res.json({
      emulatorHost,
      projectId,
      collections,
    });
  } catch (error) {
    console.error('Debug firestore error:', error);
    res.status(500).json({ error: String(error) });
  }
});

// Test route to verify routing works
app.get("/api/test", (req, res) => {
  res.json({ message: "API routing works!" });
});

app.use("/api", userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  
  // Handle multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large! Maximum size is 5MB.',
      });
    }
    return res.status(400).json({
      message: err.message || 'File upload error',
    });
  }
  
  // Handle other errors
  res.status(500).json({ 
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔥 Server running on http://localhost:${PORT}`);
});
