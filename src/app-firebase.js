import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import path from "path";
import { fileURLToPath } from "url";
import errorMiddleware from "./middlewares/error.middleware.js";
import openApiSpec from "./docs/openapi.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../uploads");

const app = express();

// Security
// Swagger UI uses inline assets that default Helmet CSP can block in some browsers/devices.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

// CORS
app.use(cors());

// Logging
app.use(morgan("dev"));

// Body parser
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

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

import ratingRouter from "./modules/rating/rating.routes.js";
app.use("/api/ratings", ratingRouter);

import authRouter from "./controllers/auth/auth.router.js";
import herbRouter from "./controllers/herbs/herb.router.js";

app.use("/api/herbs", herbRouter);
import authMiddleware from "./middlewares/auth.middleware.js";

app.use("/api/auth", authRouter);

import favoriteRouter from "./modules/favorite/favorite.routes.js";

app.use("/api/favorites", favoriteRouter);

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "Access granted",
    user: req.user
  });
});

import adminRouter from "./controllers/admin_controller/router.js";

app.use("/api/admin", adminRouter);


import conditionRouter from "./modules/condition/condition.routes.js";

app.use("/api/conditions", conditionRouter);

import recommendationRouter from "./modules/recommendation/recommendation.routes.js";

app.use("/api/recommendations", recommendationRouter);

import translationRouter from "./modules/translation/translation.routes.js";

app.use("/api/translations", translationRouter);

import uploadRouter from "./modules/upload/upload.routes.js";

app.use("/api/uploads", uploadRouter);

import feedbackRouter from "./modules/feedback/feedback.routes.js";

app.use("/api/feedback", feedbackRouter);

import savedHerbRouter from "./modules/saved-herb/saved-herb.routes.js";

app.use("/api/saved-herbs", savedHerbRouter);

import conditionTranslationRouter from "./modules/condition-translation/condition-translation.routes.js";

app.use("/api/condition-translations", conditionTranslationRouter);

// Error Handler (must be last)
app.use(errorMiddleware);

export default app;
  