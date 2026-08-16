import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { StoreProvider } from '@/lib/store';
import DemoRoleSwitcher from '@/components/DemoRoleSwitcher';
import { PwaInstallBanner } from '@/components/pwa-install-banner';

export const viewport: Viewport = {
  themeColor: '#0f766e',
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
    statusBarStyle: 'default',
    title: 'RajinQu',
  },
  icons: {
    icon: '/logo-pondok.png',
    apple: '/logo-pondok.png',
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
