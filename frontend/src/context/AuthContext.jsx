import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken, getToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.auth.getMe();
        setUser(res.data.user);
      } catch (err) {
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    const handleExpired = () => {
      setUser(null);
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const login = async (email, password) => {
    const res = await api.auth.login({ email, password });
    setToken(res.data.access_token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await api.auth.register(data);
    setToken(res.data.access_token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      // ignore
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
