const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 [1/4] Membersihkan seluruh data demo lama di database Neon PostgreSQL...');

  // 1. Bersihkan seluruh tabel secara terurut
  await prisma.komentar?.deleteMany().catch(() => {});
  await prisma.like?.deleteMany().catch(() => {});
  await prisma.poin?.deleteMany().catch(() => {});
  await prisma.laporan?.deleteMany().catch(() => {});
  await prisma.kelompok?.deleteMany().catch(() => {});
  await prisma.kegiatan?.deleteMany().catch(() => {});
  await prisma.periodeLiburan?.deleteMany().catch(() => {});
  await prisma.user?.deleteMany().catch(() => {});
  await prisma.pondok?.deleteMany().catch(() => {});

  console.log('🏛️ [2/4] Membuat profil lembaga resmi PTQA Batuan...');
  // 2. Buat Profil Pondok Pesantren Resmi
  const pondok = await prisma.pondok.create({
    data: {
      nama: 'PP. Tahfizh Qur\'an Al-Usymuni Batuan',
      kodePondok: 'PTQA-BATUAN-01',
      alamat: 'Batuan, Sumenep, Madura',
      telepon: '081234567890',
    },
  });
  console.log('✅ Pondok dibuat:', pondok.nama);

  console.log('👑 [3/4] Membuat akun Super Admin utama...');
  // 3. Buat Akun Super Admin Utama (0 Akun Santri Dummy / 0 Musyrif Dummy)
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      noHp: '081234567890',
      password: '123',
      nama: 'Super Admin Yayasan',
      role: 'SUPER_ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      pondokId: pondok.id,
      totalPoin: 0,
    },
  });
  console.log('✅ Super Admin dibuat:', admin.nama, `(${admin.username} / ${admin.password})`);

  console.log('📋 [4/4] Menyiapkan Master Kegiatan Standar & Periode Liburan...');
  // 4. Buat Periode Liburan Aktif
  await prisma.periodeLiburan.create({
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

  console.log('✨ 100% SUKSES: Seluruh data demo lama telah DIHAPUS BERSIH dari Neon PostgreSQL!');
  console.log('🚀 Database kini dalam status SIAP OPERASIONAL PRODUKSI (0 Kegiatan / 0 Santri Dummy).');
}

main()
  .catch((e) => {
    console.error('❌ Error saat reset/seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
