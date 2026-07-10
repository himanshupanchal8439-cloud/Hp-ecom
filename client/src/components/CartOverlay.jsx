import Overlay from './Overlay';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function CartOverlay() {
  const { overlay, closeOverlay, openOverlay } = useUI();
  const { cart, total, changeQty } = useCart();
  const { user } = useAuth();
  const showToast = useToast();
  const open = overlay === 'cart';

  const handleCheckout = () => {
    if (!user) {
      openOverlay('auth');
      return;
    }
    if (cart.length === 0) {
      showToast('Your bag is empty');
      return;
    }
    openOverlay('checkout');
  };

  return (
    <Overlay open={open} title="Your Bag" onClose={closeOverlay}>
      {cart.length === 0 ? (
        <div className="empty-state">Your bag is empty.</div>
      ) : (
        <div>
          {cart.map((item) => (
            <div className="cart-item" key={item.id}>
              <img src={item.front} alt={item.name} />
              <div className="ci-info">
                <div className="ci-name">{item.name}</div>
                <div>₹{item.price} × {item.quantity}</div>
                <div className="ci-controls">
                  <button onClick={() => changeQty(item.id, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => changeQty(item.id, item.quantity + 1)}>+</button>
                </div>
                <button className="ci-remove" onClick={() => changeQty(item.id, 0)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="cart-total"><span>Total</span><span>₹{total}</span></div>
      <button className="full-btn" disabled={cart.length === 0} onClick={handleCheckout}>Checkout</button>
    </Overlay>
  );
}
