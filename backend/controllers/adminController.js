const db = require('../config/database');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Total users
    const [[{ totalUsers }]] = await db.connection.query(
      'SELECT COUNT(*) as totalUsers FROM users'
    );

    // Total products
    const [[{ totalProducts }]] = await db.connection.query(
      'SELECT COUNT(*) as totalProducts FROM products'
    );

    // Total orders
    const [[{ totalOrders }]] = await db.connection.query(
      'SELECT COUNT(*) as totalOrders FROM orders'
    );

    // Total revenue
    const [[{ totalRevenue }]] = await db.connection.query(
      'SELECT SUM(total_price) as totalRevenue FROM orders WHERE status IN ("processing", "shipped", "delivered")'
    );

    // Recent orders
    const [recentOrders] = await db.connection.query(
      'SELECT id, user_id, total_price, status, created_at FROM orders ORDER BY created_at DESC LIMIT 10'
    );

    res.status(200).json({
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue || 0
      },
      recentOrders
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats', message: error.message });
  }
};

// Get all orders (admin)
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT o.id, o.user_id, u.email, o.total_price, o.status, o.created_at FROM orders o JOIN users u ON o.user_id = u.id';
    const params = [];

    if (status) {
      query += ' WHERE o.status = ?';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [orders] = await db.connection.query(query, params);

    res.status(200).json({
      orders,
      pagination: { page, limit }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders', message: error.message });
  }
};

// Get all users (admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [users] = await db.connection.query(
      'SELECT id, email, full_name, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [parseInt(limit), offset]
    );

    const [[{ total }]] = await db.connection.query(
      'SELECT COUNT(*) as total FROM users'
    );

    res.status(200).json({
      users,
      pagination: { page, limit, total }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users', message: error.message });
  }
};

// Get inventory status
exports.getInventoryStatus = async (req, res) => {
  try {
    const [products] = await db.connection.query(
      'SELECT id, name, stock, price FROM products ORDER BY stock ASC'
    );

    const lowStockProducts = products.filter(p => p.stock < 10);

    res.status(200).json({
      products,
      lowStockCount: lowStockProducts.length,
      lowStockProducts
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory', message: error.message });
  }
};

// Get sales analytics
exports.getSalesAnalytics = async (req, res) => {
  try {
    // Daily sales for the last 30 days
    const [dailySales] = await db.connection.query(
      `SELECT DATE(created_at) as date, COUNT(*) as orderCount, SUM(total_price) as dailyRevenue 
       FROM orders 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
       AND status IN ('processing', 'shipped', 'delivered')
       GROUP BY DATE(created_at) 
       ORDER BY date DESC`
    );

    // Top products
    const [topProducts] = await db.connection.query(
      `SELECT p.id, p.name, COUNT(oi.id) as soldCount, SUM(oi.quantity * oi.price) as revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       GROUP BY p.id
       ORDER BY soldCount DESC
       LIMIT 10`
    );

    res.status(200).json({
      dailySales,
      topProducts
    });
  } catch (error) {
    console.error('Get sales analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics', message: error.message });
  }
};
