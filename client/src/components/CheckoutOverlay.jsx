import { useEffect, useState } from 'react';
import Overlay from './Overlay';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

const emptyAddress = { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '' };

export default function CheckoutOverlay() {
  const { overlay, closeOverlay, openOverlay, setLastOrder } = useUI();
  const { user, refreshAddresses, addAddress } = useAuth();
  const { cart, total, clearCart } = useCart();
  const showToast = useToast();
  const open = overlay === 'checkout';

  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyAddress);
  const [addrMsg, setAddrMsg] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [msg, setMsg] = useState('');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const list = await refreshAddresses();
        setAddresses(list);
        setSelectedId((id) => id || list[0]?.id || null);
      } catch (e) {
        showToast(e.message);
      }
    })();
    setMsg('');
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitAddress = async (e) => {
    e.preventDefault();
    setAddrMsg('');
    try {
      const list = await addAddress(form);
      setAddresses(list);
      setSelectedId(list[list.length - 1].id);
      setForm(emptyAddress);
      setShowAddForm(false);
    } catch (err) {
      setAddrMsg(err.message);
    }
  };

  const finishCheckout = (order) => {
    clearCart();
    closeOverlay();
    setLastOrder(order);
    openOverlay('orderConfirm');
    showToast('Order confirmed');
  };

  const placeOrder = async () => {
    setMsg('');
    if (!selectedId) {
      setMsg('Add or select a shipping address first.');
      return;
    }
    setPlacing(true);
    try {
      const result = await api('/orders', {
        method: 'POST',
        body: JSON.stringify({ addressId: selectedId, paymentMethod }),
      });

      if (paymentMethod === 'cod') {
        finishCheckout(result);
        return;
      }

      const { order, razorpay } = result;
      if (typeof window.Razorpay === 'undefined') {
        setMsg('Payment SDK failed to load. Check your connection and try again.');
        return;
      }
      const rzp = new window.Razorpay({
        key: razorpay.keyId,
        amount: razorpay.amount,
        currency: razorpay.currency,
        order_id: razorpay.orderId,
        name: 'HIM-STORE',
        description: 'Order payment',
        theme: { color: '#ff3b1f' },
        prefill: { name: user?.name, email: user?.email },
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
      setMsg(err.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Overlay open={open} title="Checkout" onClose={closeOverlay}>
      <div className="section-head" style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: '1rem' }}>Shipping address</h2>
      </div>
      {addresses.length === 0 ? (
        <div className="empty-state" style={{ padding: '16px 0' }}>No saved addresses yet.</div>
      ) : (
        addresses.map((a) => (
          <label
            key={a.id}
            className="field"
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, textTransform: 'none', letterSpacing: 0, border: '1px solid var(--line)', padding: 12, borderRadius: 2, marginBottom: 8 }}
          >
            <input
              type="radio"
              name="shipAddress"
              style={{ width: 'auto', marginTop: 3 }}
              checked={a.id === selectedId}
              onChange={() => setSelectedId(a.id)}
            />
            <span>
              <strong>{a.fullName}</strong> — {a.phone}<br />
              {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.postalCode}
            </span>
          </label>
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

      <div className="section-head" style={{ margin: '24px 0 12px' }}>
        <h2 style={{ fontSize: '1rem' }}>Payment method</h2>
      </div>
      <div className="field">
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8, textTransform: 'none', letterSpacing: 0 }}>
          <input type="radio" name="pm" style={{ width: 'auto' }} checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} /> Cash on Delivery
        </label>
      </div>
      <div className="field">
        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8, textTransform: 'none', letterSpacing: 0 }}>
          <input type="radio" name="pm" style={{ width: 'auto' }} checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} /> Pay online — UPI / Card / Netbanking (Razorpay)
        </label>
      </div>

      <div className="cart-total"><span>Total</span><span>₹{total}</span></div>
      <div className="form-msg">{msg}</div>
      <button className="full-btn" disabled={placing} onClick={placeOrder}>Place order</button>
    </Overlay>
  );
}
