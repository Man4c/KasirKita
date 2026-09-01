import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { storage } from '../services/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedToken = await storage.getToken();
        const savedUser = await storage.getUser();
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const login = async (email, password, customApiUrl = null) => {
    if (customApiUrl) {
      await storage.setApiUrl(customApiUrl);
    }

    try {
      const res = await api.post('/auth/login', {
        email,
        password,
        device_name: 'KasirKita Mobile Expo',
      });

      if (res.data.success) {
        const { user: userData, token: userToken } = res.data.data;
        setUser(userData);
        setToken(userToken);
        await storage.setToken(userToken);
        await storage.setUser(userData);
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Koneksi ke server gagal.',
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.log('Logout server err:', err.message);
    } finally {
      setUser(null);
      setToken(null);
      await storage.clearAll();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
        isOwner: user?.role === 'owner',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
