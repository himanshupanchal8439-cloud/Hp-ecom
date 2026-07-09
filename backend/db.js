const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');

// Fresh deploys (Render, etc.) don't get users/carts/orders committed to git —
// they're gitignored to keep password hashes and customer data out of source
// control. Fall back to these defaults instead of crashing on ENOENT.
const DEFAULTS = {
  users: [],
  carts: {},
  orders: [],
  products: [],
};

function filePath(name) {
  return path.join(dataDir, `${name}.json`);
}

function read(name) {
  try {
    return JSON.parse(fs.readFileSync(filePath(name), 'utf-8'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      const fallback = DEFAULTS[name] ?? [];
      write(name, fallback);
      return fallback;
    }
    throw err;
  }
}

function write(name, data) {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2));
}

module.exports = { read, write };
