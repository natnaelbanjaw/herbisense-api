import express from "express";
import { changePassword } from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();
const User = require('../../services/user.service');
const user = new User();

// router.get('/1', user.getUser.bind(user));
// router.get('/2', user.getUser2.bind(user));


router.patch(
  "/change-password",
  protect,
  changePassword
);

export default router;
module.exports = router;
