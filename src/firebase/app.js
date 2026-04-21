import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import errorMiddleware from "./middlewares/error.middleware.js";
import authRouter from "./modules/auth/auth.routes.js";
import herbRouter from "./modules/herb/herb.routes.js";
import conditionRouter from "./modules/condition/condition.routes.js";
import favoriteRouter from "./modules/favorite/favorite.routes.js";
import ratingRouter from "./modules/rating/rating.routes.js";

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

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
    message: "Herbisense Firebase backend is running"
  });
});

app.use("/api/auth", authRouter);
app.use("/api/herbs", herbRouter);
app.use("/api/conditions", conditionRouter);
app.use("/api/favorites", favoriteRouter);
app.use("/api/ratings", ratingRouter);

app.use(errorMiddleware);

export default app;
