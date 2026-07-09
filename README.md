# HIM-STORE

A structural-basics e-commerce site: Node/Express backend (JWT auth) serving a static frontend styled after the editorial-grid design reference. Storage is Postgres when `DATABASE_URL` is set, falling back to local JSON files otherwise.

## Run

```bash
cd backend
npm install
npm start
```

Then open http://localhost:4000

## Structure

- `backend/` — Express API (`/api/products`, `/api/auth`, `/api/cart`, `/api/orders`) and static file serving
- `backend/db.js` — storage layer: Postgres (`app_data` key/value table) when `DATABASE_URL` is set, else JSON files in `backend/data/`
- `backend/data/products.json` — the seed product catalog (also used to seed Postgres the first time)
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
- Set env vars: `JWT_SECRET` (auto-generated), `ADMIN_EMAIL`, `DATABASE_URL`
  (see below), and `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` if you want
  online payments
- Note the resulting URL, e.g. `https://himstore-backend.onrender.com`
- **Persistent storage (`DATABASE_URL`)**: Render's free web service disk is
  ephemeral — without a real database, `backend/data/*.json` (users, carts,
  orders) resets on every redeploy/restart. Create a free Render Postgres
  instance (New → PostgreSQL), copy its **Internal Connection String**, and
  set it as `DATABASE_URL` on the web service. The app auto-creates the table
  it needs and seeds the product catalog on first run — no manual SQL needed.
  Without `DATABASE_URL` set, it just falls back to the JSON files (fine for
  quick local testing, not for production).

**2. Deploy the frontend to Netlify**
- New site → "himstore" → connect this repo → Netlify reads `netlify.toml`
  (base dir `frontend`, publish `.`, no build step)
- Edit `frontend/js/config.js` and set:
  ```js
  window.HIMSTORE_API_BASE = 'https://himstore-backend.onrender.com/api';
  ```
  (use your actual Render URL), commit, and Netlify will redeploy automatically
- Your site is now live at `https://himstore.netlify.app` (or your custom domain)
