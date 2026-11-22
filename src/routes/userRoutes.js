const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/me', authController.me);

module.exports = router;
