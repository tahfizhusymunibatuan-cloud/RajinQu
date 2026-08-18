'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldCheck, UserCheck, GraduationCap, ArrowRightLeft, Sparkles, LogOut } from 'lucide-react';

export default function DemoRoleSwitcher() {
  const { user, switchUser, logout } = useAuth();
  const { allUsers } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Jangan render pada SSR atau di halaman login
  if (!mounted || pathname === '/login') return null;

  // Hanya tampilkan jika user yang sedang login adalah SUPER_ADMIN (atau session pengawas yayasan)
  const isSuperAdminSession =
    user?.role === 'SUPER_ADMIN' ||
    user?.username === 'admin' ||
    (typeof window !== 'undefined' && localStorage.getItem('rajinqu_admin_preview') === 'true');

  if (!isSuperAdminSession) {
    return null;
  }

  const handleSwitch = (userId: string, targetPath: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rajinqu_admin_preview', 'true');
    }
    switchUser(userId);
    router.push(targetPath);
    setIsOpen(false);
  };

  const handleReturnToAdmin = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rajinqu_admin_preview');
    }
    const adminUser = allUsers.find((u) => u.role === 'SUPER_ADMIN') || {
      id: 'user-admin',
      username: 'admin',
      nama: 'Super Admin Yayasan',
      role: 'SUPER_ADMIN',
    };
    switchUser(adminUser.id);
    router.push('/admin');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50">
      {isOpen && (
        <div className="bg-slate-900/95 text-white p-3 rounded-2xl shadow-2xl border border-teal-500/30 w-72 mb-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Mode Pratinjau Super Admin</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded"
            >
              ✕
            </button>
          </div>

          <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
            Fitur khusus Super Admin untuk memeriksa tampilan antarmuka setiap hak akses.
          </p>

          <div className="space-y-1.5 text-xs">
            {/* Kembali ke Super Admin */}
            <button
              onClick={handleReturnToAdmin}
              className={`w-full flex items-center justify-between p-2 rounded-xl transition ${
                user?.role === 'SUPER_ADMIN'
                  ? 'bg-amber-600 text-white font-bold shadow-sm'
                  : 'bg-amber-950/40 border border-amber-500/40 hover:bg-amber-900/60 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2 text-left">
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <div>
                  <div className="font-bold">Super Admin (Yayasan)</div>
                  <div className="text-[9px] text-amber-200/80">Panel Kelola & Pengaturan</div>
                </div>
              </div>
              {user?.role === 'SUPER_ADMIN' && <span className="text-[9px] bg-amber-800 px-1.5 py-0.5 rounded">Aktif</span>}
            </button>

            {/* Santri */}
            <button
              onClick={() => {
                const firstSantri = allUsers.find((u) => u.role === 'SANTRI');
                if (firstSantri) {
                  handleSwitch(firstSantri.id, '/santri');
                } else {
                  router.push('/santri');
                  setIsOpen(false);
                }
              }}
              className={`w-full flex items-center justify-between p-2 rounded-xl transition ${
                user?.role === 'SANTRI'
                  ? 'bg-teal-600 text-white font-bold shadow-sm'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 text-left">
                <GraduationCap className="w-4 h-4 text-emerald-300" />
                <div>
                  <div className="font-semibold">Dashboard Santri</div>
                  <div className="text-[9px] text-slate-400">Upload & Linimasa Kegiatan</div>
                </div>
              </div>
              {user?.role === 'SANTRI' && <span className="text-[9px] bg-teal-800 px-1.5 py-0.5 rounded">Aktif</span>}
            </button>

            {/* Musyrif */}
            <button
              onClick={() => {
                const firstMusyrif = allUsers.find((u) => u.role === 'MUSYRIF');
                if (firstMusyrif) {
                  handleSwitch(firstMusyrif.id, '/pengurus');
                } else {
                  router.push('/pengurus');
                  setIsOpen(false);
                }
              }}
              className={`w-full flex items-center justify-between p-2 rounded-xl transition ${
                user?.role === 'MUSYRIF'
                  ? 'bg-teal-600 text-white font-bold shadow-sm'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 text-left">
                <UserCheck className="w-4 h-4 text-amber-300" />
                <div>
                  <div className="font-semibold">Dashboard Musyrif</div>
                  <div className="text-[9px] text-slate-400">Validasi Laporan Kelompok</div>
                </div>
              </div>
              {user?.role === 'MUSYRIF' && <span className="text-[9px] bg-teal-800 px-1.5 py-0.5 rounded">Aktif</span>}
            </button>

            {/* Pengawas */}
            <button
              onClick={() => {
                const firstPengawas = allUsers.find((u) => u.role === 'PENGAWAS');
                if (firstPengawas) {
                  handleSwitch(firstPengawas.id, '/pengawas');
                } else {
                  router.push('/pengawas');
                  setIsOpen(false);
                }
              }}
              className={`w-full flex items-center justify-between p-2 rounded-xl transition ${
                user?.role === 'PENGAWAS'
                  ? 'bg-teal-600 text-white font-bold shadow-sm'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 text-left">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <div>
                  <div className="font-semibold">Dashboard Pengawas</div>
                  <div className="text-[9px] text-slate-400">Monitoring Santri & Feed</div>
                </div>
              </div>
              {user?.role === 'PENGAWAS' && <span className="text-[9px] bg-teal-800 px-1.5 py-0.5 rounded">Aktif</span>}
            </button>
          </div>
        </div>
      )}

      {/* Trigger Button Khusus Super Admin */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gradient-to-r from-teal-800 to-emerald-950 text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg border border-amber-400/40 hover:scale-105 active:scale-95 transition-all"
        title="Pratinjau Hak Akses (Super Admin)"
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
