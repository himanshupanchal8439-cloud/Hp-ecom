const db = require('../config/database');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    const [products] = await db.connection.query(
      'SELECT id, name, price, description, stock, image_url FROM products LIMIT ? OFFSET ?',
      [parseInt(limit), offset]
    );

    const [[{ total }]] = await db.connection.query(
      'SELECT COUNT(*) as total FROM products'
    );

    res.status(200).json({
      products,
      pagination: { page, limit, total }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products', message: error.message });
  }
};

// Get single product
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await db.connection.query(
      'SELECT id, name, price, description, stock, image_url FROM products WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json(products[0]);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product', message: error.message });
  }
};

// Create product (admin)
exports.createProduct = async (req, res) => {
  try {
    const { name, price, description, stock, imageUrl } = req.body;

    if (!name || !price || !stock) {
      return res.status(400).json({ error: 'Name, price, and stock are required' });
    }

    const [result] = await db.connection.query(
      'INSERT INTO products (name, price, description, stock, image_url) VALUES (?, ?, ?, ?, ?)',
      [name, price, description || null, stock, imageUrl || null]
    );

    res.status(201).json({
      message: 'Product created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product', message: error.message });
  }
};

// Update product (admin)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, stock, imageUrl } = req.body;

    await db.connection.query(
      'UPDATE products SET name = ?, price = ?, description = ?, stock = ?, image_url = ? WHERE id = ?',
      [name, price, description, stock, imageUrl, id]
    );

    res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product', message: error.message });
  }
};

// Delete product (admin)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await db.connection.query('DELETE FROM products WHERE id = ?', [id]);

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product', message: error.message });
  }
};
