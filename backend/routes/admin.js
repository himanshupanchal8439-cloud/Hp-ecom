const express = require('express');
const crypto = require('crypto');
const { read, write } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { withStockStatus } = require('../lib/stock');

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/products', (req, res) => {
  res.json(read('products').map(withStockStatus));
});

router.post('/products', (req, res) => {
  const { name, price, category, stockQty, front, back, description } = req.body;
  if (!name || price == null || !category || stockQty == null || !front || !back) {
    return res.status(400).json({ error: 'name, price, category, stockQty, front and back are required' });
  }
  const products = read('products');
  const product = {
    id: crypto.randomUUID(),
    name,
    price: Number(price),
    category,
    stockQty: Number(stockQty),
    front,
    back,
    description: description || '',
  };
  products.push(product);
  write('products', products);
  res.status(201).json(withStockStatus(product));
});

router.put('/products/:id', (req, res) => {
  const products = read('products');
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const { name, price, category, stockQty, front, back, description } = req.body;
  if (name !== undefined) product.name = name;
  if (price !== undefined) product.price = Number(price);
  if (category !== undefined) product.category = category;
  if (stockQty !== undefined) product.stockQty = Number(stockQty);
  if (front !== undefined) product.front = front;
  if (back !== undefined) product.back = back;
  if (description !== undefined) product.description = description;
  write('products', products);
  res.json(withStockStatus(product));
});

router.delete('/products/:id', (req, res) => {
  const products = read('products');
  const next = products.filter((p) => p.id !== req.params.id);
  if (next.length === products.length) return res.status(404).json({ error: 'Product not found' });
  write('products', next);
  res.status(204).end();
});

router.get('/orders', (req, res) => {
  const orders = read('orders').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(orders);
});

const VALID_STATUSES = ['pending_payment', 'confirmed', 'shipped', 'delivered', 'cancelled'];

router.patch('/orders/:id/status', (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  const orders = read('orders');
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.status = status;
  write('orders', orders);
  res.json(order);
});

router.get('/users', (req, res) => {
  const users = read('users').map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
  res.json(users);
});

module.exports = router;
