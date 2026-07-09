require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { ensureSchema, usePg } = require('./db');
const productsRouter = require('./routes/products');
const authRouter = require('./routes/auth');
const cartRouter = require('./routes/cart');
const ordersRouter = require('./routes/orders');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  helmet({
    contentSecurityPolicy: false, // relaxed for the static frontend + Razorpay checkout script
  })
);
app.use(cors());
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});

app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`HIM-STORE server running at http://localhost:${PORT}`);
      console.log(usePg ? 'Using Postgres for persistent storage.' : 'Using local JSON files for storage (set DATABASE_URL for persistent Postgres).');
      if (!process.env.RAZORPAY_KEY_ID) {
        console.log('Razorpay keys not set — online payments disabled, Cash on Delivery still works. See backend/.env.example');
      }
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
