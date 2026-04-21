import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import firebaseAuthMiddleware from "./middlewares/auth.middleware.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import openApiSpec from "../docs/openapi.js";
import authRouter from "./modules/auth/auth.routes.js";
import herbRouter from "./modules/herb/herb.routes.js";
import conditionRouter from "./modules/condition/condition.routes.js";
import favoriteRouter from "./modules/favorite/favorite.routes.js";
import ratingRouter from "./modules/rating/rating.routes.js";

const app = express();
const createNotImplementedHandler = (routeName) => (req, res) => {
  res.status(501).json({
    success: false,
    message: `${routeName} is not implemented in the Firebase backend yet`
  });
};
const notImplementedRoutes = [
  "/api/admin",
  "/api/recommendations",
  "/api/translations",
  "/api/uploads",
  "/api/feedback",
  "/api/saved-herbs",
  "/api/condition-translations"
];

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    backend: "firebase",
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Herbisense Firebase backend is running",
    implementedRoutes: [
      "/health",
      "/api/auth",
      "/api/herbs",
      "/api/conditions",
      "/api/favorites",
      "/api/ratings",
      "/api/protected"
    ],
    pendingRoutes: notImplementedRoutes
  });
});

app.get("/api/docs.json", (req, res) => {
  res.status(200).json(openApiSpec);
});

app.use("/api/auth", authRouter);
app.use("/api/herbs", herbRouter);
app.use("/api/conditions", conditionRouter);
app.use("/api/favorites", favoriteRouter);
app.use("/api/ratings", ratingRouter);

app.get("/api/protected", firebaseAuthMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Access granted",
    user: req.user
  });
});

notImplementedRoutes.forEach((route) => {
  app.use(route, createNotImplementedHandler(route));
});

app.use(errorMiddleware);

export default app;
