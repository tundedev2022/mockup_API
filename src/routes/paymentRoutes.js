const express = require('express');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

router.get('/methods', paymentController.methods);
router.post('/', paymentController.create);

module.exports = router;
