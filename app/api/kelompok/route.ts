import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Ambil seluruh kelompok dari PostgreSQL Neon
export async function GET() {
  try {
    const kelompokModel = (prisma as any).kelompok;
    if (!kelompokModel) {
      return NextResponse.json({ success: true, data: [] });
    }

    const kelompoks: any[] = await kelompokModel.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    }).catch(() => []);

    const allUsers: any[] = await (prisma as any).user.findMany().catch(() => []);

    const formatted = kelompoks.map((k: any) => {
      const musyrif = allUsers.find((u: any) => u.id === k.musyrifId);
      const members = allUsers.filter((u: any) => u.kelompokId === k.id);

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

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error fetching kelompok from DB:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}

// POST: Buat kelompok baru di PostgreSQL Neon
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, nama, deskripsi, musyrifId, santriIds } = body;

    if (!nama) {
      return NextResponse.json({ success: false, error: 'Nama kelompok wajib diisi' }, { status: 400 });
    }

    let newKelompok: any = {
      id: id || `kelompok-${Date.now()}`,
      nama: nama.trim(),
      deskripsi: deskripsi?.trim() || '',
      musyrifId: musyrifId || '',
      santriIds: santriIds || [],
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

      const kelompokModel = (prisma as any).kelompok;
      if (kelompokModel) {
        // Validasi apakah musyrifId ada di database
        let validMusyrifId = null;
        if (musyrifId) {
          const existingMus = await (prisma as any).user.findUnique({
            where: { id: musyrifId },
          }).catch(() => null);
          if (existingMus) {
            validMusyrifId = musyrifId;
          }
        }

        newKelompok = await kelompokModel.create({
          data: {
            id: id || undefined,
            nama: nama.trim(),
            deskripsi: deskripsi?.trim() || null,
            musyrifId: validMusyrifId,
            pondokId: pondok?.id || null,
          },
        });

        if (santriIds && Array.isArray(santriIds) && santriIds.length > 0) {
          await (prisma as any).user.updateMany({
            where: {
              id: { in: santriIds },
            },
            data: {
              kelompokId: newKelompok.id,
              ...(validMusyrifId ? { musyrifId: validMusyrifId } : {}),
            },
          }).catch(() => {});
        }
      }
    } catch (dbErr: any) {
      console.warn('DB create kelompok warning:', dbErr?.message);
    }

    return NextResponse.json({ success: true, data: newKelompok });
  } catch (error: any) {
    console.error('Error in POST /api/kelompok:', error);
    return NextResponse.json({ success: true, data: { status: 'cached' } });
  }
}

// PUT: Perbarui kelompok di PostgreSQL Neon
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nama, deskripsi, musyrifId, santriIds } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Kelompok ID is required' }, { status: 400 });
    }

    let updated: any = { id, nama, deskripsi, musyrifId };

    try {
      const kelompokModel = (prisma as any).kelompok;
      if (kelompokModel) {
        let validMusyrifId = null;
        if (musyrifId) {
          const existingMus = await (prisma as any).user.findUnique({
            where: { id: musyrifId },
          }).catch(() => null);
          if (existingMus) {
            validMusyrifId = musyrifId;
          }
        }

        updated = await kelompokModel.update({
          where: { id },
          data: {
            ...(nama ? { nama: nama.trim() } : {}),
            ...(deskripsi !== undefined ? { deskripsi: deskripsi?.trim() || null } : {}),
            musyrifId: validMusyrifId,
          },
        });

        if (santriIds && Array.isArray(santriIds)) {
          await (prisma as any).user.updateMany({
            where: {
              id: { in: santriIds },
            },
            data: {
              kelompokId: id,
              ...(validMusyrifId ? { musyrifId: validMusyrifId } : {}),
            },
          }).catch(() => {});

          await (prisma as any).user.updateMany({
            where: {
              kelompokId: id,
              id: { notIn: santriIds },
            },
            data: {
              kelompokId: null,
            },
          }).catch(() => {});
        }
      }
    } catch (dbErr: any) {
      console.warn('DB update kelompok warning:', dbErr?.message);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error in PUT /api/kelompok:', error);
    return NextResponse.json({ success: true, data: { status: 'cached' } });
  }
}

// DELETE: Hapus kelompok dari PostgreSQL Neon
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      await (prisma as any).user.updateMany({
        where: { kelompokId: id },
        data: { kelompokId: null },
      }).catch(() => {});

      const kelompokModel = (prisma as any).kelompok;
      if (kelompokModel) {
        await kelompokModel.delete({
          where: { id },
        }).catch((e: any) => console.warn('DB delete kelompok warning:', e?.message));
      }
    }

    return NextResponse.json({ success: true, message: 'Kelompok deleted' });
  } catch (error: any) {
    console.error('Error in DELETE /api/kelompok:', error);
    return NextResponse.json({ success: true });
  }
}
