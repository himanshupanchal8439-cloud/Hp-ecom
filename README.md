# HIM-STORE

A structural-basics e-commerce site: Node/Express backend (JSON-file storage, JWT auth) serving a static frontend styled after the editorial-grid design reference.

## Run

```bash
cd backend
npm install
npm start
```

Then open http://localhost:4000

## Structure

- `backend/` — Express API (`/api/products`, `/api/auth`, `/api/cart`, `/api/orders`) and static file serving
- `backend/data/` — JSON-file "database" (products, users, carts, orders)
- `frontend/` — static site (index.html, css/style.css, js/app.js)

## Features

- Product catalog grouped by season/category, hover front/back swap
- Theme switcher (cream / dark / red)
- JWT-based register/login, saved shipping addresses
- Per-user cart (add, adjust quantity, remove), live stock tracking
- Checkout with Cash on Delivery or Razorpay (UPI/card/netbanking), order status tracking
- Admin dashboard (`admin.html`) — product CRUD, stock, order status

## Deploying: Netlify (frontend) + Render (backend)

Netlify only serves static files — it can't run the Express API or persist
the JSON-file "database". So the frontend goes on Netlify and the backend
goes on Render (or Railway/Fly.io), and the frontend calls the backend's
public URL.

**1. Deploy the backend to Render**
- New → Web Service → connect this GitHub repo → Render will read `render.yaml`
  (root dir `backend`, build `npm install`, start `npm start`)
- Set env vars: `JWT_SECRET` (auto-generated), `ADMIN_EMAIL`, and
  `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` if you want online payments
- Note the resulting URL, e.g. `https://himstore-backend.onrender.com`
- ⚠️ Render's free tier disk is ephemeral — `backend/data/*.json` (users,
  carts, orders) can reset on redeploy/restart. Fine for a demo; for real
  production data, swap the JSON-file store in `backend/db.js` for a real
  database (Postgres, etc.)

**2. Deploy the frontend to Netlify**
- New site → "himstore" → connect this repo → Netlify reads `netlify.toml`
  (base dir `frontend`, publish `.`, no build step)
- Edit `frontend/js/config.js` and set:
  ```js
  window.HIMSTORE_API_BASE = 'https://himstore-backend.onrender.com/api';
  ```
  (use your actual Render URL), commit, and Netlify will redeploy automatically
- Your site is now live at `https://himstore.netlify.app` (or your custom domain)
