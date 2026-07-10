import Overlay from './Overlay';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';

export default function OrderConfirmOverlay() {
  const { overlay, closeOverlay, lastOrder } = useUI();
  const { user } = useAuth();
  const open = overlay === 'orderConfirm';

  return (
    <Overlay open={open} center title="Order placed" onClose={closeOverlay}>
      {lastOrder && (
        <div>
          <p style={{ fontFamily: "'Fraunces',serif", fontSize: '1.2rem', margin: '0 0 12px' }}>
            Thank you, {user?.name || ''}.
          </p>
          <p style={{ opacity: 0.8, lineHeight: 1.5 }}>
            Order <strong>#{lastOrder.id.slice(0, 8)}</strong> confirmed — total ₹{lastOrder.total}, paid via{' '}
            {lastOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'}.
          </p>
        </div>
      )}
    </Overlay>
  );
}
