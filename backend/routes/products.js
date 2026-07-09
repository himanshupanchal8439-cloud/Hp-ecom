const express = require('express');
const { read } = require('../db');
const { withStockStatus } = require('../lib/stock');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const products = (await read('products')).map(withStockStatus);
    res.json(products);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const products = await read('products');
    const product = products.find((p) => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(withStockStatus(product));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
