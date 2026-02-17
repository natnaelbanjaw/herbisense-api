import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import openApiSpec from "./docs/openapi.js";

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

import authRouter from "./controllers/auth/auth.router.js";

app.use("/api/auth", authRouter);
app.get("/api-docs.json", (req, res) => {
  res.status(200).json(openApiSpec);
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));


// Error Handler (must be last)
app.use(errorMiddleware);

export default app;
