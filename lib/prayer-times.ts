/**
 * ====================================================================
 * RAJINQU - PRAYER TIMES & WIB COUNTDOWN HELPER
 * Menghitung jadwal sholat wilayah Sumenep / Jawa Timur (WIB)
 * dan countdown batas waktu kegiatan ibadah.
 * ====================================================================
 */

export interface PrayerTimeItem {
  id: string;
  name: string;
  arabicName: string;
  time: string; // HH:mm format WIB
  iconName: string;
}

export interface ActivityCountdownInfo {
  kegiatanId: string;
  kegiatanNama: string;
  jamMulai: string;
  jamSelesai: string;
  targetWaktu: string;
  status: 'BELUM_DIBUKA' | 'SEDANG_DIBUKA' | 'SEGERA_BERAKHIR' | 'BERAKHIR';
  remainingText: string;
  remainingSeconds: number;
}

// Jadwal Sholat Standar Wilayah Sumenep & Sekitarnya (WIB)
export const DEFAULT_PRAYER_SCHEDULE: PrayerTimeItem[] = [
  { id: 'subuh', name: 'Subuh', arabicName: 'الفجر', time: '04:22', iconName: 'Sunrise' },
  { id: 'terbit', name: 'Syuruq', arabicName: 'الشروق', time: '05:38', iconName: 'Sun' },
  { id: 'dhuha', name: 'Dhuha', arabicName: 'الضحى', time: '06:05', iconName: 'Sparkles' },
  { id: 'dzuhur', name: 'Dzuhur', arabicName: 'الظهر', time: '11:39', iconName: 'SunMedium' },
  { id: 'ashar', name: 'Ashar', arabicName: 'العصر', time: '14:58', iconName: 'CloudSun' },
  { id: 'maghrib', name: 'Maghrib', arabicName: 'المغرب', time: '17:34', iconName: 'Sunset' },
  { id: 'isya', name: 'Isya', arabicName: 'العشاء', time: '18:44', iconName: 'Moon' },
];

/**
 * Mendapatkan tanggal & waktu sekarang dalam WIB (UTC+7)
 */
export function getCurrentWIBDate(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 7 * 3600000);
}

/**
 * Mencari waktu sholat berikutnya beserta countdown
 */
export function getNextPrayerInfo(prayers = DEFAULT_PRAYER_SCHEDULE) {
  const wib = getCurrentWIBDate();
  const currentMinutes = wib.getHours() * 60 + wib.getMinutes();
  const currentSeconds = wib.getSeconds();

  for (const p of prayers) {
    const [h, m] = p.time.split(':').map(Number);
    const prayerMinutes = h * 60 + m;

    if (prayerMinutes > currentMinutes) {
      const diffMinutes = prayerMinutes - currentMinutes - 1;
      const diffSeconds = 60 - currentSeconds;
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      const seconds = diffSeconds === 60 ? 0 : diffSeconds;

      return {
        nextPrayer: p,
        hours,
        minutes,
        seconds,
        countdownStr: `${hours > 0 ? `${hours}j ` : ''}${minutes}m ${seconds}d`,
      };
    }
  }

  // Jika sudah melewati Isya, sholat berikutnya adalah Subuh besok
  const subuh = prayers[0];
  const [sh, sm] = subuh.time.split(':').map(Number);
  const subuhMinutesTomorrow = 24 * 60 + (sh * 60 + sm);
  const diffMinutes = subuhMinutesTomorrow - currentMinutes - 1;
  const diffSeconds = 60 - currentSeconds;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  const seconds = diffSeconds === 60 ? 0 : diffSeconds;

  return {
    nextPrayer: subuh,
    hours,
    minutes,
    seconds,
    countdownStr: `${hours > 0 ? `${hours}j ` : ''}${minutes}m ${seconds}d`,
  };
}

/**
 * Menghitung countdown untuk kegiatan tertentu yang dibatasi jam mulai & jam selesai
 */
export function calculateActivityCountdown(
  jamMulai?: string,
  jamSelesai?: string
): {
  status: 'BELUM_DIBUKA' | 'SEDANG_DIBUKA' | 'SEGERA_BERAKHIR' | 'BERAKHIR';
  remainingSeconds: number;
  remainingText: string;
  progressPercent: number;
} {
  if (!jamMulai || !jamSelesai) {
    return {
      status: 'SEDANG_DIBUKA',
      remainingSeconds: 0,
      remainingText: 'Waktu Bebas / Kapan Saja',
      progressPercent: 100,
    };
  }

  const wib = getCurrentWIBDate();
  const [mulaiH, mulaiM] = jamMulai.split(':').map(Number);
  const [selesaiH, selesaiM] = jamSelesai.split(':').map(Number);

  const nowMinutes = wib.getHours() * 60 + wib.getMinutes();
  const nowTotalSeconds = nowMinutes * 60 + wib.getSeconds();

  const startTotalSeconds = (mulaiH * 60 + mulaiM) * 60;
  const endTotalSeconds = (selesaiH * 60 + selesaiM) * 60;

  if (nowTotalSeconds < startTotalSeconds) {
    // Belum dibuka
    const diff = startTotalSeconds - nowTotalSeconds;
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;

    return {
      status: 'BELUM_DIBUKA',
      remainingSeconds: diff,
      remainingText: `Dibuka dalam ${h > 0 ? `${h}j ` : ''}${m}m ${s}d`,
      progressPercent: 0,
    };
  }

  if (nowTotalSeconds >= startTotalSeconds && nowTotalSeconds <= endTotalSeconds) {
    // Sedang dibuka
    const diff = endTotalSeconds - nowTotalSeconds;
    const totalDuration = endTotalSeconds - startTotalSeconds;
    const elapsed = nowTotalSeconds - startTotalSeconds;
    const progress = totalDuration > 0 ? Math.min(100, Math.round((elapsed / totalDuration) * 100)) : 100;

    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;

    const isUrgent = diff <= 1200; // <= 20 menit

    return {
      status: isUrgent ? 'SEGERA_BERAKHIR' : 'SEDANG_DIBUKA',
      remainingSeconds: diff,
      remainingText: `Sisa ${h > 0 ? `${h}j ` : ''}${m}m ${s}d lagi (Batas: ${jamSelesai} WIB)`,
      progressPercent: progress,
    };
  }

  // Melewati batas waktu
  const diffAfter = nowTotalSeconds - endTotalSeconds;
  const m = Math.floor(diffAfter / 60);

  return {
    status: 'BERAKHIR',
    remainingSeconds: 0,
    remainingText: `Batas lapor telah lewat (${m}m lalu). Status: Terlambat.`,
    progressPercent: 100,
  };
}
