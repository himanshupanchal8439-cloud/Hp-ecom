import { useEffect, useState } from 'react';
import Overlay from './Overlay';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const emptyAddress = { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '' };

export default function AuthOverlay() {
  const { overlay, closeOverlay, openOverlay, authMode, setAuthMode } = useUI();
  const { user, login, register, signOut, refreshAddresses, addAddress, removeAddress } = useAuth();
  const showToast = useToast();
  const open = overlay === 'auth';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const [addresses, setAddresses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyAddress);
  const [addrMsg, setAddrMsg] = useState('');

  useEffect(() => {
    if (open && user) {
      refreshAddresses().then(setAddresses).catch((e) => showToast(e.message));
    }
  }, [open, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) {
      setMsg('');
      setPassword('');
    }
  }, [open]);

  const submitAuth = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const u = authMode === 'login' ? await login(email, password) : await register(name, email, password);
      closeOverlay();
      showToast(`Welcome, ${u.name}`);
      setEmail('');
      setPassword('');
      setName('');
    } catch (err) {
      setMsg(err.message);
    }
  };

  const submitAddress = async (e) => {
    e.preventDefault();
    setAddrMsg('');
    try {
      const list = await addAddress(form);
      setAddresses(list);
      setForm(emptyAddress);
      setShowAddForm(false);
    } catch (err) {
      setAddrMsg(err.message);
    }
  };

  const handleRemoveAddress = async (id) => {
    try {
      setAddresses(await removeAddress(id));
      showToast('Address removed');
    } catch (e) {
      showToast(e.message);
    }
  };

  return (
    <Overlay open={open} center title={user ? 'Account' : authMode === 'login' ? 'Sign In' : 'Create Account'} onClose={closeOverlay}>
      {!user && (
        <>
          <form onSubmit={submitAuth}>
            {authMode === 'register' && (
              <div className="field">
                <label>Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </div>
            )}
            <div className="field">
              <label>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
            <div className="form-msg">{msg}</div>
            <button className="full-btn" type="submit">{authMode === 'login' ? 'Sign In' : 'Create Account'}</button>
          </form>
          <div className="auth-switch">
            <span>{authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}</span>
            <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
              {authMode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </div>
        </>
      )}

      {user && (
        <div>
          <p style={{ opacity: 0.7, margin: '-8px 0 20px' }}>{user.email}</p>

          <div className="section-head" style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: '1rem' }}>Your Addresses</h2>
          </div>
          {addresses.length === 0 ? (
            <div className="empty-state" style={{ padding: '16px 0' }}>No saved addresses yet.</div>
          ) : (
            addresses.map((a) => (
              <div
                key={a.id}
                className="field"
                style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, textTransform: 'none', letterSpacing: 0, border: '1px solid var(--line)', padding: 12, borderRadius: 2, marginBottom: 8 }}
              >
                <span>
                  <strong>{a.fullName}</strong> — {a.phone}<br />
                  {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.postalCode}
                </span>
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--signal)', cursor: 'pointer', fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}
                  onClick={() => handleRemoveAddress(a.id)}
                >
                  Remove
                </button>
              </div>
            ))
          )}

          {showAddForm && (
            <form style={{ marginTop: 14 }} onSubmit={submitAddress}>
              <div className="field"><label>Full name</label><input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
              <div className="field"><label>Phone</label><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="field"><label>Address line 1</label><input required value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} /></div>
              <div className="field"><label>Address line 2 (optional)</label><input value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} /></div>
              <div className="field"><label>City</label><input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div className="field"><label>State</label><input required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
              <div className="field"><label>Postal code</label><input required value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} /></div>
              <div className="form-msg">{addrMsg}</div>
              <button className="ghost-btn" type="submit">Save address</button>
            </form>
          )}
          <button className="ghost-btn" onClick={() => setShowAddForm((v) => !v)}>+ Add new address</button>

          <button
            className="full-btn"
            style={{ marginTop: 24 }}
            onClick={() => {
              closeOverlay();
              openOverlay('orders');
            }}
          >
            View My Orders
          </button>
        </div>
      )}

      {user && (
        <button
          className="ghost-btn"
          onClick={() => {
            signOut();
            closeOverlay();
            showToast('Signed out');
          }}
        >
          Sign Out
        </button>
      )}
    </Overlay>
  );
}
