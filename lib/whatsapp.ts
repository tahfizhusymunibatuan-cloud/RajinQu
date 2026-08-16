/**
 * ====================================================================
 * RAJINQU - WHATSAPP API INTEGRATION HELPER (FONNTE / WABLAS)
 * ====================================================================
 */

interface WhatsAppSendPayload {
  target: string; // Nomor HP tujuan (format: 08123456789 atau 628123456789)
  message: string;
  url?: string;
  filename?: string;
}

interface WhatsAppResponse {
  status: boolean;
  message: string;
  data?: any;
}

/**
 * Format nomor HP Indonesia ke format internasional (628xxx)
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('+62')) {
    cleaned = cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Kirim pesan WhatsApp melalui Gateway Fonnte
 */
export async function sendWhatsAppMessage({
  target,
  message,
  url,
  filename,
}: WhatsAppSendPayload): Promise<WhatsAppResponse> {
  const token = process.env.FONNTE_API_TOKEN;
  const formattedPhone = formatPhoneNumber(target);

  // Jika token belum diset, return simulated response & log ke console
  if (!token || token === 'YOUR_FONNTE_API_TOKEN_HERE') {
    console.log('📱 [SIMULASI WA GATEWAY - FONNTE]');
    console.log(`➡️ Tujuan: ${formattedPhone}`);
    console.log(`💬 Pesan:\n${message}`);
    if (url) console.log(`📎 Attachment: ${url}`);
    
    return {
      status: true,
      message: '[Simulasi] Pesan WhatsApp berhasil disimulasikan (Set FONNTE_API_TOKEN di .env untuk pengiriman asli).',
      data: { target: formattedPhone, message }
    };
  }

  try {
    const formData = new FormData();
    formData.append('target', formattedPhone);
    formData.append('message', message);
    formData.append('countryCode', '62');

    if (url) {
      formData.append('url', url);
      if (filename) formData.append('filename', filename);
    }

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: token,
      },
      body: formData,
    });

    const result = await response.json();
    return {
      status: result.status === true || result.status === 'true',
      message: result.reason || (result.status ? 'Pesan terkirim' : 'Gagal kirim pesan'),
      data: result,
    };
  } catch (error: any) {
    console.error('❌ Error sending WhatsApp message via Fonnte:', error);
    return {
      status: false,
      message: error.message || 'Terjadi kesalahan pada gateway WhatsApp',
    };
  }
}

/**
 * Template 1: Notifikasi Laporan Masuk untuk Musyrif
 */
export async function notifyMusyrifNewReport({
  musyrifPhone,
  musyrifName,
  santriName,
  kegiatanName,
  waktu,
  fotoUrl,
}: {
  musyrifPhone: string;
  musyrifName: string;
  santriName: string;
  kegiatanName: string;
  waktu: string;
  fotoUrl?: string;
}) {
  const message = `🔔 *Laporan Kegiatan Baru - RajinQu*\n\n` +
    `Assalamu'alaikum Ustadz/Ustadzah *${musyrifName}*,\n` +
    `Santri binaan Anda baru saja mengirimkan laporan kegiatan liburan:\n\n` +
    `👤 *Nama Santri:* ${santriName}\n` +
    `📖 *Kegiatan:* ${kegiatanName}\n` +
    `⏰ *Waktu:* ${waktu}\n\n` +
    `Silakan buka dashboard Musyrif RajinQu untuk memeriksa bukti foto & menyetujui laporan.\n\n` +
    `_RajinQu Pondok Pesantren - Liburan Berkah & Disiplin_`;

  return sendWhatsAppMessage({
    target: musyrifPhone,
    message,
    url: fotoUrl,
    filename: `bukti_${santriName.replace(/\s+/g, '_')}.jpg`
  });
}

/**
 * Template 2: Notifikasi Status Validasi untuk Santri
 */
export async function notifySantriReportStatus({
  santriPhone,
  santriName,
  kegiatanName,
  status,
  poin,
  komentar,
}: {
  santriPhone: string;
  santriName: string;
  kegiatanName: string;
  status: 'APPROVED' | 'REJECTED';
  poin: number;
  komentar?: string;
}) {
  const isApproved = status === 'APPROVED';
  const icon = isApproved ? '✅' : '❌';
  const statusText = isApproved ? 'DISETUJUI' : 'DITOLAK / PERLU PERBAIKAN';

  let message = `${icon} *Hasil Validasi Kegiatan - RajinQu*\n\n` +
    `Assalamu'alaikum *${santriName}*,\n` +
    `Laporan kegiatan liburanmu telah ditinjau oleh Musyrif:\n\n` +
    `📖 *Kegiatan:* ${kegiatanName}\n` +
    `📌 *Status:* *${statusText}*\n`;

  if (isApproved) {
    message += `⭐ *Poin Didapat:* +${poin} Poin\n`;
  }

  if (komentar) {
    message += `💬 *Catatan Musyrif:* "${komentar}"\n`;
  }

  message += `\nTetap semangat istiqomah menjalankan rutinitas ibadah dan kebaikan di rumah ya!\n\n` +
    `_RajinQu Pondok Pesantren_`;

  return sendWhatsAppMessage({
    target: santriPhone,
    message,
  });
}

/**
 * Template 3: Reminder Otomatis Pukul 19.00 untuk Santri yang Belum Lapor
 */
export async function sendDailyReminderToSantri({
  santriPhone,
  santriName,
  kegiatanBelumSelesai,
}: {
  santriPhone: string;
  santriName: string;
  kegiatanBelumSelesai: string[];
}) {
  const listKegiatan = kegiatanBelumSelesai.map(k => `• ${k}`).join('\n');

  const message = `⏰ *PENGINGAT LAPORAN HARIAN - RajinQu*\n\n` +
    `Assalamu'alaikum *${santriName}*,\n` +
    `Waktu sudah menunjukkan pukul 19.00 WIB. Jangan lupa untuk melengkapi laporan kegiatan liburanmu hari ini sebelum batas waktu pukul 21.00 WIB.\n\n` +
    `📋 *Kegiatan yang belum dilaporkan hari ini:*\n` +
    `${listKegiatan}\n\n` +
    `Yuk segera ambil foto selfie dan kirim laporannya di aplikasi RajinQu agar poinmu tetap unggul di Leaderboard!\n\n` +
    `_Jazakumullah Khairan Katsiran_`;

  return sendWhatsAppMessage({
    target: santriPhone,
    message,
  });
}
