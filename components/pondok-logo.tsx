'use client';

import React from 'react';

interface PondokLogoProps {
  variant?: 'green' | 'white';
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export function PondokLogo({
  variant = 'green',
  className = '',
  size = 40,
  showText = false,
}: PondokLogoProps) {
  const logoSrc = variant === 'white' ? '/api/logo?type=white' : '/api/logo?type=green';

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src={logoSrc}
        alt="Logo Pondok Pesantren Tahfizh Al-Qur'an Al-Usymuni Batuan"
        style={{ width: size, height: size }}
        className="object-contain shrink-0 drop-shadow-xs"
      />
      {showText && (
        <div className="flex flex-col">
          <span className="font-extrabold text-xs tracking-tight leading-tight">
            PTQA AL-USYMUNI
          </span>
          <span className="text-[9px] opacity-80 font-medium">
            Batuan, Sumenep
          </span>
        </div>
      )}
    </div>
  );
}
