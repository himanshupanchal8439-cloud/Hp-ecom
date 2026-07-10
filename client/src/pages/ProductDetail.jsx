import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { useToast } from '../context/ToastContext';
import Footer from '../components/Footer';

const stockText = { 'in-stock': 'In stock', 'low-stock': 'Low stock — almost gone', 'out-of-stock': 'Out of stock' };
const stockClass = { 'in-stock': '', 'low-stock': 'low', 'out-of-stock': 'restocking' };

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { openOverlay, setAuthMode } = useUI();
  const showToast = useToast();

  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState('front');
  const [swap, setSwap] = useState(false);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setProduct(null);
    setError('');
    setActiveImg('front');
    setQty(1);
    api(`/products/${id}`)
      .then((p) => {
        setProduct(p);
        document.title = `${p.name} — HIM-STORE`;
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <main className="wrap">
        <button className="pdp-back" onClick={() => navigate('/')}>← Back to shop</button>
        <div className="empty-state">{error}</div>
      </main>
    );
  }
  if (!product) {
    return (
      <main className="wrap">
        <button className="pdp-back" onClick={() => navigate('/')}>← Back to shop</button>
        <div className="empty-state">Loading product…</div>
      </main>
    );
  }

  const outOfStock = product.stock === 'out-of-stock';
  const hasDiscount = product.discountPercent > 0 && product.mrp > product.price;

  const switchImage = (which) => {
    if (which === activeImg) return;
    setSwap(true);
    setTimeout(() => {
      setActiveImg(which);
      setSwap(false);
    }, 180);
  };

  const handleAddToCart = async () => {
    if (!user) {
      setAuthMode('login');
      openOverlay('auth');
      showToast('Sign in to add items to your bag');
      return;
    }
    await addToCart(product.id, qty);
  };

  const handleBuyNow = async () => {
    if (!user) {
      setAuthMode('login');
      openOverlay('auth');
      showToast('Sign in to buy this item');
      return;
    }
    const ok = await addToCart(product.id, qty);
    if (ok) openOverlay('checkout');
  };

  return (
    <>
      <main className="wrap">
        <button className="pdp-back" onClick={() => navigate('/')}>← Back to shop</button>

        <div className="pdp-grid">
          <div className="pdp-gallery">
            <div className="pdp-main-image">
              {hasDiscount && <span className="discount-badge">{product.discountPercent}% OFF</span>}
              <img src={product[activeImg]} alt={product.name} className={swap ? 'swap' : ''} />
            </div>
            <div className="pdp-thumbs">
              <button className={`pdp-thumb${activeImg === 'front' ? ' active' : ''}`} onClick={() => switchImage('front')}>
                <img src={product.front} alt={`${product.name} front`} />
              </button>
              <button className={`pdp-thumb${activeImg === 'back' ? ' active' : ''}`} onClick={() => switchImage('back')}>
                <img src={product.back} alt={`${product.name} back`} />
              </button>
            </div>
          </div>

          <div className="pdp-info">
            <div className="pdp-category">{product.category}</div>
            <h1 className="pdp-name">{product.name}</h1>
            <div className="pdp-price-row">
              <span className="pdp-price">₹{product.price}</span>
              {hasDiscount && (
                <>
                  <span className="pdp-mrp">₹{product.mrp}</span>
                  <span className="pdp-discount-pill">{product.discountPercent}% OFF</span>
                </>
              )}
            </div>
            <div className={`card-tag pdp-stock ${stockClass[product.stock] || ''}`}>
              <i></i>{stockText[product.stock] || 'In stock'}
            </div>
            <p className="pdp-desc">{product.description || ''}</p>

            {!outOfStock && (
              <div className="pdp-qty">
                <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => q + 1)}>+</button>
              </div>
            )}

            <div className="pdp-actions">
              <button className="full-btn" disabled={outOfStock} onClick={handleBuyNow}>
                {outOfStock ? 'Out of stock' : 'Buy now'}
              </button>
              <button className="ghost-btn" disabled={outOfStock} onClick={handleAddToCart}>Add to bag</button>
            </div>

            <div className="pdp-meta">
              <span>Free express shipping on orders over ₹5000</span>
              <span>Cash on Delivery available, or pay online via UPI/card/netbanking</span>
              <span>Easy returns within 7 days of delivery</span>
            </div>
          </div>
        </div>
      </main>
      <Footer minimal />
    </>
  );
}
