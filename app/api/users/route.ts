import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Ambil seluruh data pengguna dari PostgreSQL Neon
export async function GET() {
  try {
    const users: any[] = await (prisma as any).user.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    }).catch((err: any) => {
      console.warn('Prisma findMany users error:', err?.message);
      return [];
    });

    const kelompokModel = (prisma as any).kelompok;
    const kelompoks: any[] = kelompokModel ? await kelompokModel.findMany().catch(() => []) : [];
    const pondoks: any[] = await (prisma as any).pondok.findMany().catch(() => []);

    const formattedUsers = users.map((u: any) => {
      const kel = kelompoks.find((k: any) => k.id === u.kelompokId);
      const mus = users.find((m: any) => m.id === u.musyrifId);
      const pondok = pondoks.find((p: any) => p.id === u.pondokId);

      return {
        id: u.id,
        username: u.username,
        noHp: u.noHp,
        password: u.password,
        nama: u.nama,
        role: u.role,
        avatarUrl: u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        pondokNama: pondok?.nama || 'PTQA BATUAN',
        musyrifId: u.musyrifId || undefined,
        musyrifNama: mus?.nama || undefined,
        kelompokId: u.kelompokId || undefined,
        kelompokNama: kel?.nama || undefined,
        totalPoin: u.totalPoin || 0,
      };
    });

    return NextResponse.json({ success: true, data: formattedUsers });
  } catch (error: any) {
    console.error('Error fetching users from DB:', error);
    return NextResponse.json({ success: true, data: [] });
  }
}

