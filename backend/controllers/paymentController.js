const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/database');

// Create payment intent
exports.createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.userId;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Get order
    const [orders] = await db.connection.query(
      'SELECT id, total_price FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];
    const amountInCents = Math.round(parseFloat(order.total_price) * 100);

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: { orderId, userId }
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent', message: error.message });
  }
};

// Confirm payment
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;
    const userId = req.userId;

    if (!paymentIntentId || !orderId) {
      return res.status(400).json({ error: 'Payment intent ID and order ID are required' });
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment did not succeed', status: paymentIntent.status });
    }

    // Update order status to paid
    await db.connection.query(
      'UPDATE orders SET status = ? WHERE id = ? AND user_id = ?',
      ['processing', orderId, userId]
    );

    // Record payment
    await db.connection.query(
      'INSERT INTO payments (order_id, payment_method, status, stripe_transaction_id) VALUES (?, ?, ?, ?)',
      [orderId, 'stripe', 'completed', paymentIntentId]
    );

    res.status(200).json({
      message: 'Payment confirmed successfully',
      orderId,
      status: 'completed'
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment', message: error.message });
  }
};

// Webhook handler for Stripe events
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Update order status
      await db.connection.query(
        'UPDATE orders SET status = ? WHERE id = ?',
        ['processing', paymentIntent.metadata.orderId]
      );
      break;
    case 'payment_intent.payment_failed':
      const failedIntent = event.data.object;
      // Update order status
      await db.connection.query(
        'UPDATE orders SET status = ? WHERE id = ?',
        ['payment_failed', failedIntent.metadata.orderId]
      );
      break;
  }

  res.json({ received: true });
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    const [payments] = await db.connection.query(
      'SELECT status, stripe_transaction_id FROM payments WHERE order_id = ? AND order_id IN (SELECT id FROM orders WHERE user_id = ?)',
      [orderId, userId]
    );

    if (payments.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.status(200).json(payments[0]);
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Failed to fetch payment status', message: error.message });
  }
};
