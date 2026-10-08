import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthUser } from '../types';
import { getMe } from '../services/auth';

const TOKEN_KEY = 'netguard_token';

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Validate any stored token against the backend on mount / token change.
  useEffect(() => {
    if (token) {
      getMe()
        .then((res) => setUser(res.user))
        .catch(() => {
          // Invalid/expired token — clear it so protected routes redirect.
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  // Global401 handler: apiClient dispatches this when a request returns 401.
  useEffect(() => {
    const onUnauthorized = () => {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    };
    window.addEventListener('netguard:unauthorized', onUnauthorized);
    return () => window.removeEventListener('netguard:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
