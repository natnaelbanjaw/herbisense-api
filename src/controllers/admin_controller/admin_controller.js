const express = require('express');
const adminRouter = require('./router');

const adminController = express.Router();
adminController.use('/', adminRouter);

module.exports = adminController;