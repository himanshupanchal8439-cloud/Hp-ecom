const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');

function filePath(name) {
  return path.join(dataDir, `${name}.json`);
}

function read(name) {
  return JSON.parse(fs.readFileSync(filePath(name), 'utf-8'));
}

function write(name, data) {
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2));
}

module.exports = { read, write };
