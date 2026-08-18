import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Ambil seluruh data aplikasi secara paralel dalam 1 Round-Trip Super Cepat
export async function GET() {
  try {
    const startTime = Date.now();

    // Jalankan seluruh query database secara paralel (Concurrent Promise.all)
    const [usersResult, kegiatanResult, kelompokResult, periodeResult, laporanResult, pondokResult] = await Promise.all([
      (prisma as any).user.findMany({
        orderBy: { createdAt: 'asc' },
      }).catch((e: any) => {
        console.warn('Sync users fetch warn:', e?.message);
        return [];
      }),

      (prisma as any).kegiatan.findMany({
        orderBy: { createdAt: 'asc' },
      }).catch((e: any) => {
        console.warn('Sync kegiatan fetch warn:', e?.message);
        return [];
      }),

      ((prisma as any).kelompok
        ? (prisma as any).kelompok.findMany({ orderBy: { createdAt: 'asc' } }).catch(() => [])
        : Promise.resolve([])),

      (prisma as any).periodeLiburan.findMany({
        orderBy: { createdAt: 'asc' },
      }).catch(() => []),

      (prisma as any).laporan.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100, // Ambil 100 laporan terbaru untuk performa puncak
      }).catch(() => []),

      (prisma as any).pondok.findFirst().catch(() => null),
    ]);

    const defaultPondokNama = pondokResult?.nama || 'PP. Tahfizh Qur\'an Al-Usymuni Batuan';

    // 1. Format Users
    const formattedUsers = usersResult.map((u: any) => {
      const kel = kelompokResult.find((k: any) => k.id === u.kelompokId);
      const mus = usersResult.find((m: any) => m.id === u.musyrifId);

      return {
        id: u.id,
        username: u.username,
        noHp: u.noHp,
        password: u.password,
        nama: u.nama,
        role: u.role,
        avatarUrl: u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        pondokNama: defaultPondokNama,
        musyrifId: u.musyrifId || undefined,
        musyrifNama: mus?.nama || undefined,
        kelompokId: u.kelompokId || undefined,
        kelompokNama: kel?.nama || undefined,
        totalPoin: u.totalPoin || 0,
      };
    });

    // 2. Format Kegiatan
    const formattedKegiatan = kegiatanResult.map((k: any) => ({
      id: k.id,
      nama: k.nama,
      deskripsi: k.deskripsi || '',
      kategori: k.kategori || 'IBADAH',
      poin: k.poin || 10,
      icon: k.icon || 'Sparkles',
      isWajib: k.isWajib !== undefined ? k.isWajib : true,
      isTimeRestricted: k.isTimeRestricted !== undefined ? k.isTimeRestricted : false,
      jamMulai: k.jamMulai || undefined,
      jamSelesai: k.jamSelesai || undefined,
      targetWaktu: k.targetWaktu || 'Bebas / Kapan Saja',
    }));

    // 3. Format Kelompok
    const formattedKelompok = kelompokResult.map((k: any) => {
      const musyrif = usersResult.find((u: any) => u.id === k.musyrifId);
      const members = usersResult.filter((u: any) => u.kelompokId === k.id);

      return {
        id: k.id,
        nama: k.nama,
        deskripsi: k.deskripsi || '',
        musyrifId: k.musyrifId || '',
        musyrifNama: musyrif?.nama || 'Belum Ditentukan',
        santriIds: members.map((a: any) => a.id),
        createdAt: k.createdAt ? new Date(k.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      };
    });

    // 4. Format Periode
    const formattedPeriode = periodeResult.map((p: any) => ({
      id: p.id,
      nama: p.nama,
      rentangTanggal: `${new Date(p.tanggalMulai).toISOString().split('T')[0]} - ${new Date(p.tanggalSelesai).toISOString().split('T')[0]}`,
      targetPoin: p.targetPoinReward,
      deskripsiReward: p.deskripsiReward || '',
      isActive: p.isActive,
    }));

    // 5. Format Laporan
    const formattedLaporan = laporanResult.map((lap: any) => {
      const santri = usersResult.find((u: any) => u.id === lap.userId);
      const kegiatan = kegiatanResult.find((k: any) => k.id === lap.kegiatanId);
      const kelompok = kelompokResult.find((k: any) => k.id === santri?.kelompokId);

      return {
        id: lap.id,
        userId: lap.userId,
        userNama: santri?.nama || 'Santri',
        userAvatar: santri?.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
        userAsrama: kelompok?.nama || '',
        kegiatanId: lap.kegiatanId,
        kegiatanNama: kegiatan?.nama || 'Kegiatan Ibadah',
        kategori: (kegiatan?.kategori as any) || 'IBADAH',
        poin: lap.poin || 10,
        fotoUrl: lap.fotoUrl,
        lat: lap.lat || 0,
        long: lap.long || 0,
        lokasiName: lap.alamatLokasi || 'Lokasi Terverifikasi GPS',
        catatanSantri: lap.catatanSantri || '',
        status: lap.status as any,
        statusWaktu: (lap.statusWaktu as any) || 'TEPAT_WAKTU',
        waktuLaporWIB: lap.waktuLaporWIB || new Date(lap.createdAt).toLocaleTimeString('id-ID'),
        catatanPengurus: lap.catatanPengurus || undefined,
        createdAt: lap.createdAt ? new Date(lap.createdAt).toISOString() : new Date().toISOString(),
        likesCount: 0,
        isLikedByUser: false,
        comments: [],
      };
    });

    const duration = Date.now() - startTime;

    return new NextResponse(
      JSON.stringify({
        success: true,
        durationMs: duration,
        data: {
          users: formattedUsers,
          kegiatan: formattedKegiatan,
          kelompok: formattedKelompok,
          periode: formattedPeriode,
          laporan: formattedLaporan,
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=15',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in /api/sync:', error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
