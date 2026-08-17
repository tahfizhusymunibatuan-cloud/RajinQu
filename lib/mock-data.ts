/**
 * ====================================================================
 * RAJINQU - MOCK DATA & DATA SEEDING
 * ====================================================================
 */

export interface MockUser {
  id: string;
  username: string; // NIS / Username akun yang dibuatkan Admin
  noHp: string;
  password: string; // PIN / Password dibuatkan admin (misal: "123456")
  nama: string;
  role: 'SUPER_ADMIN' | 'PENGAWAS' | 'MUSYRIF' | 'SANTRI';
  avatarUrl: string;
  pondokNama: string;
  musyrifId?: string;
  musyrifNama?: string;
  asrama?: string;
  totalPoin: number;
  peringkat?: number;
  selisihPeringkat?: number;
}

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

export const MOCK_USERS: MockUser[] = [
  {
    id: 'user-admin',
    username: 'admin',
    noHp: '081299990001',
    password: 'admin',
    nama: 'Ustadz H. Ahmad Fauzi, Lc.',
    role: 'SUPER_ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    pondokNama: 'PTQA BATUAN',
    totalPoin: 0,
  },
  {
    id: 'user-pengawas',
    username: 'pengawas.usman',
    noHp: '081288880009',
    password: '123',
    nama: 'Ustadz Dr. H. Usman Ridwan, M.Pd.',
    role: 'PENGAWAS',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    pondokNama: 'PTQA BATUAN',
    asrama: 'Koordinator / Pengawas Utama Kesantrian',
    totalPoin: 0,
  },
  {
    id: 'user-musyrif-1',
    username: 'musyrif.abdullah',
    noHp: '081288880002',
    password: '123',
    nama: 'Ustadz Abdullah Robbani',
    role: 'MUSYRIF',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    pondokNama: 'PTQA BATUAN',
    asrama: 'Musyrif Halaqoh Abu Amr (Putra)',
    totalPoin: 0,
  },
  {
    id: 'user-musyrif-2',
    username: 'musyrifah.fatimah',
    noHp: '081288880003',
    password: '123',
    nama: 'Ustadzah Siti Fatimah, S.Pd.I',
    role: 'MUSYRIF',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    pondokNama: 'PTQA BATUAN',
    asrama: 'Musyrifah Halaqoh Khadijah (Putri)',
    totalPoin: 0,
  },
  {
    id: 'user-santri-1',
    username: '2026001',
    noHp: '081717594886',
    password: '123',
    nama: 'Muhammad Faiz Ar-Rasyid',
    role: 'SANTRI',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    pondokNama: 'PTQA BATUAN',
    musyrifId: 'user-musyrif-1',
    musyrifNama: 'Ustadz Abdullah Robbani',
    asrama: 'Kelas 3 TMI / Halaqoh Abu Amr',
    totalPoin: 265,
    peringkat: 1,
    selisihPeringkat: 0,
  },
  {
    id: 'user-santri-2',
    username: '2026002',
    noHp: '081377770004',
    password: '123',
    nama: 'Ahmad Zaidan Al-Farisi',
    role: 'SANTRI',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    pondokNama: 'PTQA BATUAN',
    musyrifId: 'user-musyrif-1',
    musyrifNama: 'Ustadz Abdullah Robbani',
    asrama: 'Kelas 4 TMI / Halaqoh Abu Amr',
    totalPoin: 220,
    peringkat: 2,
    selisihPeringkat: 1,
  },
  {
    id: 'user-santri-3',
    username: '2026003',
    noHp: '081377770005',
    password: '123',
    nama: 'Aisyah Nuha Zahirah',
    role: 'SANTRI',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    pondokNama: 'PTQA BATUAN',
    musyrifId: 'user-musyrif-2',
    musyrifNama: 'Ustadzah Siti Fatimah, S.Pd.I',
    asrama: 'Kelas 5 TMI / Halaqoh Khadijah',
    totalPoin: 205,
    peringkat: 3,
    selisihPeringkat: -1,
  },
  {
    id: 'user-santri-4',
    username: '2026004',
    noHp: '081377770006',
    password: '123',
    nama: 'Fatih Rayyan Al-Ghifari',
    role: 'SANTRI',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    pondokNama: 'PTQA BATUAN',
    musyrifId: 'user-musyrif-1',
    musyrifNama: 'Ustadz Abdullah Robbani',
    asrama: 'Kelas 3 TMI / Halaqoh Abu Amr',
    totalPoin: 180,
    peringkat: 4,
    selisihPeringkat: 2,
  },
  {
    id: 'user-santri-5',
    username: '2026005',
    noHp: '081377770007',
    password: '123',
    nama: 'Hilmi Nur Hidayat',
    role: 'SANTRI',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    pondokNama: 'PTQA BATUAN',
    musyrifId: 'user-musyrif-1',
    musyrifNama: 'Ustadz Abdullah Robbani',
    asrama: 'Kelas 4 TMI / Halaqoh Abu Amr',
    totalPoin: 165,
    peringkat: 5,
    selisihPeringkat: 0,
  }
];

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
    jamMulai: '04:30',
    jamSelesai: '05:45',
    targetWaktu: '04:30 - 05:45 WIB'
  },
  {
    id: 'keg-2',
    nama: 'Muroja\'ah & Ziyadah Al-Qur\'an (1 Juz / 5 Lembar)',
    deskripsi: 'Menjaga hafalan Al-Qur\'an harian minimal 5 lembar atau 1 juz.',
    kategori: 'IBADAH',
    poin: 20,
    icon: 'BookOpen',
    isWajib: true,
    isTimeRestricted: false,
    targetWaktu: 'Bebas / Kapan Saja'
  },
  {
    id: 'keg-3',
    nama: 'Sholat Dhuha & Dzikir Pagi',
    deskripsi: 'Melaksanakan sholat Dhuha minimal 2 rakaat dan membaca Al-Ma\'tsurat.',
    kategori: 'IBADAH',
    poin: 10,
    icon: 'SunMedium',
    isWajib: true,
    isTimeRestricted: true,
    jamMulai: '07:30',
    jamSelesai: '10:30',
    targetWaktu: '07:30 - 10:30 WIB'
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
    targetWaktu: 'Bebas / Kapan Saja'
  },
  {
    id: 'keg-5',
    nama: 'Membaca Kitab / Buku Bermanfaat (30 Menit)',
    deskripsi: 'Membaca kitab kuning, buku motivasi, sejarah Islam, atau literatur pelajaran.',
    kategori: 'BELAJAR',
    poin: 10,
    icon: 'GraduationCap',
    isWajib: false,
    isTimeRestricted: false,
    targetWaktu: 'Bebas / Kapan Saja'
  },
  {
    id: 'keg-6',
    nama: 'Olahraga Pagi / Senam Sehat (15 Menit)',
    deskripsi: 'Menjaga kebugaran jasmani santri dengan jogging, skipping, atau push-up.',
    kategori: 'MANDIRI',
    poin: 10,
    icon: 'Activity',
    isWajib: false,
    isTimeRestricted: true,
    jamMulai: '06:00',
    jamSelesai: '07:30',
    targetWaktu: '06:00 - 07:30 WIB'
  }
];

