'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldCheck, UserCheck, GraduationCap, ArrowRightLeft, Sparkles } from 'lucide-react';
import { MOCK_USERS } from '@/lib/mock-data';

export default function DemoRoleSwitcher() {
  const { user, switchUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (pathname === '/login') return null;

  const handleSwitch = (userId: string, targetPath: string) => {
    switchUser(userId);
    router.push(targetPath);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50">
      {isOpen && (
        <div className="bg-slate-900/95 text-white p-3 rounded-2xl shadow-2xl border border-teal-500/30 w-72 mb-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulasi Cepat Role (Demo)</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            {/* Santri */}
            <button
              onClick={() => handleSwitch('user-santri-1', '/santri')}
              className={`w-full flex items-center justify-between p-2 rounded-xl transition ${
                user?.role === 'SANTRI'
                  ? 'bg-teal-600 text-white font-medium shadow-sm'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 text-left">
                <GraduationCap className="w-4 h-4 text-emerald-300" />
                <div>
                  <div className="font-medium">Santri (Faiz)</div>
                  <div className="text-[10px] text-slate-300 opacity-80">Upload, Feed & Leaderboard</div>
                </div>
              </div>
              {user?.role === 'SANTRI' && <span className="text-[10px] bg-teal-800 px-1.5 py-0.5 rounded">Aktif</span>}
            </button>

            {/* Musyrif */}
            <button
              onClick={() => handleSwitch('user-musyrif-1', '/pengurus')}
              className={`w-full flex items-center justify-between p-2 rounded-xl transition ${
                user?.role === 'MUSYRIF'
                  ? 'bg-teal-600 text-white font-medium shadow-sm'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 text-left">
                <UserCheck className="w-4 h-4 text-amber-300" />
                <div>
                  <div className="font-medium">Musyrif (Ust. Abdullah)</div>
                  <div className="text-[10px] text-slate-300 opacity-80">Validasi & Pantau Halaqoh</div>
                </div>
              </div>
              {user?.role === 'MUSYRIF' && <span className="text-[10px] bg-teal-800 px-1.5 py-0.5 rounded">Aktif</span>}
            </button>

            {/* Pengawas */}
            <button
              onClick={() => handleSwitch('user-pengawas', '/pengawas')}
              className={`w-full flex items-center justify-between p-2 rounded-xl transition ${
                user?.role === 'PENGAWAS'
                  ? 'bg-teal-600 text-white font-medium shadow-sm'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 text-left">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <div>
                  <div className="font-medium">Pengawas (Ust. Usman)</div>
                  <div className="text-[10px] text-slate-300 opacity-80">Pantau Semua Santri & Feed</div>
                </div>
              </div>
              {user?.role === 'PENGAWAS' && <span className="text-[10px] bg-teal-800 px-1.5 py-0.5 rounded">Aktif</span>}
            </button>

            {/* Super Admin */}
            <button
              onClick={() => handleSwitch('user-admin', '/admin')}
              className={`w-full flex items-center justify-between p-2 rounded-xl transition ${
                user?.role === 'SUPER_ADMIN'
                  ? 'bg-teal-600 text-white font-medium shadow-sm'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 text-left">
                <ShieldCheck className="w-4 h-4 text-yellow-400" />
                <div>
                  <div className="font-medium">Super Admin / Yayasan</div>
                  <div className="text-[10px] text-slate-300 opacity-80">Kelola Akun, Pondok & Poin</div>
                </div>
              </div>
              {user?.role === 'SUPER_ADMIN' && <span className="text-[10px] bg-teal-800 px-1.5 py-0.5 rounded">Aktif</span>}
            </button>
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gradient-to-r from-teal-700 to-emerald-900 text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg border border-teal-400/40 hover:scale-105 active:scale-95 transition-all"
        title="Ganti Role Pengguna"
      >
        <ArrowRightLeft className="w-3.5 h-3.5 text-amber-300" />
        <span>Ganti Role</span>
        <span className="bg-amber-400 text-teal-950 font-bold px-1.5 py-0.5 rounded-full text-[10px]">
          {user?.role === 'SUPER_ADMIN'
            ? 'Admin'
            : user?.role === 'PENGAWAS'
            ? 'Pengawas'
            : user?.role === 'MUSYRIF'
            ? 'Musyrif'
            : 'Santri'}
        </span>
      </button>
    </div>
  );
}
