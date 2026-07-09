const API = '/api';

const state = {
  products: [],
  cart: [],
  addresses: [],
  selectedAddressId: null,
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  authMode: 'login',
  pendingRazorpayOrder: null,
};

function authHeaders() {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {};
}

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

/* ---------- Theme ---------- */
const dots = document.querySelectorAll('.dot');
const html = document.documentElement;
function setTheme(t) {
  html.setAttribute('data-theme', t);
  dots.forEach((d) => d.classList.toggle('active', d.dataset.t === t));
  localStorage.setItem('theme', t);
}
dots.forEach((d) => d.addEventListener('click', () => setTheme(d.dataset.t)));
setTheme(localStorage.getItem('theme') || 'cream');

/* ---------- Overlays ---------- */
function openOverlay(id) { document.getElementById(id).classList.add('open'); }
function closeOverlay(id) { document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('[data-close]').forEach((btn) =>
  btn.addEventListener('click', () => closeOverlay(btn.dataset.close))
);
document.querySelectorAll('.overlay').forEach((ov) =>
  ov.addEventListener('click', (e) => { if (e.target === ov) closeOverlay(ov.id); })
);

/* ---------- Toast ---------- */
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

/* ---------- Products ---------- */
const stockLabel = { 'in-stock': 'In stock', 'low-stock': 'Low stock', 'out-of-stock': 'Out of stock' };
const stockClass = { 'in-stock': '', 'low-stock': 'low', 'out-of-stock': 'restocking' };

function productCard(p) {
  return `
    <button class="card" data-id="${p.id}">
      <div class="card-media">
        <div class="swatch front"><img src="${p.front}" alt="${p.name}, front"><span class="swatch-label">Front</span></div>
        <div class="swatch back"><img src="${p.back}" alt="${p.name}, back"><span class="swatch-label">Back</span></div>
      </div>
      <div class="card-info"><span>${p.name}</span><span class="price">₹${p.price}</span></div>
      <div class="card-tag ${stockClass[p.stock] || ''}"><i></i>${stockLabel[p.stock] || 'In stock'}</div>
    </button>`;
}

function renderProducts() {
  const container = document.getElementById('productSections');
  if (state.products.length === 0) {
    container.innerHTML = '<div class="empty-state">No products available right now.</div>';
    return;
  }
  const byCategory = {};
  state.products.forEach((p) => {
    (byCategory[p.category] ||= []).push(p);
  });
  const sections = Object.entries(byCategory)
    .map(
      ([category, items], i) => `
      <div class="section-head" style="${i > 0 ? 'margin-top:56px;' : ''}">
        <h2>${category}</h2>
        <span class="idx">${String(i + 1).padStart(2, '0')} / ${Object.keys(byCategory).length}</span>
      </div>
      <div class="grid">${items.map(productCard).join('')}</div>`
    )
    .join('');
  container.innerHTML = sections;
  container.querySelectorAll('.card').forEach((card) =>
    card.addEventListener('click', () => openProductDetail(card.dataset.id))
  );
}

async function loadProducts() {
  state.products = await api('/products');
  renderProducts();
}

function openProductDetail(id) {
  const p = state.products.find((x) => x.id === id);
  if (!p) return;
  const outOfStock = p.stock === 'out-of-stock';
  document.getElementById('productDetailBody').innerHTML = `
    <div class="product-detail">
      <div class="pd-media">
        <img src="${p.front}" alt="${p.name} front" />
        <img src="${p.back}" alt="${p.name} back" />
      </div>
      <div>
        <h3 class="pd-name">${p.name}</h3>
        <div class="pd-price">₹${p.price}</div>
        <p class="pd-desc">${p.description || ''}</p>
        <button class="full-btn" id="buyNowBtn" ${outOfStock ? 'disabled' : ''}>${outOfStock ? 'Out of stock' : 'Buy now'}</button>
        <button class="ghost-btn" id="addToCartBtn" ${outOfStock ? 'disabled' : ''}>${outOfStock ? '' : 'Add to bag'}</button>
      </div>
    </div>`;
  if (!outOfStock) {
    document.getElementById('addToCartBtn').addEventListener('click', () => addToCart(p.id));
    document.getElementById('buyNowBtn').addEventListener('click', () => buyNow(p.id));
  }
  openOverlay('productOverlay');
}

/* ---------- Cart ---------- */
function updateCartCount() {
  const count = state.cart.reduce((sum, i) => sum + i.quantity, 0);
  document.getElementById('cartCount').textContent = count;
}

function cartTotal() {
  return state.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function renderCart() {
  const container = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  if (state.cart.length === 0) {
    container.innerHTML = '<div class="empty-state">Your bag is empty.</div>';
    totalEl.textContent = '₹0';
    document.getElementById('checkoutBtn').disabled = true;
    updateCartCount();
    return;
  }
  container.innerHTML = state.cart
    .map(
      (item) => `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.front}" alt="${item.name}" />
        <div class="ci-info">
          <div class="ci-name">${item.name}</div>
          <div>₹${item.price} × ${item.quantity}</div>
          <div class="ci-controls">
            <button data-action="dec">−</button>
            <span>${item.quantity}</span>
            <button data-action="inc">+</button>
          </div>
          <button class="ci-remove" data-action="remove">Remove</button>
        </div>
      </div>`
    )
    .join('');
  totalEl.textContent = `₹${cartTotal()}`;
  document.getElementById('checkoutBtn').disabled = false;

  container.querySelectorAll('.cart-item').forEach((el) => {
    const id = el.dataset.id;
    const item = state.cart.find((i) => i.id === id);
    el.querySelector('[data-action="inc"]').addEventListener('click', () => changeQty(id, item.quantity + 1));
    el.querySelector('[data-action="dec"]').addEventListener('click', () => changeQty(id, item.quantity - 1));
    el.querySelector('[data-action="remove"]').addEventListener('click', () => changeQty(id, 0));
  });
  updateCartCount();
}

async function loadCart() {
  if (!state.token) { state.cart = []; renderCart(); return; }
  try {
    state.cart = await api('/cart');
  } catch {
    state.cart = [];
  }
  renderCart();
}

async function addToCart(productId) {
  if (!state.token) {
    closeOverlay('productOverlay');
    state.authMode = 'login';
    updateAuthUI();
    openOverlay('authOverlay');
    showToast('Sign in to add items to your bag');
    return false;
  }
  try {
    state.cart = await api('/cart', { method: 'POST', body: JSON.stringify({ productId, quantity: 1 }) });
    renderCart();
    showToast('Added to bag');
    return true;
  } catch (e) {
    showToast(e.message);
    return false;
  }
}

async function buyNow(productId) {
  const added = await addToCart(productId);
  if (!added) return;
  closeOverlay('productOverlay');
  await openCheckout();
}

async function changeQty(productId, quantity) {
  try {
    if (quantity <= 0) {
      state.cart = await api(`/cart/${productId}`, { method: 'DELETE' });
    } else {
      state.cart = await api(`/cart/${productId}`, { method: 'PUT', body: JSON.stringify({ quantity }) });
    }
    renderCart();
  } catch (e) {
    showToast(e.message);
  }
}

document.getElementById('cartToggle').addEventListener('click', () => openOverlay('cartOverlay'));

/* ---------- Checkout: addresses ---------- */
function renderAddressList() {
  const container = document.getElementById('addressList');
  if (state.addresses.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding:16px 0;">No saved addresses yet.</div>';
    return;
  }
  container.innerHTML = state.addresses
    .map(
      (a) => `
      <label class="field" style="flex-direction:row; align-items:flex-start; gap:10px; text-transform:none; letter-spacing:0; border:1px solid var(--line); padding:12px; border-radius:2px; margin-bottom:8px;">
        <input type="radio" name="shipAddress" value="${a.id}" style="width:auto; margin-top:3px;" ${a.id === state.selectedAddressId ? 'checked' : ''} />
        <span>
          <strong>${a.fullName}</strong> — ${a.phone}<br/>
          ${a.line1}${a.line2 ? ', ' + a.line2 : ''}, ${a.city}, ${a.state} ${a.postalCode}
        </span>
      </label>`
    )
    .join('');
  container.querySelectorAll('input[name="shipAddress"]').forEach((input) =>
    input.addEventListener('change', () => { state.selectedAddressId = input.value; })
  );
  if (!state.selectedAddressId) {
    state.selectedAddressId = state.addresses[0].id;
    const first = container.querySelector('input[name="shipAddress"]');
    if (first) first.checked = true;
  }
}

async function loadAddresses() {
  if (!state.token) return;
  const me = await api('/auth/me');
  state.addresses = me.addresses || [];
  renderAddressList();
}

document.getElementById('showAddAddress').addEventListener('click', () => {
  const form = document.getElementById('addAddressForm');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('addAddressForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('addrMsg');
  msg.textContent = '';
  const body = {
    fullName: document.getElementById('addrName').value.trim(),
    phone: document.getElementById('addrPhone').value.trim(),
    line1: document.getElementById('addrLine1').value.trim(),
    line2: document.getElementById('addrLine2').value.trim(),
    city: document.getElementById('addrCity').value.trim(),
    state: document.getElementById('addrState').value.trim(),
    postalCode: document.getElementById('addrPostal').value.trim(),
  };
  try {
    state.addresses = await api('/auth/addresses', { method: 'POST', body: JSON.stringify(body) });
    state.selectedAddressId = state.addresses[state.addresses.length - 1].id;
    renderAddressList();
    document.getElementById('addAddressForm').reset();
    document.getElementById('addAddressForm').style.display = 'none';
  } catch (err) {
    msg.textContent = err.message;
  }
});

/* ---------- Checkout: place order ---------- */
async function openCheckout() {
  if (!state.token) {
    state.authMode = 'login';
    updateAuthUI();
    openOverlay('authOverlay');
    return;
  }
  if (state.cart.length === 0) {
    showToast('Your bag is empty');
    return;
  }
  await loadAddresses();
  document.getElementById('checkoutTotal').textContent = `₹${cartTotal()}`;
  document.getElementById('checkoutMsg').textContent = '';
  closeOverlay('cartOverlay');
  openOverlay('checkoutOverlay');
}

document.getElementById('checkoutBtn').addEventListener('click', openCheckout);

document.getElementById('placeOrderBtn').addEventListener('click', async () => {
  const msg = document.getElementById('checkoutMsg');
  msg.textContent = '';
  if (!state.selectedAddressId) {
    msg.textContent = 'Add or select a shipping address first.';
    return;
  }
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  try {
    const result = await api('/orders', {
      method: 'POST',
      body: JSON.stringify({ addressId: state.selectedAddressId, paymentMethod }),
    });

    if (paymentMethod === 'cod') {
      finishCheckout(result);
      return;
    }

    // razorpay flow
    const { order, razorpay } = result;
    if (typeof Razorpay === 'undefined') {
      msg.textContent = 'Payment SDK failed to load. Check your connection and try again.';
      return;
    }
    const rzp = new Razorpay({
      key: razorpay.keyId,
      amount: razorpay.amount,
      currency: razorpay.currency,
      order_id: razorpay.orderId,
      name: 'HIM-STORE',
      description: 'Order payment',
      theme: { color: '#ff3b1f' },
      prefill: { name: state.user?.name, email: state.user?.email },
      handler: async (response) => {
        try {
          const verified = await api(`/orders/${order.id}/verify`, {
            method: 'POST',
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          finishCheckout(verified);
        } catch (err) {
          showToast(err.message);
        }
      },
      modal: { ondismiss: () => showToast('Payment cancelled') },
    });
    rzp.on('payment.failed', () => showToast('Payment failed. Please try again.'));
    rzp.open();
  } catch (err) {
    msg.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

function finishCheckout(order) {
  state.cart = [];
  renderCart();
  closeOverlay('checkoutOverlay');
  document.getElementById('orderConfirmBody').innerHTML = `
    <p style="font-family:'Fraunces',serif; font-size:1.2rem; margin:0 0 12px;">Thank you, ${state.user?.name || ''}.</p>
    <p style="opacity:.8; line-height:1.5;">Order <strong>#${order.id.slice(0, 8)}</strong> confirmed — total ₹${order.total}, paid via ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'}.</p>`;
  openOverlay('orderConfirmOverlay');
  showToast('Order confirmed');
}

/* ---------- Auth ---------- */
function updateAuthUI() {
  const isLogin = state.authMode === 'login';
  document.getElementById('authTitle').textContent = isLogin ? 'Sign In' : 'Create Account';
  document.getElementById('nameField').style.display = isLogin ? 'none' : 'flex';
  document.getElementById('authSubmit').textContent = isLogin ? 'Sign In' : 'Create Account';
  document.getElementById('authSwitchText').textContent = isLogin ? "Don't have an account?" : 'Already have an account?';
  document.getElementById('authSwitchBtn').textContent = isLogin ? 'Create one' : 'Sign in';
  document.getElementById('authMsg').textContent = '';
}

document.getElementById('authSwitchBtn').addEventListener('click', () => {
  state.authMode = state.authMode === 'login' ? 'register' : 'login';
  updateAuthUI();
});

function refreshUserStatus() {
  const status = document.getElementById('userStatus');
  const signOutBtn = document.getElementById('signOutBtn');
  const authForm = document.getElementById('authForm');
  const adminLink = document.getElementById('adminLink');
  if (state.user) {
    status.textContent = state.user.name;
    signOutBtn.style.display = 'block';
    authForm.style.display = 'none';
    document.getElementById('authTitle').textContent = 'Account';
    adminLink.style.display = state.user.role === 'admin' ? 'inline' : 'none';
  } else {
    status.textContent = 'Sign in';
    signOutBtn.style.display = 'none';
    authForm.style.display = 'block';
    adminLink.style.display = 'none';
  }
}

document.getElementById('userStatus').addEventListener('click', () => {
  if (!state.user) {
    state.authMode = 'login';
    updateAuthUI();
  }
  openOverlay('authOverlay');
});

document.getElementById('authForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('authMsg');
  msg.textContent = '';
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const name = document.getElementById('authName').value.trim();
  try {
    const path = state.authMode === 'login' ? '/auth/login' : '/auth/register';
    const body = state.authMode === 'login' ? { email, password } : { name, email, password };
    const data = await api(path, { method: 'POST', body: JSON.stringify(body) });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('token', state.token);
    localStorage.setItem('user', JSON.stringify(state.user));
    refreshUserStatus();
    closeOverlay('authOverlay');
    showToast(`Welcome, ${state.user.name}`);
    loadCart();
  } catch (err) {
    msg.textContent = err.message;
  }
});

document.getElementById('signOutBtn').addEventListener('click', () => {
  state.token = null;
  state.user = null;
  state.addresses = [];
  state.selectedAddressId = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  state.cart = [];
  renderCart();
  refreshUserStatus();
  closeOverlay('authOverlay');
  showToast('Signed out');
});

document.getElementById('homeLink').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ---------- Init ---------- */
async function verifySession() {
  if (!state.token) return;
  try {
    const me = await api('/auth/me');
    state.user = me;
    localStorage.setItem('user', JSON.stringify(me));
  } catch {
    state.token = null;
    state.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
  refreshUserStatus();
}

refreshUserStatus();
updateAuthUI();
loadProducts();
loadCart();
verifySession();
