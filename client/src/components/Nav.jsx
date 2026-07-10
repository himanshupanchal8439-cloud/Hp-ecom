import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';

export default function Nav() {
  const { user } = useAuth();
  const { count } = useCart();
  const { theme, setTheme, openOverlay, setAuthMode } = useUI();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const lockedScrollY = useRef(0);

  useEffect(() => {
    if (menuOpen) {
      lockedScrollY.current = window.scrollY;
      document.body.classList.add('nav-open-lock');
      document.body.style.top = `-${lockedScrollY.current}px`;
    } else {
      document.body.classList.remove('nav-open-lock');
      document.body.style.top = '';
      window.scrollTo(0, lockedScrollY.current);
    }
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleHome = () => {
    closeMenu();
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  const handleUserStatus = () => {
    closeMenu();
    if (!user) setAuthMode('login');
    openOverlay('auth');
  };

  return (
    <>
      <nav className={menuOpen ? 'menu-open' : ''}>
        <button className="wordmark" onClick={handleHome}>HIM-STORE</button>
        <button className={`nav-burger${menuOpen ? ' open' : ''}`} aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>
          <span></span><span></span><span></span>
        </button>
        <div className="nav-drawer-clip">
          <div className={`nav-right${menuOpen ? ' open' : ''}`}>
            <button className="nav-close" aria-label="Close menu" onClick={closeMenu}>✕</button>
            {user?.role === 'admin' && (
              <a href="/admin" style={{ opacity: 0.85 }} onClick={closeMenu}>Admin</a>
            )}
            {user && (
              <button
                onClick={() => {
                  closeMenu();
                  openOverlay('orders');
                }}
              >
                My Orders
              </button>
            )}
            <span style={{ opacity: 0.85, cursor: 'pointer' }} onClick={handleUserStatus}>
              {user ? user.name : 'Sign in'}
            </span>
            <button
              onClick={() => {
                closeMenu();
                openOverlay('cart');
              }}
            >
              Bag (<span>{count}</span>)
            </button>
            <div className="dots">
              {['cream', 'dark', 'red'].map((t) => (
                <div
                  key={t}
                  className={`dot${theme === t ? ' active' : ''}`}
                  onClick={() => setTheme(t)}
                />
              ))}
            </div>
          </div>
        </div>
      </nav>
      <div className={`nav-backdrop${menuOpen ? ' show' : ''}`} onClick={closeMenu}></div>
    </>
  );
}
