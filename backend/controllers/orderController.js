const db = require('../config/database');

// Create order from cart
exports.createOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { shippingAddress, paymentMethod } = req.body;

    // Get cart items
    const [cartItems] = await db.connection.query(
      `SELECT ci.product_id, ci.quantity, p.price 
       FROM cart_items ci 
       JOIN products p ON ci.product_id = p.id 
       WHERE ci.user_id = ?`,
      [userId]
    );

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate total
    let totalPrice = 0;
    cartItems.forEach(item => {
      totalPrice += item.price * item.quantity;
    });

    // Create order
    const [orderResult] = await db.connection.query(
      'INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)',
      [userId, totalPrice, 'pending']
    );

    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of cartItems) {
      await db.connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price]
      );

      // Update product stock
      await db.connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Clear cart
    await db.connection.query(
      'DELETE FROM cart_items WHERE user_id = ?',
      [userId]
    );

    res.status(201).json({
      message: 'Order created successfully',
      orderId,
      totalPrice: totalPrice.toFixed(2)
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order', message: error.message });
  }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;

    const [orders] = await db.connection.query(
      'SELECT id, total_price, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.status(200).json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders', message: error.message });
  }
};

// Get order details
exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    // Verify order belongs to user
    const [orders] = await db.connection.query(
      'SELECT id, total_price, status, created_at FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const [orderItems] = await db.connection.query(
      `SELECT oi.product_id, oi.quantity, oi.price, p.name, p.image_url 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = ?`,
      [orderId]
    );

    res.status(200).json({
      order: orders[0],
      items: orderItems
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ error: 'Failed to fetch order details', message: error.message });
  }
};

// Update order status (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await db.connection.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );

    res.status(200).json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status', message: error.message });
  }
};
