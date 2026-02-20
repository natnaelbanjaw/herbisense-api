const express = require('express');
const adminRouter = require('./router');

const adminController = express.Router();
adminController.use('/', adminRouter);

export const createAdmin = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    const admin = await createAdminService(fullName, email, password);

    res.status(201).json({
      success: true,
      data: admin
    });

  } catch (error) {
    next(error);
  }
};

module.exports = adminController;