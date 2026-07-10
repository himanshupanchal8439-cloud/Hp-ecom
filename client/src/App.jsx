import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { UIProvider } from './context/UIContext';
import Nav from './components/Nav';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Admin from './pages/Admin';
import CartOverlay from './components/CartOverlay';
import AuthOverlay from './components/AuthOverlay';
import CheckoutOverlay from './components/CheckoutOverlay';
import OrdersOverlay from './components/OrdersOverlay';
import OrderConfirmOverlay from './components/OrderConfirmOverlay';
import './style.css';

function AppContent() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdmin && <Nav />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      {!isAdmin && (
        <>
          <CartOverlay />
          <AuthOverlay />
          <CheckoutOverlay />
          <OrdersOverlay />
          <OrderConfirmOverlay />
        </>
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <UIProvider>
              <AppContent />
            </UIProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
