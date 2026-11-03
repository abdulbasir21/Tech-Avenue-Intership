import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../api/auth.api';
import { AuthContext } from './AuthContextValue';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('irop_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('irop_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('irop_token');
    localStorage.removeItem('irop_user');
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authApi.me();
          setUser(res.user);
          localStorage.setItem('irop_user', JSON.stringify(res.user));
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('irop_token', res.token);
    localStorage.setItem('irop_user', JSON.stringify(res.user));
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const res = await authApi.me();
        setUser(res.user);
        localStorage.setItem('irop_user', JSON.stringify(res.user));
      } catch {
        logout();
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
