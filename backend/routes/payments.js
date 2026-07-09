const express = require('express');
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Protected routes
router.post('/create-intent', verifyToken, paymentController.createPaymentIntent);
router.post('/confirm', verifyToken, paymentController.confirmPayment);
router.get('/:orderId', verifyToken, paymentController.getPaymentStatus);

// Webhook (raw body needed, no token required)
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

module.exports = router;
