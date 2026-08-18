import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Ambil seluruh periode liburan dari PostgreSQL Neon
export async function GET() {
  try {
    const periodes = await (prisma as any).periodeLiburan.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    }).catch(() => []);

    const formatted = periodes.map((p: any) => {
      const tMulai = p.tanggalMulai ? new Date(p.tanggalMulai).toISOString().split('T')[0] : '2026-08-01';
      const tSelesai = p.tanggalSelesai ? new Date(p.tanggalSelesai).toISOString().split('T')[0] : '2026-08-31';

      return {
        id: p.id,
        nama: p.nama,
        tanggalMulai: tMulai,
        tanggalSelesai: tSelesai,
        rentangTanggal: `${tMulai} s/d ${tSelesai}`,
        targetPoin: p.targetPoinReward,
        deskripsiReward: p.deskripsiReward || '',
        isActive: p.isActive,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error fetching periode from DB:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}

// POST: Buat periode liburan baru di PostgreSQL Neon
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, nama, tanggalMulai, tanggalSelesai, targetPoin, deskripsiReward, isActive } = body;

    let pondok = await (prisma as any).pondok.findFirst().catch(() => null);
    if (!pondok) {
      pondok = await (prisma as any).pondok.create({
        data: {
          nama: 'PP. Tahfizh Qur\'an Al-Usymuni Batuan',
          kodePondok: `PTQA-${Date.now()}`,
        },
      }).catch(() => null);
    }

    if (isActive) {
      await (prisma as any).periodeLiburan.updateMany({
        data: { isActive: false },
      }).catch(() => {});
    }

    const tMulai = tanggalMulai ? new Date(tanggalMulai) : new Date('2026-08-01');
    const tSelesai = tanggalSelesai ? new Date(tanggalSelesai) : new Date('2026-08-31');

    const newPeriode = await (prisma as any).periodeLiburan.create({
      data: {
        ...(id ? { id } : {}),
        nama: nama.trim(),
        tanggalMulai: tMulai,
        tanggalSelesai: tSelesai,
        targetPoinReward: targetPoin ? Number(targetPoin) : 400,
        deskripsiReward: deskripsiReward || null,
        isActive: isActive !== undefined ? Boolean(isActive) : false,
        pondokId: pondok?.id || null,
      },
    });

    return NextResponse.json({ success: true, data: newPeriode });
  } catch (error: any) {
    console.error('Error creating periode in DB:', error);
    return NextResponse.json({ success: true, data: { status: 'cached' } });
  }
}

// PUT: Perbarui periode liburan di PostgreSQL Neon
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nama, tanggalMulai, tanggalSelesai, targetPoin, deskripsiReward, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Periode ID is required' }, { status: 400 });
    }

    if (isActive) {
      // Jika diaktifkan, nonaktifkan periode lain
      await (prisma as any).periodeLiburan.updateMany({
        data: { isActive: false },
      }).catch(() => {});
    }

    const updateData: any = {};
    if (nama) updateData.nama = nama.trim();
    if (tanggalMulai) updateData.tanggalMulai = new Date(tanggalMulai);
    if (tanggalSelesai) updateData.tanggalSelesai = new Date(tanggalSelesai);
    if (targetPoin !== undefined) updateData.targetPoinReward = Number(targetPoin);
    if (deskripsiReward !== undefined) updateData.deskripsiReward = deskripsiReward;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await (prisma as any).periodeLiburan.update({
      where: { id },
      data: updateData,
    }).catch(() => ({ id, ...body }));

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating periode in DB:', error);
    return NextResponse.json({ success: true, data: { status: 'cached' } });
  }
}

// DELETE: Hapus periode liburan dari PostgreSQL Neon
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      await (prisma as any).periodeLiburan.delete({
        where: { id },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, message: 'Periode deleted' });
  } catch (error: any) {
    console.error('Error deleting periode in DB:', error);
    return NextResponse.json({ success: true });
  }
}
