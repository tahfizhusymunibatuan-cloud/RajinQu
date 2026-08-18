import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { KategoriKegiatan } from '@prisma/client';

export async function POST(request: Request) {
  try {
    // 1. Bersihkan seluruh data dummy / demo
    await (prisma as any).komentar?.deleteMany?.();
    await (prisma as any).like?.deleteMany?.();
    await (prisma as any).poin?.deleteMany?.();
    await (prisma as any).laporan?.deleteMany?.();
    await (prisma as any).kelompok?.deleteMany?.();
    await (prisma as any).kegiatan?.deleteMany?.();
    await (prisma as any).periodeLiburan?.deleteMany?.();
    await (prisma as any).user?.deleteMany?.();
    await (prisma as any).pondok?.deleteMany?.();

    // 2. Buat Profil Pondok Pesantren
    const pondok = await prisma.pondok.create({
      data: {
        nama: 'PTQA Batuan',
        kodePondok: 'PTQA-BATUAN-01',
        alamat: 'Batuan, Sumenep, Madura',
        telepon: '081234567890',
      },
    });

    // 3. Buat Akun Super Admin Utama
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        noHp: '081234567890',
        password: '123',
        nama: 'Super Admin Yayasan',
        role: 'SUPER_ADMIN',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        pondokId: pondok.id,
      },
    });

    // 4. Buat Master Kegiatan Harian Liburan Standar
    const defaultKegiatan = [
      {
        nama: 'Sholat Subuh Berjamaah di Masjid',
        deskripsi: 'Wajib sholat Subuh berjamaah di masjid terdekat / musholla bersama keluarga.',
        kategori: KategoriKegiatan.IBADAH,
        poin: 15,
        icon: 'Sunrise',
        isWajib: true,
        isTimeRestricted: true,
        jamMulai: '04:15',
        jamSelesai: '05:45',
        targetWaktu: '04:15 - 05:45 WIB',
        pondokId: pondok.id,
      },
      {
        nama: "Muroja'ah & Ziyadah Al-Qur'an (1 Juz / 5 Lembar)",
        deskripsi: "Menjaga hafalan Al-Qur'an harian minimal 5 lembar atau 1 juz.",
        kategori: KategoriKegiatan.IBADAH,
        poin: 20,
        icon: 'BookOpen',
        isWajib: true,
        isTimeRestricted: false,
        targetWaktu: 'Bebas / Kapan Saja',
        pondokId: pondok.id,
      },
      {
        nama: 'Sholat Dhuha & Dzikir Pagi',
        deskripsi: "Melaksanakan sholat Dhuha minimal 2 rakaat dan membaca Al-Ma'tsurat / dzikir pagi.",
        kategori: KategoriKegiatan.IBADAH,
        poin: 10,
        icon: 'SunMedium',
        isWajib: true,
        isTimeRestricted: true,
        jamMulai: '06:30',
        jamSelesai: '11:00',
        targetWaktu: '06:30 - 11:00 WIB',
        pondokId: pondok.id,
      },
      {
        nama: 'Khidmah: Membantu Orang Tua di Rumah',
        deskripsi: 'Membantu pekerjaan rumah tangga (membersihkan rumah, memasak, atau belanja).',
        kategori: KategoriKegiatan.MANDIRI,
        poin: 15,
        icon: 'HeartHandshake',
        isWajib: true,
        isTimeRestricted: false,
        targetWaktu: 'Bebas / Kapan Saja',
        pondokId: pondok.id,
      },
      {
        nama: 'Sholat Rawatib & Dzikir Ba\'da Sholat',
        deskripsi: 'Menjaga sholat sunnah rawatib qobliyah & ba\'diyah serta dzikir harian.',
        kategori: KategoriKegiatan.IBADAH,
        poin: 10,
        icon: 'Sparkles',
        isWajib: false,
        isTimeRestricted: false,
        targetWaktu: 'Bebas / Kapan Saja',
        pondokId: pondok.id,
      },
      {
        nama: 'Membaca Kitab / Buku Bermanfaat (30 Menit)',
        deskripsi: 'Membaca kitab kuning, buku motivasi, sirah nabawiyah, atau pelajaran pondok.',
        kategori: KategoriKegiatan.BELAJAR,
        poin: 10,
        icon: 'GraduationCap',
        isWajib: false,
        isTimeRestricted: false,
        targetWaktu: 'Bebas / Kapan Saja',
        pondokId: pondok.id,
      },
    ];

    for (const keg of defaultKegiatan) {
      await prisma.kegiatan.create({ data: keg });
    }

    // 5. Buat Periode Liburan Aktif
    const periode = await prisma.periodeLiburan.create({
      data: {
        nama: 'Liburan Semester 1447 H / 2026 M',
        tanggalMulai: new Date('2026-08-01'),
        tanggalSelesai: new Date('2026-08-31'),
        targetPoinReward: 400,
        deskripsiReward: '🏆 Sertifikat Teladan Santri Berprestasi + Hadiah Beasiswa & Penghargaan Yayasan PTQA Batuan.',
        pondokId: pondok.id,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Database berhasil direset dan diinisialisasi ke mode produksi bersih.',
      data: {
        pondok: pondok.nama,
        adminUser: admin.username,
        periode: periode.nama,
        kegiatanCount: defaultKegiatan.length,
      },
    });
  } catch (error: any) {
    console.error('Failed to initialize database:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menginisialisasi database: ' + error?.message },
      { status: 500 }
    );
  }
}
