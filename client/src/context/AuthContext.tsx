import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getAuthToken, setAuthToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (data: { username: string; password: string }) => Promise<void>;
  register: (data: { username: string; password: string; email?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vt_cached_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        setUser(res.user);
        localStorage.setItem('vt_cached_user', JSON.stringify(res.user));
      } catch (err) {
        console.warn('Auth token verification failed:', err);
        setAuthToken(null);
        setTokenState(null);
        setUser(null);
        localStorage.removeItem('vt_cached_user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (data: { username: string; password: string }) => {
    const res = await api.login(data);
    setAuthToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
    localStorage.setItem('vt_cached_user', JSON.stringify(res.user));
  };

  const register = async (data: { username: string; password: string; email?: string }) => {
    const res = await api.register(data);
    setAuthToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
    localStorage.setItem('vt_cached_user', JSON.stringify(res.user));
  };

  const logout = () => {
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
    localStorage.removeItem('vt_cached_user');
    localStorage.removeItem('cached_vehicles');
  };

  const refreshUser = async () => {
    const res = await api.getMe();
    setUser(res.user);
    localStorage.setItem('vt_cached_user', JSON.stringify(res.user));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
