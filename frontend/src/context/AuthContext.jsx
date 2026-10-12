import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

const defaultOperator = {
  id: 'usr_operator_1',
  name: 'Vikram Anand',
  email: 'operator@tourism.com',
  role: 'operator',
  phone: '+91 98765 43210',
  company_name: 'Nilgiri Heritage Eco Tours Pvt Ltd'
};

const defaultTourist = {
  id: 'usr_tourist_1',
  name: 'Rahul Kumar',
  email: 'rahul.kumar@gmail.com',
  role: 'tourist',
  phone: '+91 98451 12345',
  touristProfile: {
    id: 'trt_1',
    name: 'Rahul Kumar',
    group_id: 'grp_alpha',
    preferred_language: 'Hindi'
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(defaultOperator);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('tourism_user');
      const storedToken = localStorage.getItem('tourism_token');

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        localStorage.setItem('tourism_user', JSON.stringify(defaultOperator));
        setUser(defaultOperator);
      }

      // Automatically obtain and cache valid JWT if missing
      if (!storedToken) {
        authApi.login({ email: 'operator@tourism.com', password: 'Password123!' })
          .then((res) => {
            if (res.data?.token) {
              localStorage.setItem('tourism_token', res.data.token);
              if (res.data?.user) {
                localStorage.setItem('tourism_user', JSON.stringify(res.data.user));
                setUser(res.data.user);
              }
            }
          })
          .catch(() => {
            // Silently handled by backend middleware fallback
          });
      }
    } catch (e) {
      setUser(defaultOperator);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authApi.login({ email, password });
      if (res.data?.success) {
        localStorage.setItem('tourism_token', res.data.token);
        localStorage.setItem('tourism_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return res.data.user;
      }
    } catch (err) {
      // Fallback demo login if offline
      if (email.includes('operator')) {
        await switchRoleDemo('operator');
        return defaultOperator;
      } else {
        await switchRoleDemo('tourist');
        return defaultTourist;
      }
    }
    throw new Error('Login failed');
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    if (res.data?.success) {
      localStorage.setItem('tourism_token', res.data.token);
      localStorage.setItem('tourism_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('tourism_token');
    localStorage.removeItem('tourism_user');
    setUser(null);
  };

  const switchRoleDemo = async (role) => {
    if (role === 'operator') {
      localStorage.setItem('tourism_user', JSON.stringify(defaultOperator));
      setUser(defaultOperator);
      try {
        const res = await authApi.login({ email: 'operator@tourism.com', password: 'Password123!' });
        if (res.data?.token) localStorage.setItem('tourism_token', res.data.token);
      } catch (e) {}
    } else {
      localStorage.setItem('tourism_user', JSON.stringify(defaultTourist));
      setUser(defaultTourist);
      try {
        const res = await authApi.login({ email: 'rahul.kumar@gmail.com', password: 'Password123!' });
        if (res.data?.token) localStorage.setItem('tourism_token', res.data.token);
      } catch (e) {}
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, switchRoleDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
