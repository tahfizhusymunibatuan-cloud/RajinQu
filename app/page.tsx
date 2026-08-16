'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'SANTRI') {
        router.push('/santri');
      } else if (user.role === 'MUSYRIF') {
        router.push('/pengurus');
      } else if (user.role === 'SUPER_ADMIN') {
        router.push('/admin');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-teal-950 text-white">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-teal-200 font-medium tracking-wide">Memuat RajinQu...</p>
      </div>
    </div>
  );
}
