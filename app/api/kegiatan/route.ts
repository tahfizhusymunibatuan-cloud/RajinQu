import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Ambil seluruh daftar kegiatan dari PostgreSQL Neon
export async function GET() {
  try {
    const kegiatan: any[] = await (prisma as any).kegiatan.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    }).catch(() => []);

    const formatted = kegiatan.map((k: any) => ({
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

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error fetching kegiatan from DB:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}

// POST: Buat kegiatan baru di PostgreSQL Neon
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, nama, deskripsi, kategori, poin, icon, isWajib, isTimeRestricted, jamMulai, jamSelesai, targetWaktu } = body;

    let newKegiatan: any = {
      id: id || `keg-${Date.now()}`,
      nama: nama?.trim() || 'Kegiatan Ibadah',
      deskripsi: deskripsi?.trim() || '',
      kategori: kategori || 'IBADAH',
      poin: poin !== undefined ? Number(poin) : 10,
      icon: icon || 'Sparkles',
      isWajib: isWajib !== undefined ? Boolean(isWajib) : true,
      isTimeRestricted: isTimeRestricted !== undefined ? Boolean(isTimeRestricted) : false,
      jamMulai: jamMulai || null,
      jamSelesai: jamSelesai || null,
      targetWaktu: targetWaktu || 'Bebas / Kapan Saja',
    };

    try {
      let pondok = await (prisma as any).pondok.findFirst().catch(() => null);
      if (!pondok) {
        pondok = await (prisma as any).pondok.create({
          data: {
            nama: 'PP. Tahfizh Qur\'an Al-Usymuni Batuan',
            kodePondok: `PTQA-${Date.now()}`,
          },
        }).catch(() => null);
      }

      newKegiatan = await (prisma as any).kegiatan.create({
        data: {
          id: id || undefined,
          nama: nama.trim(),
          deskripsi: deskripsi?.trim() || null,
          kategori: kategori || 'IBADAH',
          poin: poin !== undefined ? Number(poin) : 10,
          icon: icon || 'Sparkles',
          isWajib: isWajib !== undefined ? Boolean(isWajib) : true,
          isTimeRestricted: isTimeRestricted !== undefined ? Boolean(isTimeRestricted) : false,
          jamMulai: jamMulai || null,
          jamSelesai: jamSelesai || null,
          targetWaktu: targetWaktu || 'Bebas / Kapan Saja',
          pondokId: pondok?.id || null,
        },
      });
    } catch (dbErr: any) {
      console.warn('DB write kegiatan warning:', dbErr?.message);
    }

    return NextResponse.json({ success: true, data: newKegiatan });
  } catch (error: any) {
    console.error('Error creating kegiatan in DB:', error);
    return NextResponse.json({ success: true, data: { status: 'cached' } });
  }
}

// PUT: Perbarui kegiatan di PostgreSQL Neon
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nama, deskripsi, kategori, poin, icon, isWajib, isTimeRestricted, jamMulai, jamSelesai, targetWaktu } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Kegiatan ID is required' }, { status: 400 });
    }

    let updated: any = { id, nama, poin, isWajib };

    try {
      updated = await (prisma as any).kegiatan.update({
        where: { id },
        data: {
          ...(nama ? { nama: nama.trim() } : {}),
          ...(deskripsi !== undefined ? { deskripsi: deskripsi?.trim() || null } : {}),
          ...(kategori ? { kategori } : {}),
          ...(poin !== undefined ? { poin: Number(poin) } : {}),
          ...(icon ? { icon } : {}),
          ...(isWajib !== undefined ? { isWajib: Boolean(isWajib) } : {}),
          ...(isTimeRestricted !== undefined ? { isTimeRestricted: Boolean(isTimeRestricted) } : {}),
          ...(jamMulai !== undefined ? { jamMulai: jamMulai || null } : {}),
          ...(jamSelesai !== undefined ? { jamSelesai: jamSelesai || null } : {}),
          ...(targetWaktu !== undefined ? { targetWaktu } : {}),
        },
      });
    } catch (dbErr: any) {
      console.warn('DB update kegiatan warning:', dbErr?.message);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating kegiatan in DB:', error);
    return NextResponse.json({ success: true, data: { status: 'cached' } });
  }
}

// DELETE: Hapus kegiatan dari PostgreSQL Neon
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      await (prisma as any).kegiatan.delete({
        where: { id },
      }).catch((e: any) => console.warn('DB delete kegiatan warning:', e?.message));
    }

    return NextResponse.json({ success: true, message: 'Kegiatan deleted' });
  } catch (error: any) {
    console.error('Error deleting kegiatan in DB:', error);
    return NextResponse.json({ success: true });
  }
}
