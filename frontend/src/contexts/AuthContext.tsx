import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../services/api';
import type { User, LoginResponse } from '../types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token and user from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const appVersion = localStorage.getItem('app_version');

    // Force cache clear if app version doesn't match (for migration)
    const CURRENT_VERSION = 'v2.0-admin';
    if (appVersion !== CURRENT_VERSION) {
      localStorage.clear();
      localStorage.setItem('app_version', CURRENT_VERSION);
      setLoading(false);
      return;
    }

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Ensure is_admin property exists (migration safety)
        if (parsedUser && typeof parsedUser.is_admin === 'undefined') {
          // Old cached data without is_admin - clear and force re-login
          localStorage.clear();
          localStorage.setItem('app_version', CURRENT_VERSION);
          setLoading(false);
          return;
        }
        setToken(savedToken);
        setUser(parsedUser);
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      } catch (error) {
        // Invalid stored data - clear it
        localStorage.clear();
        localStorage.setItem('app_version', CURRENT_VERSION);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      // OAuth2 requires form data
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axios.post<LoginResponse>('/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = response.data;

      // Get user info
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      const userResponse = await axios.get('/me');

      const userData: User = {
        username: userResponse.data.username,
        id: userResponse.data.id,
        is_admin: userResponse.data.is_admin || false,
      };

      // Save to state and localStorage
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('app_version', 'v2.0-admin');
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const register = async (username: string, password: string) => {
    try {
      await axios.post('/register', {
        username,
        password,
      });

      // Auto-login after registration
      await login(username, password);
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await axios.post('/logout', {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear state and localStorage regardless of API call result
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    isAdmin: user?.is_admin || false,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
