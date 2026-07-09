const API = '/api';
let token = localStorage.getItem('token');

const dots = document.querySelectorAll('.dot');
const html = document.documentElement;
function setTheme(t) {
  html.setAttribute('data-theme', t);
  dots.forEach((d) => d.classList.toggle('active', d.dataset.t === t));
  localStorage.setItem('theme', t);
}
dots.forEach((d) => d.addEventListener('click', () => setTheme(d.dataset.t)));
setTheme(localStorage.getItem('theme') || 'cream');

let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

function lockPage() {
  document.getElementById('lockedMsg').style.display = 'block';
  document.getElementById('adminContent').style.display = 'none';
}

async function verifyAdmin() {
  if (!token) return lockPage();
  try {
    const me = await api('/auth/me');
    if (me.role !== 'admin') return lockPage();
    localStorage.setItem('user', JSON.stringify(me));
    document.getElementById('lockedMsg').style.display = 'none';
    document.getElementById('adminContent').style.display = 'block';
    document.getElementById('adminUser').innerHTML = `${me.name} (admin) &nbsp; <button id="adminSignOut" style="background:none;border:none;color:inherit;text-decoration:underline;cursor:pointer;">Sign out</button>`;
    document.getElementById('adminSignOut').addEventListener('click', () => {
      token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.getElementById('adminUser').textContent = '';
      lockPage();
    });
    init();
  } catch {
    lockPage();
  }
}

verifyAdmin();

document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('adminLoginMsg');
  msg.textContent = '';
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    if (data.user.role !== 'admin') {
      throw new Error('This account does not have admin access.');
    }
    token = data.token;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(data.user));
    document.getElementById('adminLoginForm').reset();
    verifyAdmin();
  } catch (err) {
    msg.textContent = err.message;
  }
});

document.querySelectorAll('.tab-btn').forEach((btn) =>
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tabpane').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  })
);

function init() {
  loadProducts().catch(lockPage);
  loadOrders().catch(lockPage);
  document.getElementById('productForm').addEventListener('submit', submitProduct);
  document.getElementById('productCancel').addEventListener('click', resetForm);
}

let editingId = null;

async function loadProducts() {
  const products = await api('/admin/products');
  const tbody = document.getElementById('productsTable');
  tbody.innerHTML = products
    .map(
      (p) => `
      <tr data-id="${p.id}">
        <td><img src="${p.front}" alt="${p.name}" /></td>
        <td>${p.name}</td>
        <td>${p.category}</td>
        <td>₹${p.price}</td>
        <td>${p.stockQty} (${p.stock})</td>
        <td class="row-actions">
          <button data-action="edit">Edit</button>
          <button data-action="delete" class="danger">Delete</button>
        </td>
      </tr>`
    )
    .join('');
  tbody.querySelectorAll('tr').forEach((row) => {
    const id = row.dataset.id;
    const p = products.find((x) => x.id === id);
    row.querySelector('[data-action="edit"]').addEventListener('click', () => editProduct(p));
    row.querySelector('[data-action="delete"]').addEventListener('click', () => deleteProduct(id));
  });
}

function editProduct(p) {
  editingId = p.id;
  document.getElementById('pId').value = p.id;
  document.getElementById('pName').value = p.name;
  document.getElementById('pCategory').value = p.category;
  document.getElementById('pPrice').value = p.price;
  document.getElementById('pStock').value = p.stockQty;
  document.getElementById('pFront').value = p.front;
  document.getElementById('pBack').value = p.back;
  document.getElementById('pDesc').value = p.description || '';
  document.getElementById('productSubmit').textContent = 'Save changes';
  document.getElementById('productCancel').style.display = 'block';
  window.scrollTo({ top: document.getElementById('productForm').offsetTop - 20, behavior: 'smooth' });
}

function resetForm() {
  editingId = null;
  document.getElementById('productForm').reset();
  document.getElementById('productSubmit').textContent = 'Add product';
  document.getElementById('productCancel').style.display = 'none';
}

async function submitProduct(e) {
  e.preventDefault();
  const msg = document.getElementById('productMsg');
  msg.textContent = '';
  const body = {
    name: document.getElementById('pName').value.trim(),
    category: document.getElementById('pCategory').value.trim(),
    price: Number(document.getElementById('pPrice').value),
    stockQty: Number(document.getElementById('pStock').value),
    front: document.getElementById('pFront').value.trim(),
    back: document.getElementById('pBack').value.trim(),
    description: document.getElementById('pDesc').value.trim(),
  };
  try {
    if (editingId) {
      await api(`/admin/products/${editingId}`, { method: 'PUT', body: JSON.stringify(body) });
      showToast('Product updated');
    } else {
      await api('/admin/products', { method: 'POST', body: JSON.stringify(body) });
      showToast('Product added');
    }
    resetForm();
    loadProducts();
  } catch (err) {
    msg.textContent = err.message;
  }
}

async function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  try {
    await api(`/admin/products/${id}`, { method: 'DELETE' });
    showToast('Product deleted');
    loadProducts();
  } catch (err) {
    showToast(err.message);
  }
}

const STATUSES = ['pending_payment', 'confirmed', 'shipped', 'delivered', 'cancelled'];

async function loadOrders() {
  const orders = await api('/admin/orders');
  const tbody = document.getElementById('ordersTable');
  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No orders yet.</td></tr>';
    return;
  }
  tbody.innerHTML = orders
    .map(
      (o) => `
      <tr data-id="${o.id}">
        <td>#${o.id.slice(0, 8)}<br/><span style="opacity:.5;font-size:.75rem;">${new Date(o.createdAt).toLocaleString()}</span></td>
        <td>${o.address?.fullName || '—'}<br/><span style="opacity:.6;font-size:.8rem;">${o.address?.phone || ''}</span></td>
        <td>${o.items.map((i) => `${i.name} × ${i.quantity}`).join('<br/>')}</td>
        <td>₹${o.total}</td>
        <td>${o.paymentMethod === 'cod' ? 'COD' : 'Razorpay'}<br/><span style="opacity:.6;font-size:.8rem;">${o.paymentStatus || ''}</span></td>
        <td>
          <select data-id="${o.id}">
            ${STATUSES.map((s) => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
      </tr>`
    )
    .join('');
  tbody.querySelectorAll('select').forEach((select) =>
    select.addEventListener('change', async () => {
      try {
        await api(`/admin/orders/${select.dataset.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: select.value }) });
        showToast('Order status updated');
      } catch (err) {
        showToast(err.message);
      }
    })
  );
}
