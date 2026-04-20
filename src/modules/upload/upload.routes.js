import express from "express";
import upload from "./upload.middleware.js";
import {
  uploadImage,
  getHerbImages,
  deleteImage,
  getHerbs
} from "./upload.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { requireAnyRole } from "../../middlewares/role.middleware.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  requireAnyRole("admin", "super_admin"),
  upload.single("image"),
  uploadImage
);
router.get("/herbs", getHerbs);

router.get("/:herbId", getHerbImages);
router.delete("/:id", authMiddleware, requireAnyRole("admin", "super_admin"), deleteImage);

export default router;
