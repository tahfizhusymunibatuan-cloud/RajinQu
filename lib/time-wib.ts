/**
 * Helper Utility Waktu Indonesia Barat (WIB / UTC+7)
 * Memastikan semua komparasi jam kegiatan akurat berdasarkan zona waktu WIB
 */

export function getWIBDate(): Date {
  const now = new Date();
  // Format ke timezone Asia/Jakarta
  const jakartaTimeString = now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  return new Date(jakartaTimeString);
}

export function getWIBTimeString(date?: Date): string {
  const targetDate = date ? new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })) : getWIBDate();
  const hours = targetDate.getHours().toString().padStart(2, '0');
  const minutes = targetDate.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes} WIB`;
}

export function getWIBFullDateString(date?: Date): string {
  const targetDate = date ? new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })) : getWIBDate();
  return targetDate.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WIB';
}

export interface WaktuCheckResult {
  isTepatWaktu: boolean;
  statusWaktu: 'TEPAT_WAKTU' | 'TERLAMBAT';
  currentTimeWIB: string;
  keterangan: string;
}

/**
 * Memeriksa apakah waktu saat ini (WIB) berada dalam rentang jamMulai dan jamSelesai kegiatan
 */
export function checkWaktuKegiatan(
  isTimeRestricted: boolean,
  jamMulai?: string,
  jamSelesai?: string
): WaktuCheckResult {
  const wibDate = getWIBDate();
  const currentHours = wibDate.getHours();
  const currentMinutes = wibDate.getMinutes();
  const currentTotalMinutes = currentHours * 60 + currentMinutes;
  const currentTimeWIB = getWIBTimeString();

  // Jika kegiatan waktu bebas / tidak dibatasi jam
  if (!isTimeRestricted || !jamMulai || !jamSelesai) {
    return {
      isTepatWaktu: true,
      statusWaktu: 'TEPAT_WAKTU',
      currentTimeWIB,
      keterangan: 'Waktu Fleksibel (Kapan Saja)',
    };
  }

  // Parse jam mulai & jam selesai
  const [mulaiHour, mulaiMin] = jamMulai.split(':').map(Number);
  const [selesaiHour, selesaiMin] = jamSelesai.split(':').map(Number);

  const startTotalMinutes = (mulaiHour || 0) * 60 + (mulaiMin || 0);
  const endTotalMinutes = (selesaiHour || 0) * 60 + (selesaiMin || 0);

  // Jika jam selesai lebih kecil dari jam mulai (melewati tengah malam)
  let isWithinRange = false;
  if (endTotalMinutes >= startTotalMinutes) {
    isWithinRange = currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes;
  } else {
    isWithinRange = currentTotalMinutes >= startTotalMinutes || currentTotalMinutes <= endTotalMinutes;
  }

  if (isWithinRange) {
    return {
      isTepatWaktu: true,
      statusWaktu: 'TEPAT_WAKTU',
      currentTimeWIB,
      keterangan: `Tepat Waktu (Target: ${jamMulai} - ${jamSelesai} WIB)`,
    };
  } else {
    return {
      isTepatWaktu: false,
      statusWaktu: 'TERLAMBAT',
      currentTimeWIB,
      keterangan: `Terlambat / Di Luar Jam (Target: ${jamMulai} - ${jamSelesai} WIB)`,
    };
  }
}
