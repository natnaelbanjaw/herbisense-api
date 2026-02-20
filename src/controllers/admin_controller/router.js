const express = require('express');
const router = express.Router();

router.get("/", (req, res)=>{
    res.send("this is admin router")
})

router.post(
  "/create-admin",
  authMiddleware,
  requireSuperAdmin,
  createAdmin
);

module.exports = router;