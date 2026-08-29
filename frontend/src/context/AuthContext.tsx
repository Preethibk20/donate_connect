import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthResponse, LoginRequest, RegisterRequest, User, VerifyOtpRequest } from '../types';
import { loginApi, registerDonorApi, getCurrentUserApi, verifyOtpApi } from '../api/authApi';
import { setAuthTokenInMemory, registerLogoutCallback } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (data: LoginRequest) => Promise<AuthResponse>;
  verifyOtp: (data: VerifyOtpRequest) => Promise<User>;
  registerDonor: (data: RegisterRequest) => Promise<AuthResponse>;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getInitialUser = (): User | null => {
  try {
    const saved = localStorage.getItem('dc-user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('dc-token'));
  const [user, setUser] = useState<User | null>(() => getInitialUser());
  const [loading, setLoading] = useState<boolean>(true);

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('dc-token');
    localStorage.removeItem('dc-user');
    setAuthTokenInMemory(null);
  };

  useEffect(() => {
    registerLogoutCallback(handleLogout);
  }, []);

  // Revalidate session on app startup
  useEffect(() => {
    const savedToken = localStorage.getItem('dc-token');
    if (savedToken) {
      setAuthTokenInMemory(savedToken);
      getCurrentUserApi()
        .then((currentUser) => {
          setUser(currentUser);
          localStorage.setItem('dc-user', JSON.stringify(currentUser));
        })
        .catch(() => {
          // If token expired or invalid, clear session
          handleLogout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (data: LoginRequest): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const res: AuthResponse = await loginApi(data);
      if (!res.requiresOtp && res.token) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('dc-token', res.token);
        localStorage.setItem('dc-user', JSON.stringify(res.user));
        setAuthTokenInMemory(res.token);
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (data: VerifyOtpRequest): Promise<User> => {
    setLoading(true);
    try {
      const res: AuthResponse = await verifyOtpApi(data);
      if (res.token) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('dc-token', res.token);
        localStorage.setItem('dc-user', JSON.stringify(res.user));
        setAuthTokenInMemory(res.token);
      }
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const registerDonor = async (data: RegisterRequest): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const res: AuthResponse = await registerDonorApi(data);
      if (!res.requiresOtp && res.token) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('dc-token', res.token);
        localStorage.setItem('dc-user', JSON.stringify(res.user));
        setAuthTokenInMemory(res.token);
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const refetchUser = async () => {
    const savedToken = token || localStorage.getItem('dc-token');
    if (!savedToken) return;
    try {
      const currentUser = await getCurrentUserApi();
      setUser(currentUser);
      localStorage.setItem('dc-user', JSON.stringify(currentUser));
    } catch {
      handleLogout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        verifyOtp,
        registerDonor,
        logout: handleLogout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
