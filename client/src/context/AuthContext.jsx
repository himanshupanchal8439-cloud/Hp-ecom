import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from '../api/client';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [ready, setReady] = useState(false);
  const showToast = useToast();

  const signOutLocal = useCallback((message) => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('user');
    if (message) showToast(message);
  }, [showToast]);

  useEffect(() => {
    setUnauthorizedHandler(() => signOutLocal('Your session expired — please sign in again.'));
  }, [signOutLocal]);

  useEffect(() => {
    (async () => {
      if (getToken()) {
        try {
          const me = await api('/auth/me');
          setUser(me);
          localStorage.setItem('user', JSON.stringify(me));
        } catch {
          setToken(null);
          setUser(null);
          localStorage.removeItem('user');
        }
      }
      setReady(true);
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await api('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data.user;
  }, []);

  const signOut = useCallback(() => signOutLocal(), [signOutLocal]);

  const refreshAddresses = useCallback(async () => {
    const me = await api('/auth/me');
    setUser(me);
    localStorage.setItem('user', JSON.stringify(me));
    return me.addresses || [];
  }, []);

  const addAddress = useCallback(async (body) => {
    const addresses = await api('/auth/addresses', { method: 'POST', body: JSON.stringify(body) });
    setUser((u) => (u ? { ...u, addresses } : u));
    return addresses;
  }, []);

  const removeAddress = useCallback(async (id) => {
    const addresses = await api(`/auth/addresses/${id}`, { method: 'DELETE' });
    setUser((u) => (u ? { ...u, addresses } : u));
    return addresses;
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, register, signOut, refreshAddresses, addAddress, removeAddress }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
