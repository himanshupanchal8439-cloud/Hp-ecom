import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [theme, setThemeState] = useState(localStorage.getItem('theme') || 'cream');
  const [overlay, setOverlay] = useState(null); // 'cart' | 'checkout' | 'auth' | 'orders' | 'orderConfirm' | null
  const [authMode, setAuthMode] = useState('login');
  const [lastOrder, setLastOrder] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = useCallback((t) => setThemeState(t), []);
  const openOverlay = useCallback((name) => setOverlay(name), []);
  const closeOverlay = useCallback(() => setOverlay(null), []);

  return (
    <UIContext.Provider
      value={{ theme, setTheme, overlay, openOverlay, closeOverlay, authMode, setAuthMode, lastOrder, setLastOrder }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  return useContext(UIContext);
}
