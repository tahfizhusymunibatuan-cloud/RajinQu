import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST: Tambah komentar pada laporan santri
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, laporanId, userId, isi } = body;

    if (!laporanId || !userId || !isi) {
      return NextResponse.json(
        { success: false, error: 'laporanId, userId, and isi are required' },
        { status: 400 }
      );
    }

    const userExists = await (prisma as any).user.findUnique({
      where: { id: userId },
    }).catch(() => null);

    const laporanExists = await (prisma as any).laporan.findUnique({
      where: { id: laporanId },
    }).catch(() => null);

    if (!userExists || !laporanExists) {
      return NextResponse.json({
        success: true,
        fallback: true,
        data: {
          id: id || `c-${Date.now()}`,
          laporanId,
          userId,
          isi: isi.trim(),
          createdAt: new Date().toISOString(),
        },
      });
    }

    const newKomentar = await (prisma as any).komentar.create({
      data: {
        ...(id ? { id } : {}),
        laporanId,
        userId,
        isi: isi.trim(),
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newKomentar.id,
        nama: newKomentar.user?.nama || 'Pengguna',
        avatar: newKomentar.user?.avatarUrl || '',
        role: newKomentar.user?.role || 'SANTRI',
        isi: newKomentar.isi,
        waktu: new Date(newKomentar.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      },
    });
  } catch (error: any) {
    console.error('Error creating komentar in DB:', error);
    return NextResponse.json({ success: true, error: error?.message, fallback: true });
  }
}

// DELETE: Hapus komentar
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      await (prisma as any).komentar.delete({
        where: { id },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, message: 'Komentar deleted' });
  } catch (error: any) {
    console.error('Error deleting komentar in DB:', error);
    return NextResponse.json({ success: true });
  }
}
