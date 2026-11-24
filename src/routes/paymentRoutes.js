const express = require('express');
const paymentController = require('../controllers/paymentController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/methods', paymentController.methods);
router.post('/', asyncHandler(paymentController.create));

module.exports = router;
