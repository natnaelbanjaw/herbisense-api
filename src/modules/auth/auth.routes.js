import express from "express";
import { login, register, verifyToken } from "../../controllers/auth/auth.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/verify", authMiddleware, verifyToken);

export default router;
