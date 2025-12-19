import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import connectDB from "./src/config/db.js";
import userRoutes from "./src/routes/userRoutes.js";
import "./src/config/firebase.js"; // Initialize Firebase Admin SDK

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for frontend
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (avatars)
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use('/api/uploads', express.static(join(__dirname, 'public', 'uploads')));

// Connect DB
connectDB();

// Routes
app.get("/", (req, res) => {
  res.send("Fitora API is running 🚀");
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
