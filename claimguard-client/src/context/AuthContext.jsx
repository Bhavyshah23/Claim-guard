import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import axiosInstance, { AUTH_STORAGE_KEY } from '../api/axiosInstance';

const AuthContext = createContext(null);

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser);

  const persistUser = useCallback((data) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  const login = useCallback(
    async (username, password) => {
      const response = await axiosInstance.post('/api/auth/login', { username, password });
      return persistUser(response.data);
    },
    [persistUser]
  );

  const register = useCallback(
    async (clinicName, username, password, email) => {
      const response = await axiosInstance.post('/api/auth/register', {
        clinicName,
        username,
        password,
        email,
      });
      return persistUser(response.data);
    },
    [persistUser]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token: user?.token ?? null,
      login,
      register,
      logout,
      isAuthenticated: Boolean(user?.token),
    }),
    [user, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
