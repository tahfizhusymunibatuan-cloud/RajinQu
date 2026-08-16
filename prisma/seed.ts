import { PrismaClient, Role, KategoriKegiatan, StatusLaporan } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding database RajinQu...');

  // 1. Bersihkan database terlebih dahulu (opsional)
  await prisma.komentar.deleteMany();
  await prisma.like.deleteMany();
  await prisma.poin.deleteMany();
  await prisma.laporan.deleteMany();
  await prisma.kegiatan.deleteMany();
  await prisma.periodeLiburan.deleteMany();
  await prisma.user.deleteMany();
  await prisma.pondok.deleteMany();

  // 2. Buat Pondok Pesantren
  const pondok = await prisma.pondok.create({
    data: {
      nama: 'Pondok Pesantren Al-Hikmah Modern',
      kodePondok: 'ALHIKMAH-01',
      alamat: 'Jl. Pesantren No. 99, Jakarta Timur',
      telepon: '02188990011',
    },
  });
  console.log('✅ Pondok dibuat:', pondok.nama);

  // 3. Buat Periode Liburan
  const periode = await prisma.periodeLiburan.create({
    data: {
      nama: 'Liburan Semester Genap 1447 H / 2026 M',
      tanggalMulai: new Date('2026-08-01'),
      tanggalSelesai: new Date('2026-08-25'),
      targetPoinReward: 400,
      deskripsiReward: '🏆 Sertifikat Teladan Santri Berprestasi + Hadiah Beasiswa Kitab & Thawb Eksklusif',
      pondokId: pondok.id,
      isActive: true,
    },
  });

  // 4. Buat Master Kegiatan Harian
  const kegiatanList = [
    {
      nama: 'Sholat Subuh Berjamaah di Masjid',
      deskripsi: 'Wajib sholat Subuh berjamaah di masjid terdekat / musholla bersama keluarga.',
      kategori: KategoriKegiatan.IBADAH,
      poinDefault: 15,
      icon: 'Sunrise',
      isWajib: true,
      pondokId: pondok.id,
    },
    {
      nama: "Muroja'ah & Ziyadah Al-Qur'an (1 Juz / 5 Lembar)",
      deskripsi: "Menjaga hafalan Al-Qur'an harian minimal 5 lembar atau 1 juz.",
      kategori: KategoriKegiatan.IBADAH,
      poinDefault: 20,
      icon: 'BookOpen',
      isWajib: true,
      pondokId: pondok.id,
    },
    {
      nama: 'Sholat Dhuha & Dzikir Pagi',
      deskripsi: "Melaksanakan sholat Dhuha minimal 2 rakaat dan membaca Al-Ma'tsurat.",
      kategori: KategoriKegiatan.IBADAH,
      poinDefault: 10,
      icon: 'SunMedium',
      isWajib: true,
      pondokId: pondok.id,
    },
    {
      nama: 'Khidmah: Membantu Orang Tua di Rumah',
      deskripsi: 'Membantu pekerjaan rumah tangga (membersihkan rumah, memasak, atau belanja).',
      kategori: KategoriKegiatan.MANDIRI,
      poinDefault: 15,
      icon: 'HeartHandshake',
      isWajib: true,
      pondokId: pondok.id,
    },
    {
      nama: 'Membaca Kitab / Buku Bermanfaat (30 Menit)',
      deskripsi: 'Membaca kitab kuning, buku motivasi, sejarah Islam, atau literatur pelajaran.',
      kategori: KategoriKegiatan.BELAJAR,
      poinDefault: 10,
      icon: 'GraduationCap',
      isWajib: false,
      pondokId: pondok.id,
    },
    {
      nama: 'Olahraga Pagi / Senam Sehat (15 Menit)',
      deskripsi: 'Menjaga kebugaran jasmani santri dengan jogging, skipping, atau push-up.',
      kategori: KategoriKegiatan.MANDIRI,
      poinDefault: 10,
      icon: 'Activity',
      isWajib: false,
      pondokId: pondok.id,
    },
  ];

  for (const keg of kegiatanList) {
    await prisma.kegiatan.create({ data: keg });
  }
  console.log(`✅ ${kegiatanList.length} Kegiatan berhasil di-seed`);

  // 5. Buat Akun Super Admin
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      noHp: '081299990001',
      password: 'admin',
      nama: 'Ustadz H. Ahmad Fauzi, Lc.',
      role: Role.SUPER_ADMIN,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      pondokId: pondok.id,
    },
  });

  // 6. Buat Akun Musyrif / Pengurus
  const musyrif = await prisma.user.create({
    data: {
      username: 'musyrif.abdullah',
      noHp: '081288880002',
      password: '123',
      nama: 'Ustadz Abdullah Robbani',
      role: Role.MUSYRIF,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      pondokId: pondok.id,
    },
  });
  console.log('✅ Super Admin & Musyrif dibuat');

  // 7. Buat Akun Santri
  const santri1 = await prisma.user.create({
    data: {
      username: '2026001',
      noHp: '081377770003',
      password: '123',
      nama: 'Muhammad Faiz Ar-Rasyid',
      role: Role.SANTRI,
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      totalPoin: 245,
      pondokId: pondok.id,
      musyrifId: musyrif.id,
    },
  });

  const santri2 = await prisma.user.create({
    data: {
      username: '2026002',
      noHp: '081377770004',
      password: '123',
      nama: 'Ahmad Zaidan Al-Farisi',
      role: Role.SANTRI,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      totalPoin: 220,
      pondokId: pondok.id,
      musyrifId: musyrif.id,
    },
  });

  const santri3 = await prisma.user.create({
    data: {
      username: '2026003',
      noHp: '081377770005',
      password: '123',
      nama: 'Aisyah Nuha Zahirah',
      role: Role.SANTRI,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      totalPoin: 205,
      pondokId: pondok.id,
      musyrifId: musyrif.id,
    },
  });
  console.log('✅ 3 Akun Santri dibuat');

  console.log('🎉 Seeding database selesai!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
