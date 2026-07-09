const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { read, write } = require('../db');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');

const router = express.Router();

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, addresses: user.addresses || [] };
}

function signToken(user) {
  return jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

// Keeps the designated admin account correct even if ADMIN_EMAIL was set
// (or changed) after the account already existed.
async function syncAdminRole(user, users) {
  const isDesignatedAdmin = process.env.ADMIN_EMAIL && user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
  if (isDesignatedAdmin && user.role !== 'admin') {
    user.role = 'admin';
    await write('users', users);
  }
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const users = await read('users');
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const role = process.env.ADMIN_EMAIL && email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase() ? 'admin' : 'customer';
    const user = { id: crypto.randomUUID(), name, email, passwordHash, role, addresses: [] };
    users.push(user);
    await write('users', users);

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const users = await read('users');
    const user = users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
    if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    await syncAdminRole(user, users);
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const users = await read('users');
    const user = users.find((u) => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(publicUser(user));
  } catch (err) {
    next(err);
  }
});

router.post('/addresses', requireAuth, async (req, res, next) => {
  try {
    const { fullName, line1, line2, city, state, postalCode, phone } = req.body;
    if (!fullName || !line1 || !city || !state || !postalCode || !phone) {
      return res.status(400).json({ error: 'All address fields except line2 are required' });
    }
    const users = await read('users');
    const user = users.find((u) => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const address = { id: crypto.randomUUID(), fullName, line1, line2: line2 || '', city, state, postalCode, phone };
    user.addresses = user.addresses || [];
    user.addresses.push(address);
    await write('users', users);
    res.status(201).json(user.addresses);
  } catch (err) {
    next(err);
  }
});

router.delete('/addresses/:id', requireAuth, async (req, res, next) => {
  try {
    const users = await read('users');
    const user = users.find((u) => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.addresses = (user.addresses || []).filter((a) => a.id !== req.params.id);
    await write('users', users);
    res.json(user.addresses);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
