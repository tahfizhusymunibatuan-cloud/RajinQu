import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Ambil seluruh periode liburan dari PostgreSQL Neon
export async function GET() {
  try {
    const periodes = await prisma.periodeLiburan.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });

    const formatted = periodes.map((p) => ({
      id: p.id,
      nama: p.nama,
      rentangTanggal: `${p.tanggalMulai.toISOString().split('T')[0]} - ${p.tanggalSelesai.toISOString().split('T')[0]}`,
      targetPoin: p.targetPoinReward,
      deskripsiReward: p.deskripsiReward || '',
      isActive: p.isActive,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error fetching periode from DB:', error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

// POST: Buat periode liburan baru di PostgreSQL Neon
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, nama, rentangTanggal, targetPoin, deskripsiReward, isActive } = body;

    let pondok = await prisma.pondok.findFirst();
    if (!pondok) {
      pondok = await prisma.pondok.create({
        data: {
          nama: 'PP. Tahfizh Qur\'an Al-Usymuni Batuan',
          kodePondok: 'PTQA-BATUAN-01',
        },
      });
    }

    const newPeriode = await prisma.periodeLiburan.create({
      data: {
        ...(id ? { id } : {}),
        nama: nama.trim(),
        tanggalMulai: new Date('2026-08-01'),
        tanggalSelesai: new Date('2026-08-31'),
        targetPoinReward: targetPoin ? Number(targetPoin) : 400,
        deskripsiReward: deskripsiReward || null,
        isActive: isActive !== undefined ? Boolean(isActive) : false,
        pondokId: pondok.id,
      },
    });

    return NextResponse.json({ success: true, data: newPeriode });
  } catch (error: any) {
    console.error('Error creating periode in DB:', error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

// PUT: Perbarui periode liburan di PostgreSQL Neon
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nama, targetPoin, deskripsiReward, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Periode ID is required' }, { status: 400 });
    }

    if (isActive) {
      // Jika diaktifkan, nonaktifkan periode lain
      await prisma.periodeLiburan.updateMany({
        data: { isActive: false },
      });
    }

    const updated = await prisma.periodeLiburan.update({
      where: { id },
      data: {
        ...(nama ? { nama: nama.trim() } : {}),
        ...(targetPoin !== undefined ? { targetPoinReward: Number(targetPoin) } : {}),
        ...(deskripsiReward !== undefined ? { deskripsiReward } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating periode in DB:', error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

// DELETE: Hapus periode dari PostgreSQL Neon
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Periode ID is required' }, { status: 400 });
    }

    await prisma.periodeLiburan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Periode deleted from DB' });
  } catch (error: any) {
    console.error('Error deleting periode from DB:', error);
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
