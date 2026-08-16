'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share2, PlusSquare, Check } from 'lucide-react';

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('SW registered successfully:', reg.scope))
        .catch((err) => console.log('SW registration failed:', err));
    }

    // Check if already in standalone/PWA mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for beforeinstallprompt event (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Cek apakah user sudah dismiss sebelumnya di sesi ini
      const isDismissed = sessionStorage.getItem('rajinqu_pwa_dismissed');
      if (!isDismissed) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    sessionStorage.setItem('rajinqu_pwa_dismissed', 'true');
  };

  if (isInstalled) return null;

  return (
    <>
      {/* Floating Install Prompt Banner */}
      {showInstallPrompt && (
        <div className="fixed bottom-20 inset-x-3 max-w-sm mx-auto z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 text-white p-3.5 rounded-2xl shadow-2xl border border-amber-400/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center border border-amber-300/60 shrink-0 shadow-sm">
                <img
                  src="/api/logo?type=green"
                  alt="Logo PPTQ Al-Usymuni"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate flex items-center gap-1">
                  <span>Install Aplikasi RajinQu</span>
                  <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black">
                    PWA
                  </span>
                </h4>
                <p className="text-[10px] text-teal-200 truncate mt-0.5">
                  Pasang di layar HP untuk akses lebih cepat
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleInstallClick}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition active:scale-95 flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Petunjuk iOS Safari */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom-6 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-200">
                  <Smartphone className="w-4 h-4 text-teal-700" />
                </div>
                <h3 className="text-xs font-bold text-slate-900">Install di iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
              <p className="font-semibold text-slate-900">
                Ikuti 2 langkah mudah berikut untuk memasang RajinQu ke Layar Utama:
              </p>
              <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-teal-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  Ketuk tombol <strong>Bagikan / Share</strong> (<Share2 className="inline w-3.5 h-3.5 text-blue-600 mx-0.5" />) di bilah bawah browser Safari Anda.
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-teal-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  Gulir ke bawah dan pilih menu <strong>"Tambahkan ke Layar Utama" / "Add to Home Screen"</strong> (<PlusSquare className="inline w-3.5 h-3.5 text-slate-700 mx-0.5" />).
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow transition"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}
