const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');

// When DATABASE_URL is set (Render Postgres, etc.), data persists in a real
// database instead of the ephemeral disk that resets on every deploy/restart
// on free hosting tiers. Without it (local dev), falls back to JSON files —
// no local Postgres needed to work on this project.
const usePg = Boolean(process.env.DATABASE_URL);

let pool;
if (usePg) {
  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
}

function filePath(name) {
  return path.join(dataDir, `${name}.json`);
}

// products.json ships in git as the seed catalog. Used as the initial value
// the first time 'products' is read from an empty Postgres database.
function seedProducts() {
  try {
    return JSON.parse(fs.readFileSync(filePath('products'), 'utf-8'));
  } catch {
    return [];
  }
}

const DEFAULTS = {
  users: [],
  carts: {},
  orders: [],
  get products() {
    return seedProducts();
  },
};

async function ensureSchema() {
  if (!usePg) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_data (
      name TEXT PRIMARY KEY,
      data JSONB NOT NULL
    )
  `);
}

async function read(name) {
  if (usePg) {
    const { rows } = await pool.query('SELECT data FROM app_data WHERE name = $1', [name]);
    if (rows.length === 0) {
      const fallback = DEFAULTS[name] ?? [];
      await write(name, fallback);
      return fallback;
    }
    return rows[0].data;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath(name), 'utf-8'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      const fallback = DEFAULTS[name] ?? [];
      await write(name, fallback);
      return fallback;
    }
    throw err;
  }
}

async function write(name, data) {
  if (usePg) {
    await pool.query(
      `INSERT INTO app_data (name, data) VALUES ($1, $2::jsonb)
       ON CONFLICT (name) DO UPDATE SET data = EXCLUDED.data`,
      [name, JSON.stringify(data)]
    );
    return;
  }

  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2));
}

module.exports = { read, write, ensureSchema, usePg };
