const express = require('express');
const { read, write } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { withStockStatus } = require('../lib/stock');

const router = express.Router();
router.use(requireAuth);

async function getCartItems(userId) {
  const carts = await read('carts');
  const products = await read('products');
  const items = carts[userId] || [];
  return items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      return { ...withStockStatus(product), quantity: item.quantity };
    })
    .filter(Boolean);
}

router.get('/', async (req, res, next) => {
  try {
    res.json(await getCartItems(req.user.id));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }
    const products = await read('products');
    const product = products.find((p) => p.id === productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const carts = await read('carts');
    const items = carts[req.user.id] || [];
    const existing = items.find((i) => i.productId === productId);
    const nextQty = (existing ? existing.quantity : 0) + quantity;
    if (nextQty > product.stockQty) {
      return res.status(409).json({ error: `Only ${product.stockQty} left in stock` });
    }
    if (existing) {
      existing.quantity = nextQty;
    } else {
      items.push({ productId, quantity });
    }
    carts[req.user.id] = items;
    await write('carts', carts);
    res.status(201).json(await getCartItems(req.user.id));
  } catch (err) {
    next(err);
  }
});

router.put('/:productId', async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const carts = await read('carts');
    const items = carts[req.user.id] || [];
    const item = items.find((i) => i.productId === req.params.productId);
    if (!item) return res.status(404).json({ error: 'Item not in cart' });
    if (quantity <= 0) {
      carts[req.user.id] = items.filter((i) => i.productId !== req.params.productId);
    } else {
      const products = await read('products');
      const product = products.find((p) => p.id === req.params.productId);
      if (product && quantity > product.stockQty) {
        return res.status(409).json({ error: `Only ${product.stockQty} left in stock` });
      }
      item.quantity = quantity;
    }
    await write('carts', carts);
    res.json(await getCartItems(req.user.id));
  } catch (err) {
    next(err);
  }
});

router.delete('/:productId', async (req, res, next) => {
  try {
    const carts = await read('carts');
    const items = carts[req.user.id] || [];
    carts[req.user.id] = items.filter((i) => i.productId !== req.params.productId);
    await write('carts', carts);
    res.json(await getCartItems(req.user.id));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
