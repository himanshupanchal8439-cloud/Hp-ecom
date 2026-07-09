function stockStatus(qty) {
  if (qty <= 0) return 'out-of-stock';
  if (qty <= 5) return 'low-stock';
  return 'in-stock';
}

function withStockStatus(product) {
  return { ...product, stock: stockStatus(product.stockQty) };
}

module.exports = { stockStatus, withStockStatus };
