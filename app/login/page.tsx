'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Sparkles,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  UserCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setErrorMessage('Harap masukkan Username/NIS dan Password Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await login(identifier, password);
      if (res.success && res.user) {
        if (res.user.role === 'SANTRI') {
          router.push('/santri');
        } else if (res.user.role === 'MUSYRIF') {
          router.push('/pengurus');
        } else if (res.user.role === 'PENGAWAS') {
          router.push('/pengawas');
        } else {
          router.push('/admin');
        }
      } else {
        setErrorMessage(res.message || 'Login gagal. Periksa kembali akun Anda.');
      }
    } catch (err: any) {
      setErrorMessage('Terjadi kendala pada sistem login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (id: string, pass: string) => {
    setIdentifier(id);
    setPassword(pass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80">

        {/* Header Islami Modern - Gradient Tosca Gold */}
        <div className="relative bg-gradient-to-br from-teal-700 via-teal-800 to-emerald-950 p-6 text-white text-center overflow-hidden">
          {/* Subtle Decorative Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl"></div>

          <div className="relative z-10 flex flex-col items-center">
            {/* Logo Badge Resmi Pondok */}
            <div className="w-20 h-20 rounded-2xl bg-white/95 p-1.5 shadow-xl shadow-teal-950/50 mb-3 flex items-center justify-center border-2 border-amber-300/60 backdrop-blur-md">
              <img
                src="/logo-pondok.png"
                alt="Logo Pondok Pesantren Tahfizh Al-Qur'an Al-Usymuni"
                className="w-full h-full object-contain"
              />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-1">
              Rajin<span className="text-amber-400">Qu</span>
            </h1>
            <p className="text-xs sm:text-sm text-teal-100 font-medium mt-1">
              Monitoring Kegiatan Santri Liburan
            </p>
            <div className="mt-2.5 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-400/40 text-[11px] font-semibold text-amber-300 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>PP. TAHFIZH QUR'AN AL-USYMUNI BATUAN</span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-800">Masuk ke Akun</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Akun santri & musyrif telah didaftarkan oleh Super Admin.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Identifier */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Username / NIS / No. HP
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4 text-teal-600" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Contoh: 2026001 atau 081377770003"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password / PIN
                </label>
                <span className="text-[11px] text-slate-400">Diberikan oleh Admin</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4 text-teal-600" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password / PIN"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-teal-700/20 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Masuk Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Test Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wider text-center">
              ⚡ Quick Fill Akun Demo (Klik untuk Isi):
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('2026001', '123')}
                className="p-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200/60 text-left transition group"
              >
                <div className="flex items-center gap-1 text-teal-800 font-semibold text-xs">
                  <GraduationCap className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="truncate">Santri</span>
                </div>
                <div className="text-[10px] text-teal-600 mt-0.5">Faiz (2026001)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('musyrif.abdullah', '123')}
                className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/60 text-left transition group"
              >
                <div className="flex items-center gap-1 text-amber-900 font-semibold text-xs">
                  <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">Musyrif</span>
                </div>
                <div className="text-[10px] text-amber-700 mt-0.5">Ust. Abdullah</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('pengawas.usman', '123')}
                className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200/60 text-left transition group"
              >
                <div className="flex items-center gap-1 text-sky-900 font-semibold text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span className="truncate">Pengawas</span>
                </div>
                <div className="text-[10px] text-sky-700 mt-0.5">Ust. Dr. Usman</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin', 'admin')}
                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 text-left transition group"
              >
                <div className="flex items-center gap-1 text-emerald-900 font-semibold text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Admin</span>
                </div>
                <div className="text-[10px] text-emerald-700 mt-0.5">Yayasan</div>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center text-[11px] text-slate-400">
            Lupa password atau belum punya akun? Hubungi Musyrif / Admin Pondok.
          </div>
        </div>
      </div>
    </div>
  );
}
