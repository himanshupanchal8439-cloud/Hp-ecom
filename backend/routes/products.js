const express = require('express');
const { read } = require('../db');
const { withStockStatus } = require('../lib/stock');

const router = express.Router();

router.get('/', (req, res) => {
  const products = read('products').map(withStockStatus);
  res.json(products);
});

router.get('/:id', (req, res) => {
  const products = read('products');
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(withStockStatus(product));
});

module.exports = router;
