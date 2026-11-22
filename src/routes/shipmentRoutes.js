const express = require('express');
const shipmentController = require('../controllers/shipmentController');

const router = express.Router();

router.get('/', shipmentController.list);
router.post('/quote', shipmentController.quote);
router.post('/', shipmentController.create);
router.get('/:id', shipmentController.getById);

module.exports = router;
