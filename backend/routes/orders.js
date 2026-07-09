const express = require('express');
const crypto = require('crypto');
const { read, write } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { razorpay, isConfigured } = require('../lib/razorpay');

const router = express.Router();
router.use(requireAuth);

async function buildLineItems(userId) {
  const carts = await read('carts');
  const products = await read('products');
  const items = carts[userId] || [];
  if (items.length === 0) return null;

  const lineItems = [];
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    if (item.quantity > product.stockQty) {
      return { error: `${product.name} only has ${product.stockQty} left in stock` };
    }
    lineItems.push({ productId: product.id, name: product.name, price: product.price, quantity: item.quantity });
  }
  if (lineItems.length === 0) return null;
  return { lineItems };
}

async function decrementStock(lineItems) {
  const products = await read('products');
  lineItems.forEach((li) => {
    const product = products.find((p) => p.id === li.productId);
    if (product) product.stockQty = Math.max(0, product.stockQty - li.quantity);
  });
  await write('products', products);
}

async function findAddress(userId, addressId) {
  const users = await read('users');
  const user = users.find((u) => u.id === userId);
  return (user?.addresses || []).find((a) => a.id === addressId);
}

router.get('/', async (req, res, next) => {
  try {
    const orders = (await read('orders'))
      .filter((o) => o.userId === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const order = (await read('orders')).find((o) => o.id === req.params.id && o.userId === req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// Create an order. paymentMethod: 'cod' | 'razorpay'
router.post('/', async (req, res, next) => {
  try {
    const { addressId, paymentMethod } = req.body;
    if (!['cod', 'razorpay'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'paymentMethod must be "cod" or "razorpay"' });
    }
    const address = await findAddress(req.user.id, addressId);
    if (!address) return res.status(400).json({ error: 'Select a valid shipping address' });

    const built = await buildLineItems(req.user.id);
    if (!built) return res.status(400).json({ error: 'Cart is empty' });
    if (built.error) return res.status(409).json({ error: built.error });

    const total = built.lineItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const orders = await read('orders');

    if (paymentMethod === 'cod') {
      const order = {
        id: crypto.randomUUID(),
        userId: req.user.id,
        items: built.lineItems,
        total,
        address,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };
      await decrementStock(built.lineItems);
      orders.push(order);
      await write('orders', orders);
      const carts = await read('carts');
      carts[req.user.id] = [];
      await write('carts', carts);
      return res.status(201).json(order);
    }

    // razorpay
    if (!isConfigured) {
      return res.status(503).json({ error: 'Online payments are not configured yet. Please use Cash on Delivery.' });
    }
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });

    const order = {
      id: crypto.randomUUID(),
      userId: req.user.id,
      items: built.lineItems,
      total,
      address,
      paymentMethod: 'razorpay',
      paymentStatus: 'awaiting_payment',
      status: 'pending_payment',
      razorpayOrderId: razorpayOrder.id,
      createdAt: new Date().toISOString(),
    };
    orders.push(order);
    await write('orders', orders);

    res.status(201).json({
      order,
      razorpay: { orderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency, keyId: process.env.RAZORPAY_KEY_ID },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/verify', async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const orders = await read('orders');
    const order = orders.find((o) => o.id === req.params.id && o.userId === req.user.id);
    if (!order || order.razorpayOrderId !== razorpay_order_id) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      order.paymentStatus = 'failed';
      await write('orders', orders);
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.razorpayPaymentId = razorpay_payment_id;
    await decrementStock(order.items);
    await write('orders', orders);

    const carts = await read('carts');
    carts[req.user.id] = [];
    await write('carts', carts);

    res.json(order);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
