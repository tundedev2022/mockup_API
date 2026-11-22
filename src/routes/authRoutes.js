const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/sign-in', authController.signIn);
router.post('/sign-up', authController.signUp);
router.post('/forgot-password', authController.forgotPassword);

module.exports = router;
