const express = require('express');
const userRouter = require('./router');

const userController = express.Router();
userController.use('/', userRouter);

module.exports = userController;