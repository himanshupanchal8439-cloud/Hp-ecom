import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import './admin.css';

const STATUSES = ['pending_payment', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const emptyProduct = { id: '', name: '', category: '', price: '', stockQty: '', mrp: '', discountPercent: '', front: '', back: '', description: '' };

function ProductForm({ editing, onSaved, onCancel }) {
  const showToast = useToast();
  const [form, setForm] = useState(emptyProduct);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setForm(
      editing
        ? {
            id: editing.id,
            name: editing.name,
            category: editing.category,
            price: editing.price,
            stockQty: editing.stockQty,
            mrp: editing.mrp || '',
            discountPercent: editing.discountPercent || '',
            front: editing.front,
            back: editing.back,
            description: editing.description || '',
          }
        : emptyProduct
    );
    setMsg('');
  }, [editing]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    const body = {
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      stockQty: Number(form.stockQty),
      front: form.front.trim(),
      back: form.back.trim(),
      description: form.description.trim(),
      mrp: form.mrp,
      discountPercent: form.discountPercent,
    };
    try {
      if (editing) {
        await api(`/admin/products/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) });
        showToast('Product updated');
      } else {
        await api('/admin/products', { method: 'POST', body: JSON.stringify(body) });
        showToast('Product added');
      }
      onSaved();
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <form className="grid-form" onSubmit={submit}>
      <div className="field"><label>Name</label><input required value={form.name} onChange={set('name')} /></div>
      <div className="field"><label>Category</label><input required value={form.category} onChange={set('category')} /></div>
      <div className="field"><label>Price (₹)</label><input type="number" min="0" step="1" required value={form.price} onChange={set('price')} /></div>
      <div className="field"><label>Stock qty</label><input type="number" min="0" step="1" required value={form.stockQty} onChange={set('stockQty')} /></div>
      <div className="field"><label>MRP / original price (₹, optional)</label><input type="number" min="0" step="1" value={form.mrp} onChange={set('mrp')} /></div>
      <div className="field"><label>Discount % (optional)</label><input type="number" min="0" max="90" step="1" value={form.discountPercent} onChange={set('discountPercent')} /></div>
      <div className="field"><label>Front image URL</label><input required value={form.front} onChange={set('front')} /></div>
      <div className="field"><label>Back image URL</label><input required value={form.back} onChange={set('back')} /></div>
      <div className="field span2"><label>Description</label><input value={form.description} onChange={set('description')} /></div>
      <div className="form-msg span2">{msg}</div>
      <button className="full-btn" type="submit">{editing ? 'Save changes' : 'Add product'}</button>
      {editing && (
        <button className="ghost-btn span2" type="button" onClick={onCancel}>Cancel edit</button>
      )}
    </form>
  );
}

function ProductsTab() {
  const showToast = useToast();
  const [products, setProducts] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = () => api('/admin/products').then(setProducts).catch(() => showToast('Failed to load products'));

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api(`/admin/products/${id}`, { method: 'DELETE' });
      showToast('Product deleted');
      load();
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <div className="tabpane active">
      <div className="table-scroll">
        <table>
          <thead><tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Discount</th><th>Stock</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td><img src={p.front} alt={p.name} /></td>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>₹{p.price}{p.mrp ? <s style={{ opacity: 0.5 }}> ₹{p.mrp}</s> : null}</td>
                <td>{p.discountPercent ? `${p.discountPercent}%` : '—'}</td>
                <td>{p.stockQty} ({p.stock})</td>
                <td className="row-actions">
                  <button onClick={() => setEditing(p)}>Edit</button>
                  <button className="danger" onClick={() => deleteProduct(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProductForm
        editing={editing}
        onSaved={() => {
          setEditing(null);
          load();
        }}
        onCancel={() => setEditing(null)}
      />
    </div>
  );
}

function OrdersTab() {
  const showToast = useToast();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api('/admin/orders').then(setOrders).catch(() => showToast('Failed to load orders'));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const changeStatus = async (id, status) => {
    try {
      await api(`/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      showToast('Order status updated');
      setOrders((list) => list.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch (err) {
      showToast(err.message);
    }
  };

  return (
    <div className="tabpane active">
      <div className="table-scroll">
        <table>
          <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead>
          <tbody>
            {orders === null ? (
              <tr><td colSpan={6} className="empty-state">Loading orders…</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} className="empty-state">No orders yet.</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id}>
                  <td>#{o.id.slice(0, 8)}<br /><span style={{ opacity: 0.5, fontSize: '.75rem' }}>{new Date(o.createdAt).toLocaleString()}</span></td>
                  <td>{o.address?.fullName || '—'}<br /><span style={{ opacity: 0.6, fontSize: '.8rem' }}>{o.address?.phone || ''}</span></td>
                  <td>{o.items.map((i, idx) => (<span key={i.productId}>{i.name} × {i.quantity}{idx < o.items.length - 1 && <br />}</span>))}</td>
                  <td>₹{o.total}</td>
                  <td>{o.paymentMethod === 'cod' ? 'COD' : 'Razorpay'}<br /><span style={{ opacity: 0.6, fontSize: '.8rem' }}>{o.paymentStatus || ''}</span></td>
                  <td>
                    <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)}>
                      {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const user = await login(email, password);
      if (user.role !== 'admin') throw new Error('This account does not have admin access.');
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div className="locked">
      <form style={{ maxWidth: 360, margin: '0 auto', textAlign: 'left' }} onSubmit={submit}>
        <div className="field">
          <label>Email</label>
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="form-msg">{msg}</div>
        <button className="full-btn" type="submit">Sign in as admin</button>
      </form>
    </div>
  );
}

export default function Admin() {
  const { user, ready, signOut } = useAuth();
  const { theme, setTheme } = useUI();
  const [tab, setTab] = useState('products');

  const isAdmin = user?.role === 'admin';

  return (
    <>
      <nav className="admin-nav">
        <a href="/" className="wordmark">HIM-STORE</a>
        <div className="nav-right">
          {isAdmin && (
            <span style={{ opacity: 0.85 }}>
              {user.name} (admin) &nbsp;
              <button style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }} onClick={signOut}>
                Sign out
              </button>
            </span>
          )}
          <div className="dots">
            {['cream', 'dark', 'red'].map((t) => (
              <div key={t} data-t={t} className={`dot${theme === t ? ' active' : ''}`} onClick={() => setTheme(t)} />
            ))}
          </div>
        </div>
      </nav>

      <main className="admin-wrap">
        <h1 className="serif" style={{ fontSize: '2rem', marginBottom: 4 }}>Admin Dashboard</h1>
        <p style={{ opacity: 0.6, marginTop: 0 }}>Manage products, stock and orders.</p>

        {!ready ? null : !isAdmin ? (
          <AdminLogin />
        ) : (
          <div>
            <div className="tabbar">
              <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>Products</button>
              <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>Orders</button>
            </div>
            {tab === 'products' ? <ProductsTab /> : <OrdersTab />}
          </div>
        )}
      </main>
    </>
  );
}
