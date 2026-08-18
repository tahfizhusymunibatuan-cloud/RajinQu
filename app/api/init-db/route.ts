import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { KategoriKegiatan } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    // 4. Periode Liburan Aktif Resmi (0 Kegiatan Dummy)
    const defaultKegiatan: any[] = [];

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

export async function GET(request: Request) {
  return POST(request);
}
