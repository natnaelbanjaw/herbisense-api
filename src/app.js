import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import errorMiddleware from "./middlewares/error.middleware.js";
import openApiSpec from "./docs/openapi.js";

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

// OpenAPI docs
// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

// Optional: keep raw JSON if you want
app.get("/api/docs.json", (req, res) => {
  res.status(200).json(openApiSpec);
});

import authRouter from "./controllers/auth/auth.router.js";
import herbRouter from "./controllers/herbs/herb.router.js";

app.use("/api/herbs", herbRouter);
import authMiddleware from "./middlewares/auth.middleware.js";

app.use("/api/auth", authRouter);
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "Access granted",
    user: req.user
  });
});

// Error Handler (must be last)
app.use(errorMiddleware);

export default app;