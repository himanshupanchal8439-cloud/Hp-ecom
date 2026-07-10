import { useEffect, useState } from 'react';
import Overlay from './Overlay';
import { useUI } from '../context/UIContext';
import { api } from '../api/client';

const STATUS_STEPS = ['confirmed', 'shipped', 'delivered'];
const STATUS_LABEL = { confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered' };

function OrderTracking({ order }) {
  if (order.status === 'cancelled') {
    return <div className="order-cancelled">● Order cancelled</div>;
  }
  if (order.status === 'pending_payment') {
    return <div className="order-cancelled" style={{ color: 'inherit', opacity: 0.7 }}>Awaiting payment confirmation…</div>;
  }
  const currentIndex = STATUS_STEPS.indexOf(order.status);
  return (
    <div className="status-track">
      {STATUS_STEPS.map((step, i) => {
        const cls = i < currentIndex ? 'done' : i === currentIndex ? 'current' : '';
        return (
          <div className={`status-step ${cls}`} key={step}>
            <span className="dot-node"></span>
            <span className="step-label">{STATUS_LABEL[step]}</span>
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order }) {
  return (
    <div className="order-card">
      <div className="order-card-head">
        <span className="oid">#{order.id.slice(0, 8)}</span>
        <span className="odate">{new Date(order.createdAt).toLocaleString()}</span>
      </div>
      <div className="order-items">
        {order.items.map((i, idx) => (
          <span key={i.productId}>
            {i.name} × {i.quantity}
            {idx < order.items.length - 1 && <br />}
          </span>
        ))}
      </div>
      <div className="order-total">
        <span>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid via Razorpay'}</span>
        <span>₹{order.total}</span>
      </div>
      <OrderTracking order={order} />
    </div>
  );
}

export default function OrdersOverlay() {
  const { overlay, closeOverlay } = useUI();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const open = overlay === 'orders';

  useEffect(() => {
    if (!open) return;
    setOrders(null);
    setError('');
    api('/orders')
      .then(setOrders)
      .catch((e) => setError(e.message));
  }, [open]);

  return (
    <Overlay open={open} title="My Orders" onClose={closeOverlay}>
      {error ? (
        <div className="empty-state">{error}</div>
      ) : orders === null ? (
        <div className="empty-state">Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className="empty-state">No orders yet.</div>
      ) : (
        orders.map((o) => <OrderCard order={o} key={o.id} />)
      )}
    </Overlay>
  );
}
