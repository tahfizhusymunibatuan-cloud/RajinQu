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
  // Helper untuk mendapatkan daftar seluruh pengguna aktif (Live dari localStorage)
  const getLiveUsers = (): MockUser[] => {
    if (typeof window === 'undefined') return MOCK_USERS;
    const saved = localStorage.getItem('rajinqu_users');
    if (saved) {
      try {
        const parsed: MockUser[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing stored users:', e);
      }
    }
    return MOCK_USERS;
  };

  // Inisialisasi status user secara instan & sinkron dari localStorage (mencegah logout saat refresh)
  const [user, setUser] = useState<MockUser | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('rajinqu_auth_user') || localStorage.getItem('rajinqu_session');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('rajinqu_auth_user') || localStorage.getItem('rajinqu_session');
      return !stored;
    }
    return false;
  });

  useEffect(() => {
    // Re-sinkronisasi data user saat komponen selesai dimount
    const stored = localStorage.getItem('rajinqu_auth_user') || localStorage.getItem('rajinqu_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const liveUsers = getLiveUsers();
        const freshUser = liveUsers.find((u) => u.id === parsed.id || u.username === parsed.username);
        setUser(freshUser || parsed);
        localStorage.setItem('rajinqu_auth_user', JSON.stringify(freshUser || parsed));
        localStorage.setItem('rajinqu_session', JSON.stringify(freshUser || parsed));
      } catch {
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (identifier: string, pass: string): Promise<{ success: boolean; message: string; user?: MockUser }> => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Dapatkan data user terbaru (termasuk yang baru dibuat oleh Admin)
    const liveUsers = getLiveUsers();

    const matchedUser = liveUsers.find(
      (u) =>
        (u.username.toLowerCase() === cleanId ||
          (u.noHp && u.noHp.replace(/[^0-9]/g, '') === cleanId.replace(/[^0-9]/g, '')) ||
          (u.nama && u.nama.toLowerCase() === cleanId)) &&
        u.password.trim() === cleanPass
    );

    if (matchedUser) {
      setUser(matchedUser);
      localStorage.setItem('rajinqu_auth_user', JSON.stringify(matchedUser));
      localStorage.setItem('rajinqu_session', JSON.stringify(matchedUser));
      return { success: true, message: 'Login berhasil!', user: matchedUser };
    }

    return {
      success: false,
      message: 'Kredensial tidak cocok. Pastikan Username/NIS atau No. HP & Password sudah sesuai.',
    };
  };

  const switchUser = (userId: string) => {
    const liveUsers = getLiveUsers();
    const target = liveUsers.find((u) => u.id === userId);
    if (target) {
      setUser(target);
      localStorage.setItem('rajinqu_auth_user', JSON.stringify(target));
      localStorage.setItem('rajinqu_session', JSON.stringify(target));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('rajinqu_auth_user');
    localStorage.removeItem('rajinqu_session');
    localStorage.removeItem('rajinqu_admin_preview');
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
