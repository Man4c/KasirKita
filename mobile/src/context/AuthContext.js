import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setOnUnauthorizedHandler } from '../services/api';
import { storage } from '../services/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for 401 Unauthorized globally from API calls
    setOnUnauthorizedHandler(() => {
      setUser(null);
      setToken(null);
    });

    return () => {
      setOnUnauthorizedHandler(null);
    };
  }, []);

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

  const registerStore = async (regData, customApiUrl = null) => {
    if (customApiUrl) {
      await storage.setApiUrl(customApiUrl);
    }

    try {
      const res = await api.post('/auth/register-store', {
        ...regData,
        device_name: 'KasirKita Mobile Expo',
      });

      if (res.data.success) {
        const { user: userData, token: userToken } = res.data.data;
        setUser(userData);
        setToken(userToken);
        await storage.setToken(userToken);
        await storage.setUser(userData);
        return { success: true, data: res.data.data };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Pendaftaran toko gagal. Periksa koneksi internet Anda.',
      };
    }
  };

  const refreshStoreStatus = async () => {
    try {
      const res = await api.get('/store/license');
      if (res.data.success) {
        const licenseData = res.data.data;
        if (user) {
          const updatedUser = {
            ...user,
            store: {
              ...(user.store || {}),
              ...licenseData,
            },
          };
          setUser(updatedUser);
          await storage.setUser(updatedUser);
        }
        return { success: true, data: licenseData };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Gagal memperbarui status lisensi.',
      };
    }
  };

  const activateLicense = async (licenseKey) => {
    try {
      const res = await api.post('/store/activate-license', {
        license_key: licenseKey,
      });

      if (res.data.success) {
        const { store: updatedStoreData } = res.data.data;
        if (user) {
          const updatedUser = {
            ...user,
            store: {
              ...(user.store || {}),
              ...updatedStoreData,
            },
          };
          setUser(updatedUser);
          await storage.setUser(updatedUser);
        }
        return { success: true, data: res.data.data };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || err.message || 'Aktivasi lisensi gagal.',
      };
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      const newUser = {
        ...user,
        ...updatedUserData,
      };
      setUser(newUser);
      await storage.setUser(newUser);
      return { success: true };
    } catch (err) {
      console.error('Failed to update user in auth context:', err);
      return { success: false, message: err.message };
    }
  };

  const store = user?.store || null;
  const isStoreActive = store ? store.is_active : true;
  const isStoreTrial = store ? store.is_trial : false;
  const isStoreExpired = store ? store.is_expired : false;

  return (
    <AuthContext.Provider
      value={{
        user,
        store,
        token,
        loading,
        login,
        logout,
        registerStore,
        refreshStoreStatus,
        activateLicense,
        updateUser,
        isAuthenticated: !!token,
        isOwner: user?.role === 'owner',
        isStoreActive,
        isStoreTrial,
        isStoreExpired,
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
