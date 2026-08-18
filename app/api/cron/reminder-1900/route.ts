import { NextResponse } from 'next/server';
import { sendDailyReminderToSantri } from '@/lib/whatsapp';
import { MOCK_USERS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

/**
 * Endpoint Cron Job untuk Pengingat Jam 19.00 WIB
 * Bisa di-trigger oleh Vercel Cron (vercel.json) setiap hari pukul 19.00 WIB (12:00 UTC)
 */
export async function GET(request: Request) {
  try {
    const santris = MOCK_USERS.filter((u) => u.role === 'SANTRI');
    const results = [];

    for (const santri of santris) {
      const res = await sendDailyReminderToSantri({
        santriPhone: santri.noHp,
        santriName: santri.nama,
        kegiatanBelumSelesai: [
          'Muroja\'ah Al-Qur\'an (1 Juz)',
          'Sholat Rawatib & Dhuha',
          'Khidmah: Membantu Orang Tua',
        ],
      });
      results.push({ santri: santri.nama, phone: santri.noHp, res });
    }

    return NextResponse.json({
      status: 'success',
      message: 'Cron job reminder 19.00 WIB berhasil dieksekusi',
      totalSantri: santris.length,
      results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