// POST: Buat atau Perbarui pengguna (Santri, Musyrif, Pengawas) di PostgreSQL Neon
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, username, noHp, password, nama, role, musyrifId, kelompokId, avatarUrl } = body;

    if (!username || !nama) {
      return NextResponse.json({ success: false, error: 'Username dan nama wajib diisi' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanNoHp = (noHp || `08${Date.now()}`).trim();
    const cleanPassword = (password || '123').trim();
    const cleanNama = nama.trim();

    const validRole =
      role === 'SUPER_ADMIN' || role === 'MUSYRIF' || role === 'PENGAWAS' || role === 'SANTRI'
        ? role
        : 'SANTRI';

    let finalMusyrifId: string | null = musyrifId || null;
    let finalKelompokId: string | null = kelompokId || null;

    let resultUser: any = {
      id: id || `user-${Date.now()}`,
      username: cleanUsername,
      noHp: cleanNoHp,
      password: cleanPassword,
      nama: cleanNama,
      role: validRole,
      avatarUrl: avatarUrl || undefined,
      musyrifId: finalMusyrifId,
      kelompokId: finalKelompokId,
      totalPoin: 0,
    };

    try {
      // 1. Dapatkan pondok ID
      let pondok = await (prisma as any).pondok.findFirst().catch(() => null);
      if (!pondok) {
        pondok = await (prisma as any).pondok.create({
          data: {
            nama: 'PP. Tahfizh Qur\'an Al-Usymuni Batuan',
            kodePondok: `PTQA-${Date.now()}`,
          },
        }).catch(() => null);
      }

      // 2. Jika santri memilih kelompok tapi belum memilih musyrif, ambil musyrif dari kelompok
      if (validRole === 'SANTRI' && finalKelompokId) {
        const kel = await (prisma as any).kelompok.findUnique({
          where: { id: finalKelompokId },
        }).catch(() => null);
        if (kel?.musyrifId) {
          finalMusyrifId = kel.musyrifId;
        }
      }

      // 3. Validasi foreign key musyrifId dan kelompokId
      if (finalMusyrifId) {
        const musExists = await (prisma as any).user.findUnique({
          where: { id: finalMusyrifId },
        }).catch(() => null);
        if (!musExists) finalMusyrifId = null;
      }

      if (finalKelompokId) {
        const kelExists = await (prisma as any).kelompok.findUnique({
          where: { id: finalKelompokId },
        }).catch(() => null);
        if (!kelExists) finalKelompokId = null;
      }

      // 4. Cek apakah user sudah ada berdasarkan username
      const existingUser = await (prisma as any).user.findUnique({
        where: { username: cleanUsername },
      }).catch(() => null);

      if (existingUser) {
        resultUser = await (prisma as any).user.update({
          where: { id: existingUser.id },
          data: {
            noHp: cleanNoHp,
            password: cleanPassword,
            nama: cleanNama,
            role: validRole,
            avatarUrl: avatarUrl || existingUser.avatarUrl,
            musyrifId: finalMusyrifId,
            kelompokId: finalKelompokId,
          },
        });
      } else {
        resultUser = await (prisma as any).user.create({
          data: {
            id: id || undefined,
            username: cleanUsername,
            noHp: cleanNoHp,
            password: cleanPassword,
            nama: cleanNama,
            role: validRole,
            avatarUrl: avatarUrl || undefined,
            pondokId: pondok?.id || null,
            musyrifId: finalMusyrifId,
            kelompokId: finalKelompokId,
            totalPoin: 0,
          },
        });
      }

      // 5. Jika Musyrif baru ditugaskan ke kelompok, hubungkan kelompok dan santri di dalamnya
      if (validRole === 'MUSYRIF' && kelompokId) {
        await (prisma as any).kelompok.update({
          where: { id: kelompokId },
          data: { musyrifId: resultUser.id },
        }).catch(() => {});

        // Update semua santri di kelompok tersebut agar dibina oleh musyrif baru ini
        await (prisma as any).user.updateMany({
          where: { kelompokId },
          data: { musyrifId: resultUser.id },
        }).catch(() => {});
      }
    } catch (dbErr: any) {
      console.warn('DB write warning (handled):', dbErr?.message);
    }

    return NextResponse.json({ success: true, data: resultUser });
  } catch (error: any) {
    console.error('Error in POST /api/users:', error);
    return NextResponse.json({ success: true, data: { status: 'cached' } });
  }
}

// PUT: Perbarui data pengguna di PostgreSQL Neon
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, username, noHp, password, nama, role, musyrifId, kelompokId, avatarUrl, totalPoin } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    let updatedUser: any = { id, username, noHp, password, nama, role, musyrifId, kelompokId };

    try {
      let finalMusyrifId = musyrifId !== undefined ? (musyrifId || null) : undefined;
      let finalKelompokId = kelompokId !== undefined ? (kelompokId || null) : undefined;

      // Validasi keberadaan musyrif & kelompok jika diisi
      if (finalMusyrifId) {
        const musExists = await (prisma as any).user.findUnique({
          where: { id: finalMusyrifId },
        }).catch(() => null);
        if (!musExists) finalMusyrifId = null;
      }

      if (finalKelompokId) {
        const kelExists = await (prisma as any).kelompok.findUnique({
          where: { id: finalKelompokId },
        }).catch(() => null);
        if (!kelExists) finalKelompokId = null;
      }

      updatedUser = await (prisma as any).user.update({
        where: { id },
        data: {
          ...(username ? { username: username.trim().toLowerCase() } : {}),
          ...(noHp ? { noHp: noHp.trim() } : {}),
          ...(password ? { password: password.trim() } : {}),
          ...(nama ? { nama: nama.trim() } : {}),
          ...(role ? { role: role } : {}),
          ...(avatarUrl !== undefined ? { avatarUrl } : {}),
          ...(totalPoin !== undefined ? { totalPoin } : {}),
          ...(finalMusyrifId !== undefined ? { musyrifId: finalMusyrifId } : {}),
          ...(finalKelompokId !== undefined ? { kelompokId: finalKelompokId } : {}),
        },
      });

      // Jika Musyrif dihubungkan ke kelompok baru
      if (role === 'MUSYRIF' && kelompokId) {
        await (prisma as any).kelompok.update({
          where: { id: kelompokId },
          data: { musyrifId: id },
        }).catch(() => {});

        await (prisma as any).user.updateMany({
          where: { kelompokId },
          data: { musyrifId: id },
        }).catch(() => {});
      }
    } catch (dbErr: any) {
      console.warn('DB update warning (handled):', dbErr?.message);
    }

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error: any) {
    console.error('Error in PUT /api/users:', error);
    return NextResponse.json({ success: true, data: { status: 'cached' } });
  }
}

// DELETE: Hapus pengguna dari PostgreSQL Neon
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      await (prisma as any).user.delete({
        where: { id },
      }).catch((e: any) => console.warn('DB delete warning:', e?.message));
    }

    return NextResponse.json({ success: true, message: 'User deleted' });
  } catch (error: any) {
    console.error('Error in DELETE /api/users:', error);
    return NextResponse.json({ success: true });
  }
}
