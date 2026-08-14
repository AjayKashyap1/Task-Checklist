import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, setAuthToken } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (email: string, name?: string, avatar?: string) => Promise<void>;
  logout: () => void;
  switchUser: (user: User) => void;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    try {
      const data = await api.getMe();
      setCurrentUser(data.user);
    } catch {
      // Auto-fallback: default to initial admin user so first load is immediately accessible
      try {
        const users = await api.getUsers();
        if (users && users.length > 0) {
          const adminUser = users.find(u => u.role === 'admin') || users[0];
          setAuthToken(adminUser.id);
          setCurrentUser(adminUser);
        }
      } catch {
        // Ignore fallback error
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    setCurrentUser(data.user);
  };

  const loginWithGoogle = async (email: string, name?: string, avatar?: string) => {
    const data = await api.loginWithGoogle(email, name, avatar);
    setCurrentUser(data.user);
  };

  const logout = () => {
    api.logout();
    setCurrentUser(null);
  };

  const switchUser = (user: User) => {
    setAuthToken(user.id);
    setCurrentUser(user);
  };

  const refreshCurrentUser = async () => {
    try {
      const data = await api.getMe();
      setCurrentUser(data.user);
    } catch {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        login,
        loginWithGoogle,
        logout,
        switchUser,
        refreshCurrentUser
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
