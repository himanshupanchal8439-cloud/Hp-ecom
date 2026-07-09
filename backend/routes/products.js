const express = require('express');
const productController = require('../controllers/productController');
const { verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Admin routes (protected)
router.post('/', verifyAdmin, productController.createProduct);
router.put('/:id', verifyAdmin, productController.updateProduct);
router.delete('/:id', verifyAdmin, productController.deleteProduct);

module.exports = router;