export const MOCK_LAPORAN: MockLaporan[] = [
  {
    id: 'lap-001',
    userId: 'user-santri-1',
    userNama: 'Muhammad Faiz Ar-Rasyid',
    userAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    userAsrama: 'Kelas 3 TMI / Halaqoh Abu Amr',
    kegiatanId: 'keg-1',
    kegiatanNama: 'Sholat Subuh Berjamaah di Masjid',
    kategori: 'IBADAH',
    poin: 15,
    fotoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
    lat: -6.2088,
    long: 106.8456,
    lokasiName: 'Masjid Raya Al-Ikhlas, Tebet, Jakarta Selatan',
    catatanSantri: 'Alhamdulillah sholat subuh berjamaah tepat waktu di shaf pertama bersama ayah.',
    status: 'APPROVED',
    statusWaktu: 'TEPAT_WAKTU',
    waktuLaporWIB: '05:15 WIB',
    catatanPengurus: 'Barakallahu fiik Faiz, pertahankan istiqomah di shaf awal!',
    createdAt: '2026-08-16 05:15 WIB',
    likesCount: 14,
    isLikedByUser: true,
    comments: [
      {
        id: 'c-1',
        nama: 'Ustadz Abdullah Robbani',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        role: 'MUSYRIF',
        isi: 'MasyaAllah Tabarakallah, teladan yang sangat baik akhi Faiz.',
        waktu: '05:30 WIB'
      },
      {
        id: 'c-2',
        nama: 'Ahmad Zaidan Al-Farisi',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        role: 'SANTRI',
        isi: 'Mantap bro Faiz! Besok saingan di leaderboard ya!',
        waktu: '06:02 WIB'
      }
    ]
  },
  {
    id: 'lap-002',
    userId: 'user-santri-3',
    userNama: 'Aisyah Nuha Zahirah',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    userAsrama: 'Kelas 5 TMI / Halaqoh Khadijah',
    kegiatanId: 'keg-2',
    kegiatanNama: 'Muroja\'ah & Ziyadah Al-Qur\'an',
    kategori: 'IBADAH',
    poin: 20,
    fotoUrl: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=600&auto=format&fit=crop&q=80',
    lat: -6.9175,
    long: 107.6191,
    lokasiName: 'Rumah Santri, Buahbatu, Bandung',
    catatanSantri: 'Muroja\'ah Juz 29 Surat Al-Mulk s.d Al-Qalam selesai ba\'da Ashar.',
    status: 'APPROVED',
    statusWaktu: 'TEPAT_WAKTU',
    waktuLaporWIB: '16:20 WIB',
    catatanPengurus: 'Mumtazah Aisyah! Jangan lupa tajwid mad jaiz-nya terus dijaga.',
    createdAt: '2026-08-16 16:20 WIB',
    likesCount: 21,
    isLikedByUser: false,
    comments: [
      {
        id: 'c-3',
        nama: 'Salma Az-Zahra',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'SANTRI',
        isi: 'Semangat terus ukhti Aisyah! Keren banget lancar juz 29.',
        waktu: '16:45 WIB'
      }
    ]
  },
  {
    id: 'lap-003',
    userId: 'user-santri-2',
    userNama: 'Ahmad Zaidan Al-Farisi',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    userAsrama: 'Kelas 4 TMI / Halaqoh Abu Amr',
    kegiatanId: 'keg-4',
    kegiatanNama: 'Khidmah: Membantu Orang Tua di Rumah',
    kategori: 'MANDIRI',
    poin: 15,
    fotoUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&auto=format&fit=crop&q=80',
    lat: -6.2297,
    long: 106.8402,
    lokasiName: 'Dapur Rumah, Mampang Prapatan, Jakarta',
    catatanSantri: 'Membantu ibu merapikan ruang makan dan mencuci piring setelah sarapan.',
    status: 'PENDING',
    statusWaktu: 'TEPAT_WAKTU',
    waktuLaporWIB: '08:30 WIB',
    createdAt: '2026-08-16 08:30 WIB',
    likesCount: 8,
    isLikedByUser: false,
    comments: []
  },
  {
    id: 'lap-004',
    userId: 'user-santri-4',
    userNama: 'Fatih Rayyan Al-Ghifari',
    userAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    userAsrama: 'Kelas 3 TMI / Halaqoh Abu Amr',
    kegiatanId: 'keg-3',
    kegiatanNama: 'Sholat Dhuha & Dzikir Pagi',
    kategori: 'IBADAH',
    poin: 10,
    fotoUrl: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=600&auto=format&fit=crop&q=80',
    lat: -6.3015,
    long: 106.8186,
    lokasiName: 'Musholla Al-Amin, Pasar Minggu',
    catatanSantri: 'Sholat dhuha 4 rakaat sebelum mulai belajar materi pondok.',
    status: 'PENDING',
    statusWaktu: 'TEPAT_WAKTU',
    waktuLaporWIB: '09:15 WIB',
    createdAt: '2026-08-16 09:15 WIB',
    likesCount: 5,
    isLikedByUser: false,
    comments: []
  }
];

