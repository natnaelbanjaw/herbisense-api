const express = require('express');
const router = express.Router();
const User = require('../../services/user.service');
const user = new User();

router.get('/1', user.getUser.bind(user));
router.get('/2', user.getUser2.bind(user));

module.exports = router;
