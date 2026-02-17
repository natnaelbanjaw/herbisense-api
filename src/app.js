import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import errorMiddleware from "./middlewares/error.middleware.js";

const app = express();

// Security
app.use(helmet());

// CORS
app.use(cors());

// Logging
app.use(morgan("dev"));

// Body parser
app.use(express.json());

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// Error Handler (must be last)
app.use(errorMiddleware);

export default app;