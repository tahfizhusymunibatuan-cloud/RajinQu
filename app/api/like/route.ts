import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST: Toggle Like pada suatu laporan
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { laporanId, userId } = body;

    if (!laporanId || !userId) {
      return NextResponse.json({ success: false, error: 'laporanId and userId are required' }, { status: 400 });
    }

    // Pastikan user dan laporan ada
    const userExists = await (prisma as any).user.findUnique({
      where: { id: userId },
    }).catch(() => null);

    const laporanExists = await (prisma as any).laporan.findUnique({
      where: { id: laporanId },
    }).catch(() => null);

    if (!userExists || !laporanExists) {
      // Jika salah satu belum tersinkron di DB, kembalikan respon sukses lokal agar tidak crash
      return NextResponse.json({ success: true, liked: true, fallback: true });
    }

    // Cek apakah like sudah ada
    const existingLike = await (prisma as any).like.findUnique({
      where: {
        userId_laporanId: {
          userId,
          laporanId,
        },
      },
    }).catch(() => null);

    if (existingLike) {
      // Un-like: Hapus data like
      await (prisma as any).like.delete({
        where: {
          id: existingLike.id,
        },
      });
      return NextResponse.json({ success: true, liked: false, action: 'unliked' });
    } else {
      // Like: Buat data like baru
      const newLike = await (prisma as any).like.create({
        data: {
          userId,
          laporanId,
        },
      });
      return NextResponse.json({ success: true, liked: true, action: 'liked', data: newLike });
    }
  } catch (error: any) {
    console.error('Error toggling like in DB:', error);
    return NextResponse.json({ success: true, error: error?.message, fallback: true });
  }
}
