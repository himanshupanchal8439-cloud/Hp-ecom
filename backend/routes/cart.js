const express = require('express');
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Protected routes
router.post('/', verifyToken, cartController.addToCart);
router.get('/', verifyToken, cartController.getCart);
router.put('/:itemId', verifyToken, cartController.updateCartItem);
router.delete('/:itemId', verifyToken, cartController.removeFromCart);
router.delete('/', verifyToken, cartController.clearCart);

module.exports = router;
