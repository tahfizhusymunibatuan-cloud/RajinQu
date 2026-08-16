import { NextResponse } from 'next/server';
import { notifyMusyrifNewReport } from '@/lib/whatsapp';

export async function GET() {
  return NextResponse.json({
    status: 'success',
    message: 'RajinQu Laporan API endpoint active',
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, userNama, kegiatanNama, fotoUrl, lat, long, catatanSantri } = body;

    // Trigger WhatsApp notification ke Musyrif
    await notifyMusyrifNewReport({
      musyrifPhone: '081288880002',
      musyrifName: 'Ustadz Abdullah Robbani',
      santriName: userNama || 'Santri',
      kegiatanName: kegiatanNama || 'Ibadah Harian',
      waktu: new Date().toLocaleTimeString('id-ID'),
      fotoUrl: fotoUrl,
    });

    return NextResponse.json({
      status: 'success',
      message: 'Laporan berhasil disimpan dan notifikasi WA terkirim ke Musyrif',
      data: {
        userId,
        kegiatanNama,
        lat,
        long,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message || 'Gagal memproses laporan' },
      { status: 500 }
    );
  }
}
