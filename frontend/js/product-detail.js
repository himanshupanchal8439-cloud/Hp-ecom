(async function initProductDetailPage() {
  const root = document.getElementById('pdpRoot');
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    root.innerHTML = '<div class="empty-state">No product specified.</div>';
    return;
  }

  let product;
  try {
    product = await api(`/products/${id}`);
  } catch (e) {
    root.innerHTML = `<div class="empty-state">${e.message}</div>`;
    return;
  }

  document.title = `${product.name} — HIM-STORE`;

  const outOfStock = product.stock === 'out-of-stock';
  const hasDiscount = product.discountPercent > 0 && product.mrp > product.price;
  const stockText = { 'in-stock': 'In stock', 'low-stock': 'Low stock — almost gone', 'out-of-stock': 'Out of stock' }[product.stock] || 'In stock';
  const stockClass = { 'in-stock': '', 'low-stock': 'low', 'out-of-stock': 'restocking' }[product.stock] || '';

  root.innerHTML = `
    <div class="pdp-grid">
      <div class="pdp-gallery">
        <div class="pdp-main-image">
          ${hasDiscount ? `<span class="discount-badge">${product.discountPercent}% OFF</span>` : ''}
          <img src="${product.front}" alt="${product.name}" id="pdpMainImg" />
        </div>
        <div class="pdp-thumbs">
          <button class="pdp-thumb active" data-src="${product.front}"><img src="${product.front}" alt="${product.name} front" /></button>
          <button class="pdp-thumb" data-src="${product.back}"><img src="${product.back}" alt="${product.name} back" /></button>
        </div>
      </div>

      <div class="pdp-info">
        <div class="pdp-category">${product.category}</div>
        <h1 class="pdp-name">${product.name}</h1>
        <div class="pdp-price-row">
          <span class="pdp-price">₹${product.price}</span>
          ${hasDiscount ? `<span class="pdp-mrp">₹${product.mrp}</span><span class="pdp-discount-pill">${product.discountPercent}% OFF</span>` : ''}
        </div>
        <div class="card-tag pdp-stock ${stockClass}"><i></i>${stockText}</div>
        <p class="pdp-desc">${product.description || ''}</p>

        <div class="pdp-qty" id="pdpQtyWrap" style="${outOfStock ? 'display:none;' : ''}">
          <button type="button" id="pdpQtyMinus" aria-label="Decrease quantity">−</button>
          <span id="pdpQtyValue">1</span>
          <button type="button" id="pdpQtyPlus" aria-label="Increase quantity">+</button>
        </div>

        <div class="pdp-actions">
          <button class="full-btn" id="pdpBuyNow" ${outOfStock ? 'disabled' : ''}>${outOfStock ? 'Out of stock' : 'Buy now'}</button>
          <button class="ghost-btn" id="pdpAddToCart" ${outOfStock ? 'disabled' : ''}>Add to bag</button>
        </div>

        <div class="pdp-meta">
          <span>Free express shipping on orders over ₹5000</span>
          <span>Cash on Delivery available, or pay online via UPI/card/netbanking</span>
          <span>Easy returns within 7 days of delivery</span>
        </div>
      </div>
    </div>`;

  // Thumbnail swap
  let qty = 1;
  root.querySelectorAll('.pdp-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      root.querySelectorAll('.pdp-thumb').forEach((t) => t.classList.remove('active'));
      thumb.classList.add('active');
      const img = document.getElementById('pdpMainImg');
      img.classList.add('swap');
      setTimeout(() => {
        img.src = thumb.dataset.src;
        img.classList.remove('swap');
      }, 180);
    });
  });

  if (!outOfStock) {
    const qtyValueEl = document.getElementById('pdpQtyValue');
    document.getElementById('pdpQtyMinus').addEventListener('click', () => {
      if (qty > 1) qtyValueEl.textContent = --qty;
    });
    document.getElementById('pdpQtyPlus').addEventListener('click', () => {
      qtyValueEl.textContent = ++qty;
    });

    document.getElementById('pdpAddToCart').addEventListener('click', async () => {
      if (!state.token) return addToCart(product.id);
      try {
        state.cart = await api('/cart', { method: 'POST', body: JSON.stringify({ productId: product.id, quantity: qty }) });
        renderCart();
        showToast('Added to bag');
      } catch (e) {
        showToast(e.message);
      }
    });

    document.getElementById('pdpBuyNow').addEventListener('click', async () => {
      if (!state.token) {
        state.authMode = 'login';
        updateAuthUI();
        openOverlay('authOverlay');
        showToast('Sign in to buy this item');
        return;
      }
      try {
        state.cart = await api('/cart', { method: 'POST', body: JSON.stringify({ productId: product.id, quantity: qty }) });
        renderCart();
        await openCheckout();
      } catch (e) {
        showToast(e.message);
      }
    });
  }
})();
