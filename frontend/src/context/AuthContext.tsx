import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User } from '../types';
import { api, getAuthToken, setAuthToken, clearAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  inactivityRemaining: number; // Segundos restantes
  showInactivityWarning: boolean;
  login: (username: string, password: string, remember?: boolean) => Promise<void>;
  register: (phone: string, fullName: string, password: string) => Promise<void>;
  logout: () => void;
  resetInactivityTimer: () => void;
}

const INACTIVITY_TIMEOUT_SECONDS = 30 * 60; // 30 minutos
const WARNING_THRESHOLD_SECONDS = 5 * 60;   // Aviso a los 5 minutos restantes

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [inactivityRemaining, setInactivityRemaining] = useState<number>(INACTIVITY_TIMEOUT_SECONDS);
  const [showInactivityWarning, setShowInactivityWarning] = useState<boolean>(false);

  const lastActivityRef = useRef<number>(Date.now());

  const logout = useCallback(() => {
    clearAuthToken();
    setTokenState(null);
    setUser(null);
    setShowInactivityWarning(false);
    setInactivityRemaining(INACTIVITY_TIMEOUT_SECONDS);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setInactivityRemaining(INACTIVITY_TIMEOUT_SECONDS);
    setShowInactivityWarning(false);
  }, []);

  // Verificar sesión existente al cargar
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getAuthToken();
      if (storedToken) {
        try {
          const res = await api.getCurrentUser();
          setUser(res.user);
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [logout]);

  // Detector de inactividad
  useEffect(() => {
    if (!token) return;

    const handleUserActivity = () => {
      // Solo reiniciar si no estamos en fase crítica de advertencia o si el usuario interactúa explícitamente
      lastActivityRef.current = Date.now();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, INACTIVITY_TIMEOUT_SECONDS - elapsedSeconds);
      setInactivityRemaining(remaining);

      if (remaining <= WARNING_THRESHOLD_SECONDS && remaining > 0) {
        setShowInactivityWarning(true);
      } else if (remaining === 0) {
        logout();
      }
    }, 1000);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleUserActivity));
      clearInterval(interval);
    };
  }, [token, logout]);

  const login = async (username: string, password: string, remember: boolean = false) => {
    const res = await api.login({ username, password });
    setAuthToken(res.token, remember);
    setTokenState(res.token);
    setUser(res.user);
    resetInactivityTimer();
  };

  const register = async (phone: string, fullName: string, password: string) => {
    await api.register({ phone, fullName, password });
    // Autologin posterior con el número de celular
    await login(phone, password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        inactivityRemaining,
        showInactivityWarning,
        login,
        register,
        logout,
        resetInactivityTimer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
