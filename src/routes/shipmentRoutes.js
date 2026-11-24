const express = require('express');
const shipmentController = require('../controllers/shipmentController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(shipmentController.list));
router.post('/quote', asyncHandler(shipmentController.quote));
router.post('/', asyncHandler(shipmentController.create));
router.get('/:id', asyncHandler(shipmentController.getById));

module.exports = router;
