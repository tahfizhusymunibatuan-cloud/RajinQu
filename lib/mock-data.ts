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

// Master Kegiatan Standar Liburan Pondok
export const MOCK_KEGIATAN: MockKegiatan[] = [
  {
    id: 'keg-1',
    nama: 'Sholat Subuh Berjamaah di Masjid',
    deskripsi: 'Wajib sholat Subuh berjamaah di masjid terdekat / musholla bersama keluarga.',
    kategori: 'IBADAH',
    poin: 15,
    icon: 'Sunrise',
    isWajib: true,
    isTimeRestricted: true,
    jamMulai: '04:15',
    jamSelesai: '05:45',
    targetWaktu: '04:15 - 05:45 WIB',
  },
  {
    id: 'keg-2',
    nama: "Muroja'ah & Ziyadah Al-Qur'an (1 Juz / 5 Lembar)",
    deskripsi: "Menjaga hafalan Al-Qur'an harian minimal 5 lembar atau 1 juz.",
    kategori: 'IBADAH',
    poin: 20,
    icon: 'BookOpen',
    isWajib: true,
    isTimeRestricted: false,
    targetWaktu: 'Bebas / Kapan Saja',
  },
  {
    id: 'keg-3',
    nama: 'Sholat Dhuha & Dzikir Pagi',
    deskripsi: "Melaksanakan sholat Dhuha minimal 2 rakaat dan membaca Al-Ma'tsurat / dzikir pagi.",
    kategori: 'IBADAH',
    poin: 10,
    icon: 'SunMedium',
    isWajib: true,
    isTimeRestricted: true,
    jamMulai: '06:30',
    jamSelesai: '11:00',
    targetWaktu: '06:30 - 11:00 WIB',
  },
  {
    id: 'keg-4',
    nama: 'Khidmah: Membantu Orang Tua di Rumah',
    deskripsi: 'Membantu pekerjaan rumah tangga (membersihkan rumah, memasak, atau belanja).',
    kategori: 'MANDIRI',
    poin: 15,
    icon: 'HeartHandshake',
    isWajib: true,
    isTimeRestricted: false,
    targetWaktu: 'Bebas / Kapan Saja',
  },
  {
    id: 'keg-5',
    nama: 'Sholat Rawatib & Dzikir Ba\'da Sholat',
    deskripsi: 'Menjaga sholat sunnah rawatib qobliyah & ba\'diyah serta dzikir harian.',
    kategori: 'IBADAH',
    poin: 10,
    icon: 'Sparkles',
    isWajib: false,
    isTimeRestricted: false,
    targetWaktu: 'Bebas / Kapan Saja',
  },
  {
    id: 'keg-6',
    nama: 'Membaca Kitab / Buku Bermanfaat (30 Menit)',
    deskripsi: 'Membaca kitab kuning, buku motivasi, sirah nabawiyah, atau pelajaran pondok.',
    kategori: 'BELAJAR',
    poin: 10,
    icon: 'GraduationCap',
    isWajib: false,
    isTimeRestricted: false,
    targetWaktu: 'Bebas / Kapan Saja',
  },
];

export interface MockPeriodeLiburan {
  id: string;
  nama: string;
  rentangTanggal: string;
  targetPoin: number;
  deskripsiReward: string;
  isActive: boolean;
}

export const MOCK_PERIODE_LIST: MockPeriodeLiburan[] = [
  {
    id: 'per-1',
    nama: 'Liburan Semester 1447 H / 2026 M',
    rentangTanggal: '01 Agustus - 31 Agustus 2026',
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
