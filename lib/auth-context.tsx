'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_USERS, MockUser } from './mock-data';

interface AuthContextType {
  user: MockUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; message: string; user?: MockUser }>;
  logout: () => void;
  switchUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Muat session dari localStorage jika ada, default ke santri 1
    const storedUser = localStorage.getItem('rajinqu_auth_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(MOCK_USERS[2]); // Default Faiz (Santri)
      }
    } else {
      setUser(MOCK_USERS[2]); // Default Faiz
    }
    setIsLoading(false);
  }, []);

  const login = async (identifier: string, pass: string): Promise<{ success: boolean; message: string; user?: MockUser }> => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    const matchedUser = MOCK_USERS.find(
      (u) =>
        (u.username.toLowerCase() === cleanId ||
          u.noHp.replace(/[^0-9]/g, '') === cleanId.replace(/[^0-9]/g, '')) &&
        u.password === cleanPass
    );

    if (matchedUser) {
      setUser(matchedUser);
      localStorage.setItem('rajinqu_auth_user', JSON.stringify(matchedUser));
      return { success: true, message: 'Login berhasil!', user: matchedUser };
    }

    return {
      success: false,
      message: 'Kredensial tidak cocok. Pastikan NIS/No HP & Password yang dibuatkan Admin sudah sesuai.',
    };
  };

  const switchUser = (userId: string) => {
    const target = MOCK_USERS.find((u) => u.id === userId);
    if (target) {
      setUser(target);
      localStorage.setItem('rajinqu_auth_user', JSON.stringify(target));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rajinqu_auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
