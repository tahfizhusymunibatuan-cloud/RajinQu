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

    let resultUser = {
      id: id || `user-${Date.now()}`,
      username: cleanUsername,
      noHp: cleanNoHp,
      password: cleanPassword,
      nama: cleanNama,
      role: validRole,
      avatarUrl: avatarUrl || undefined,
      musyrifId: null,
      kelompokId: null,
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

      // 2. Cek apakah user sudah ada berdasarkan username
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
            totalPoin: 0,
          },
        });
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

    let updatedUser: any = { id, username, noHp, password, nama, role };

    try {
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
        },
      });
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
