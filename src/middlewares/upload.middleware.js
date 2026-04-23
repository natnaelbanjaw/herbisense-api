import multer from "multer";
import { createHttpError } from "../utils/http-error.js";

// Configure multer for memory storage (since we're using Firebase Storage)
const storage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPEG, PNG, GIF, WEBP) are allowed"), false);
  }
};

// Create multer instance
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Middleware for single file upload
export const uploadSingle = upload.single("file");

// Middleware for multiple files upload
export const uploadMultiple = upload.array("files", 5); // Max 5 files