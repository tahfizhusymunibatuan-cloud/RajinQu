/**
 * ====================================================================
 * RAJINQU - DATA INISIALISASI & MASTER (PRODUCTION MODE)
 * ====================================================================
 */

export interface MockUser {
  id: string;
  username: string; // NIS / Username akun yang dibuatkan Admin
  noHp: string;
  password: string; // PIN / Password dibuatkan admin (misal: "123")
  nama: string;
  role: 'SUPER_ADMIN' | 'PENGAWAS' | 'MUSYRIF' | 'SANTRI';
  avatarUrl: string;
  pondokNama: string;
  musyrifId?: string;
  musyrifNama?: string;
  kelompokId?: string;
  kelompokNama?: string;
  asrama?: string;
  totalPoin: number;
  peringkat?: number;
  selisihPeringkat?: number;
}

export interface MockKelompok {
  id: string;
  nama: string;
  deskripsi: string;
  musyrifId: string;
  musyrifNama: string;
  santriIds: string[];
  kategoriGender?: 'PUTRA' | 'PUTRI' | 'CAMPUR';
  createdAt: string;
}

// 0 Kelompok Awal (Siap Dibuat oleh Admin)
export const MOCK_KELOMPOK: MockKelompok[] = [];

export interface MockKegiatan {
  id: string;
  nama: string;
  deskripsi: string;
  kategori: 'IBADAH' | 'BELAJAR' | 'SOSIAL' | 'MANDIRI';
  poin: number;
  icon: string;
  isWajib: boolean;
  isTimeRestricted: boolean;
  jamMulai?: string;
  jamSelesai?: string;
  targetWaktu: string;
}

export interface MockLaporan {
  id: string;
  userId: string;
  userNama: string;
  userAvatar: string;
  userAsrama: string;
  kegiatanId: string;
  kegiatanNama: string;
  kategori: 'IBADAH' | 'BELAJAR' | 'SOSIAL' | 'MANDIRI';
  poin: number;
  fotoUrl: string;
  lat: number;
  long: number;
  lokasiName: string;
  catatanSantri: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  statusWaktu: 'TEPAT_WAKTU' | 'TERLAMBAT';
  waktuLaporWIB: string;
  catatanPengurus?: string;
  createdAt: string;
  likesCount: number;
  isLikedByUser: boolean;
  likedUserIds?: string[];
  comments: {
    id: string;
    nama: string;
    avatar: string;
    role: string;
    isi: string;
    waktu: string;
  }[];
}

// 1 Akun Super Admin Utama (0 Akun Santri Dummy / 0 Akun Musyrif Dummy)
export const MOCK_USERS: MockUser[] = [
  {
    id: 'user-admin',
    username: 'admin',
    noHp: '081234567890',
    password: '123',
    nama: 'Super Admin Yayasan',
    role: 'SUPER_ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    pondokNama: 'PTQA BATUAN',
    totalPoin: 0,
  },
];

// 0 Laporan Dummy Awal (Siap Menerima Laporan Riil)
export const MOCK_LAPORAN: MockLaporan[] = [];

// 0 Kegiatan Awal (Siap Dibuat oleh Admin)
export const MOCK_KEGIATAN: MockKegiatan[] = [];

export interface MockPeriodeLiburan {
  id: string;
  nama: string;
  tanggalMulai?: string;
  tanggalSelesai?: string;
  rentangTanggal: string;
  targetPoin: number;
  deskripsiReward: string;
  isActive: boolean;
}

export const MOCK_PERIODE_LIST: MockPeriodeLiburan[] = [
  {
    id: 'per-1',
    nama: 'Liburan Semester 1447 H / 2026 M',
    tanggalMulai: '2026-08-01',
    tanggalSelesai: '2026-08-31',
    rentangTanggal: '2026-08-01 s/d 2026-08-31',
    targetPoin: 400,
    deskripsiReward: '🏆 Sertifikat Teladan Santri Berprestasi + Hadiah Beasiswa & Penghargaan Yayasan PTQA Batuan.',
    isActive: true,
  },
];

export const MOCK_STATISTIK_MINGGUAN = [
  { hari: 'Senin', target: 5, selesai: 0, poin: 0 },
  { hari: 'Selasa', target: 5, selesai: 0, poin: 0 },
  { hari: 'Rabu', target: 5, selesai: 0, poin: 0 },
  { hari: 'Kamis', target: 5, selesai: 0, poin: 0 },
  { hari: 'Jumat', target: 5, selesai: 0, poin: 0 },
  { hari: 'Sabtu', target: 5, selesai: 0, poin: 0 },
  { hari: 'Ahad', target: 5, selesai: 0, poin: 0 },
];

export const MOCK_REWARD_PERIODE = MOCK_PERIODE_LIST[0];
