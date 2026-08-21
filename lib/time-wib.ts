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

/**
 * Mengembalikan tanggal hari ini dalam format YYYY-MM-DD sesuai zona waktu Asia/Jakarta (WIB)
 */
export function getTodayWIBDateString(): string {
  const wib = getWIBDate();
  const year = wib.getFullYear();
  const month = (wib.getMonth() + 1).toString().padStart(2, '0');
  const day = wib.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Mengecek status laporan santri pada hari ini untuk suatu kegiatan tertentu
 */
export function getSantriDailyActivityStatus(
  laporanList: any[],
  userId?: string,
  userNama?: string,
  kegiatanId?: string,
  targetDateStr?: string
): {
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'NONE';
  laporan?: any;
  canSubmit: boolean;
  isApproved: boolean;
  isPending: boolean;
  isRejected: boolean;
} {
  const dateKey = targetDateStr || getTodayWIBDateString();

  // Cari semua laporan santri untuk kegiatan ini pada hari yang ditentukan
  const matchedLaporans = (laporanList || []).filter((lap) => {
    const isUser =
      (userId && String(lap.userId) === String(userId)) ||
      (userNama && lap.userNama && String(lap.userNama).trim().toLowerCase() === String(userNama).trim().toLowerCase());
    if (!isUser) return false;
    if (kegiatanId && String(lap.kegiatanId) !== String(kegiatanId)) return false;

    // Normalisasi tanggal pembuatan laporan ke WIB YYYY-MM-DD
    let lapDateStr = '';
    if (!lap.createdAt) {
      lapDateStr = getTodayWIBDateString();
    } else if (typeof lap.createdAt === 'string' && lap.createdAt.toLowerCase().includes('hari ini')) {
      lapDateStr = getTodayWIBDateString();
    } else {
      const lapDate = new Date(lap.createdAt);
      if (isNaN(lapDate.getTime())) {
        lapDateStr = getTodayWIBDateString();
      } else {
        const lapDateWIB = new Date(lapDate.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
        const lapYear = lapDateWIB.getFullYear();
        const lapMonth = (lapDateWIB.getMonth() + 1).toString().padStart(2, '0');
        const lapDay = lapDateWIB.getDate().toString().padStart(2, '0');
        lapDateStr = `${lapYear}-${lapMonth}-${lapDay}`;
      }
    }

    return lapDateStr === dateKey;
  });

  // Prioritas 1: Jika ada yang APPROVED -> Berstatus APPROVED (Terkunci & Selesai)
  const approvedLap = matchedLaporans.find((l) => l.status && String(l.status).toUpperCase() === 'APPROVED');
  if (approvedLap) {
    return {
      status: 'APPROVED',
      laporan: approvedLap,
      canSubmit: false,
      isApproved: true,
      isPending: false,
      isRejected: false,
    };
  }

  // Prioritas 2: Jika ada yang PENDING -> Berstatus PENDING (Menunggu Validasi Musyrif)
  const pendingLap = matchedLaporans.find((l) => l.status && String(l.status).toUpperCase() === 'PENDING');
  if (pendingLap) {
    return {
      status: 'PENDING',
      laporan: pendingLap,
      canSubmit: false,
      isApproved: false,
      isPending: true,
      isRejected: false,
    };
  }

  // Prioritas 3: Jika ada yang REJECTED -> Berstatus REJECTED (Bisa Lapor Ulang)
  const rejectedLap = matchedLaporans.find((l) => l.status && String(l.status).toUpperCase() === 'REJECTED');
  if (rejectedLap) {
    return {
      status: 'REJECTED',
      laporan: rejectedLap,
      canSubmit: true,
      isApproved: false,
      isPending: false,
      isRejected: true,
    };
  }

  // Belum pernah lapor hari ini
  return {
    status: 'NONE',
    laporan: undefined,
    canSubmit: true,
    isApproved: false,
    isPending: false,
    isRejected: false,
  };
}

