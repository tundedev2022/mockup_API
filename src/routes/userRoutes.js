const express = require('express');
const authController = require('../controllers/authController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/me', asyncHandler(authController.me));

module.exports = router;
