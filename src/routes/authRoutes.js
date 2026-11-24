const express = require('express');
const authController = require('../controllers/authController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.post('/sign-in', asyncHandler(authController.signIn));
router.post('/sign-up', asyncHandler(authController.signUp));
router.post('/forgot-password', authController.forgotPassword);

module.exports = router;
