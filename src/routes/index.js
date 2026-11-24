const express = require('express');
const authRoutes = require('./authRoutes');
const paymentRoutes = require('./paymentRoutes');
const shipmentRoutes = require('./shipmentRoutes');
const systemController = require('../controllers/systemController');
const userRoutes = require('./userRoutes');
const requireAuth = require('../middleware/requireAuth');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get('/health', systemController.health);
router.use('/auth', authRoutes);
router.use(asyncHandler(requireAuth));
router.use(userRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/payments', paymentRoutes);

router.use((req, res) => {
  res.status(404).json({
    message: `No route for ${req.method} ${req.path.replace(/^\/+/, '')}`,
  });
});

module.exports = router;