export const MOCK_STATISTIK_MINGGUAN = [
  { hari: 'Senin', target: 5, selesai: 5, poin: 65 },
  { hari: 'Selasa', target: 5, selesai: 4, poin: 50 },
  { hari: 'Rabu', target: 5, selesai: 5, poin: 70 },
  { hari: 'Kamis', target: 5, selesai: 5, poin: 60 },
  { hari: 'Jumat', target: 5, selesai: 5, poin: 75 },
  { hari: 'Sabtu', target: 5, selesai: 4, poin: 45 },
  { hari: 'Ahad (Hari ini)', target: 5, selesai: 4, poin: 55 },
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
    nama: 'Liburan Semester Genap 1447 H / 2026 M',
    rentangTanggal: '01 Agustus - 25 Agustus 2026',
    targetPoin: 400,
    deskripsiReward: '🏆 Sertifikat Teladan Santri Berprestasi + Voucher Beasiswa Kitab & Thawb Eksklusif dari Yayasan Al-Hikmah.',
    isActive: true,
  },
  {
    id: 'per-2',
    nama: 'Liburan Ramadhan & Idul Fitri 1447 H',
    rentangTanggal: '15 Maret - 08 April 2026',
    targetPoin: 550,
    deskripsiReward: '🎁 Bingkisan Idul Fitri Eksklusif + Uang Saku Pembinaan Santri Teladan.',
    isActive: false,
  },
  {
    id: 'per-3',
    nama: 'Liburan Maulid Nabi & Ziarah Santri 1448 H',
    rentangTanggal: '10 September - 20 September 2026',
    targetPoin: 250,
    deskripsiReward: '📚 Kitab Kuning Fathul Qorib & Sertifikat Penghargaan Yayasan.',
    isActive: false,
  },
];

export const MOCK_REWARD_PERIODE = MOCK_PERIODE_LIST[0];
