import express from "express";
import firebaseAuthMiddleware from "../../middlewares/auth.middleware.js";
import { login, me, register } from "./auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", firebaseAuthMiddleware, me);

export default router;
