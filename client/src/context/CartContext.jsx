import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken } from '../api/client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const { user, ready } = useAuth();
  const showToast = useToast();

  const loadCart = useCallback(async () => {
    if (!getToken()) {
      setCart([]);
      return;
    }
    try {
      setCart(await api('/cart'));
    } catch {
      setCart([]);
    }
  }, []);

  useEffect(() => {
    if (ready) loadCart();
  }, [ready, user, loadCart]);

  const addToCart = useCallback(
    async (productId, quantity = 1) => {
      try {
        const next = await api('/cart', { method: 'POST', body: JSON.stringify({ productId, quantity }) });
        setCart(next);
        showToast('Added to bag');
        return true;
      } catch (e) {
        showToast(e.message);
        return false;
      }
    },
    [showToast]
  );

  const changeQty = useCallback(
    async (productId, quantity) => {
      try {
        const next =
          quantity <= 0
            ? await api(`/cart/${productId}`, { method: 'DELETE' })
            : await api(`/cart/${productId}`, { method: 'PUT', body: JSON.stringify({ quantity }) });
        setCart(next);
      } catch (e) {
        showToast(e.message);
      }
    },
    [showToast]
  );

  const clearCart = useCallback(() => setCart([]), []);

  const total = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.quantity, 0), [cart]);
  const count = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);

  return (
    <CartContext.Provider value={{ cart, total, count, loadCart, addToCart, changeQty, clearCart, setCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
