import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { StoreProvider } from '@/lib/store';
import DemoRoleSwitcher from '@/components/DemoRoleSwitcher';
import { PwaInstallBanner } from '@/components/pwa-install-banner';

export const viewport: Viewport = {
  themeColor: '#06322b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'RajinQu - PTQA Batuan',
  description: 'Aplikasi Monitoring Kedisiplinan & Kegiatan Ibadah Santri Liburan Pondok Pesantren Tahfizh Al-Qur\'an Al-Usymuni Batuan Sumenep.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RajinQu',
  },
  icons: {
    icon: [
      { url: '/favicon.png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-100 min-h-screen text-slate-800 antialiased selection:bg-teal-500 selection:text-white">
        <AuthProvider>
          <StoreProvider>
            {children}
            <PwaInstallBanner />
            <DemoRoleSwitcher />
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
