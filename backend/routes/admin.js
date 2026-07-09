const express = require('express');
const adminController = require('../controllers/adminController');
const { verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// Protected admin routes
router.get('/stats', verifyAdmin, adminController.getDashboardStats);
router.get('/orders', verifyAdmin, adminController.getAllOrders);
router.get('/users', verifyAdmin, adminController.getAllUsers);
router.get('/inventory', verifyAdmin, adminController.getInventoryStatus);
router.get('/analytics', verifyAdmin, adminController.getSalesAnalytics);

module.exports = router;
