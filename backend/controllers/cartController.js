const db = require('../config/database');

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.userId;

    if (!productId || !quantity) {
      return res.status(400).json({ error: 'Product ID and quantity are required' });
    }

    // Check if product exists
    const [products] = await db.connection.query(
      'SELECT id, stock FROM products WHERE id = ?',
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (products[0].stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Check if item already in cart
    const [cartItems] = await db.connection.query(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );

    if (cartItems.length > 0) {
      // Update quantity
      await db.connection.query(
        'UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
        [quantity, userId, productId]
      );
    } else {
      // Insert new item
      await db.connection.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, productId, quantity]
      );
    }

    res.status(200).json({ message: 'Item added to cart successfully' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart', message: error.message });
  }
};

// Get cart items
exports.getCart = async (req, res) => {
  try {
    const userId = req.userId;

    const [cartItems] = await db.connection.query(
      `SELECT ci.id, ci.quantity, p.id as productId, p.name, p.price, p.image_url 
       FROM cart_items ci 
       JOIN products p ON ci.product_id = p.id 
       WHERE ci.user_id = ?`,
      [userId]
    );

    let total = 0;
    cartItems.forEach(item => {
      total += item.price * item.quantity;
    });

    res.status(200).json({
      items: cartItems,
      total: total.toFixed(2),
      itemCount: cartItems.length
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to fetch cart', message: error.message });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const userId = req.userId;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    // Verify item belongs to user
    const [items] = await db.connection.query(
      'SELECT id FROM cart_items WHERE id = ? AND user_id = ?',
      [itemId, userId]
    );

    if (items.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    await db.connection.query(
      'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
      [quantity, itemId, userId]
    );

    res.status(200).json({ message: 'Cart item updated successfully' });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Failed to update cart item', message: error.message });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.userId;

    await db.connection.query(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
      [itemId, userId]
    );

    res.status(200).json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove item', message: error.message });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.userId;

    await db.connection.query(
      'DELETE FROM cart_items WHERE user_id = ?',
      [userId]
    );

    res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Failed to clear cart', message: error.message });
  }
};
