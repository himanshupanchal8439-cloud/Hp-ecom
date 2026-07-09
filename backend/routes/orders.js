const express = require('express');
const orderController = require('../controllers/orderController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// Protected routes for users
router.post('/', verifyToken, orderController.createOrder);
router.get('/', verifyToken, orderController.getUserOrders);
router.get('/:orderId', verifyToken, orderController.getOrderDetails);

// Admin routes
router.put('/:orderId', verifyAdmin, orderController.updateOrderStatus);

module.exports = router;
