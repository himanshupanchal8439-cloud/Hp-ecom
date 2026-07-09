const express = require('express');
const crypto = require('crypto');
const { read, write } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { withStockStatus } = require('../lib/stock');

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/products', async (req, res, next) => {
  try {
    res.json((await read('products')).map(withStockStatus));
  } catch (err) {
    next(err);
  }
});

router.post('/products', async (req, res, next) => {
  try {
    const { name, price, category, stockQty, front, back, description, mrp, discountPercent } = req.body;
    if (!name || price == null || !category || stockQty == null || !front || !back) {
      return res.status(400).json({ error: 'name, price, category, stockQty, front and back are required' });
    }
    const products = await read('products');
    const product = {
      id: crypto.randomUUID(),
      name,
      price: Number(price),
      category,
      stockQty: Number(stockQty),
      front,
      back,
      description: description || '',
      mrp: mrp != null && mrp !== '' ? Number(mrp) : undefined,
      discountPercent: discountPercent != null && discountPercent !== '' ? Number(discountPercent) : undefined,
    };
    products.push(product);
    await write('products', products);
    res.status(201).json(withStockStatus(product));
  } catch (err) {
    next(err);
  }
});

router.put('/products/:id', async (req, res, next) => {
  try {
    const products = await read('products');
    const product = products.find((p) => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const { name, price, category, stockQty, front, back, description, mrp, discountPercent } = req.body;
    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = Number(price);
    if (category !== undefined) product.category = category;
    if (stockQty !== undefined) product.stockQty = Number(stockQty);
    if (front !== undefined) product.front = front;
    if (back !== undefined) product.back = back;
    if (description !== undefined) product.description = description;
    if (mrp !== undefined) product.mrp = mrp === '' ? undefined : Number(mrp);
    if (discountPercent !== undefined) product.discountPercent = discountPercent === '' ? undefined : Number(discountPercent);
    await write('products', products);
    res.json(withStockStatus(product));
  } catch (err) {
    next(err);
  }
});

router.delete('/products/:id', async (req, res, next) => {
  try {
    const products = await read('products');
    const next_ = products.filter((p) => p.id !== req.params.id);
    if (next_.length === products.length) return res.status(404).json({ error: 'Product not found' });
    await write('products', next_);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.get('/orders', async (req, res, next) => {
  try {
    const orders = (await read('orders')).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

const VALID_STATUSES = ['pending_payment', 'confirmed', 'shipped', 'delivered', 'cancelled'];

router.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    const orders = await read('orders');
    const order = orders.find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.status = status;
    await write('orders', orders);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const users = (await read('users')).map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
    res.json(users);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
