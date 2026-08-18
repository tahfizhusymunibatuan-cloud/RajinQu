import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyMusyrifNewReport } from '@/lib/whatsapp';
import { StatusLaporan } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Ambil seluruh laporan dari PostgreSQL Neon
export async function GET() {
  try {
    const laporans = await (prisma as any).laporan.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        likes: true,
        komentars: {
          include: { user: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const allUsers: any[] = await (prisma as any).user.findMany().catch(() => []);
    const allKegiatan: any[] = await (prisma as any).kegiatan.findMany().catch(() => []);
    const allKelompok: any[] = await ((prisma as any).kelompok ? (prisma as any).kelompok.findMany().catch(() => []) : []);

    const formatted = laporans.map((lap: any) => {
      const santri = allUsers.find((u) => u.id === lap.userId);
      const kegiatan = allKegiatan.find((k) => k.id === lap.kegiatanId);
      const kelompok = allKelompok.find((k) => k.id === santri?.kelompokId);

      const comments = (lap.komentars || []).map((c: any) => ({
        id: c.id,
        nama: c.user?.nama || 'Pengguna',
        avatar: c.user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: c.user?.role || 'SANTRI',
        isi: c.isi,
        waktu: new Date(c.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      }));

      const likedUserIds = (lap.likes || []).map((l: any) => l.userId);

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
        likesCount: lap.likes ? lap.likes.length : 0,
        isLikedByUser: false,
        likedUserIds,
        comments,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error fetching laporans from DB:', error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

// POST: Buat laporan baru di PostgreSQL Neon
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, userId, kegiatanId, poin, fotoUrl, lat, long, lokasiName, catatanSantri, statusWaktu, waktuLaporWIB } = body;

    const newLaporan = await (prisma as any).laporan.create({
      data: {
        ...(id ? { id } : {}),
        userId: userId,
        kegiatanId: kegiatanId,
        poin: poin !== undefined ? Number(poin) : 10,
        fotoUrl: fotoUrl || '',
        lat: lat || 0,
        long: long || 0,
        alamatLokasi: lokasiName || 'Lokasi Terverifikasi GPS',
        catatanSantri: catatanSantri || null,
        status: StatusLaporan.PENDING,
        statusWaktu: statusWaktu || 'TEPAT_WAKTU',
        waktuLaporWIB: waktuLaporWIB || new Date().toLocaleTimeString('id-ID'),
      },
    });

    return NextResponse.json({ success: true, data: newLaporan });
  } catch (error: any) {
    console.error('Error creating laporan in DB:', error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

// PUT: Validasi (APPROVE / REJECT) laporan di PostgreSQL Neon
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, catatanReview, reviewerId, customPoin } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Laporan ID and Status are required' }, { status: 400 });
    }

    const laporanCurrent = await (prisma as any).laporan.findUnique({
      where: { id },
    });

    if (!laporanCurrent) {
      return NextResponse.json({ success: false, error: 'Laporan not found' }, { status: 404 });
    }

    const finalPoin = customPoin !== undefined ? Number(customPoin) : (laporanCurrent.poin || 10);

    const updated = await (prisma as any).laporan.update({
      where: { id },
      data: {
        status: status as StatusLaporan,
        catatanPengurus: catatanReview || null,
        reviewerId: reviewerId || null,
        poin: finalPoin,
      },
    });

    if (status === 'APPROVED' && laporanCurrent.status !== 'APPROVED') {
      await (prisma as any).user.update({
        where: { id: laporanCurrent.userId },
        data: {
          totalPoin: {
            increment: finalPoin,
          },
        },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating laporan in DB:', error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
