/**
 * ====================================================================
 * RAJINQU - MANUAL WHATSAPP CONFIRMATION HELPER & TEMPLATES
 * ====================================================================
 * Sistem ini memungkinkan Santri dan Musyrif mengirim konfirmasi pesan
 * secara langsung & manual via WhatsApp Web / WhatsApp App (wa.me)
 * tanpa ketergantungan pada gateway API pihak ketiga (seperti Fonnte).
 */

/**
 * Format nomor HP Indonesia ke format internasional (628xxx)
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = (phone || '').replace(/[^0-9]/g, '');
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
 * Buat tautan langsung ke WhatsApp Web / Aplikasi WhatsApp (wa.me)
 */
export function getWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = formatPhoneNumber(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Buka URL WhatsApp secara langsung di browser (tab baru)
 */
export function openWhatsAppDirect(phone: string, message: string) {
  const url = getWhatsAppUrl(phone, message);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Salin pesan teks ke clipboard dengan fallback
 */
export async function copyMessageToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}

/**
 * TEMPLATE 1: Konfirmasi Laporan Baru dari Santri ke Musyrif
 */
export function formatMusyrifReportMessage({
  musyrifName,
  santriName,
  asrama,
  kegiatanName,
  poin,
  waktu,
  statusWaktu,
  lokasiName,
  catatanSantri,
  fotoUrl,
  pondokNama = "Pondok Tahfizhul Qur'an Ash-Sholihah (PTQA) Batuan",
}: {
  musyrifName: string;
  santriName: string;
  asrama?: string;
  kegiatanName: string;
  poin: number;
  waktu: string;
  statusWaktu?: 'TEPAT_WAKTU' | 'TERLAMBAT' | string;
  lokasiName?: string;
  catatanSantri?: string;
  fotoUrl?: string;
  pondokNama?: string;
}): string {
  const statusWaktuText =
    statusWaktu === 'TERLAMBAT' ? '⏳ Terlambat' : '✓ Tepat Waktu';

  let msg = `🔔 *KONFIRMASI LAPORAN SANTRI - RAJINQU*\n\n` +
    `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n` +
    `Ustadz *${musyrifName}*,\n\n` +
    `Saya baru saja menyelesaikan dan mengunggah laporan kegiatan liburan di aplikasi RajinQU:\n\n` +
    `👤 *Nama Santri:* ${santriName} ${asrama ? `(${asrama})` : ''}\n` +
    `📖 *Kegiatan:* ${kegiatanName} (+${poin} Poin)\n` +
    `⏰ *Waktu Kirim:* ${waktu} (${statusWaktuText})\n`;

  if (lokasiName) {
    msg += `📍 *Lokasi GPS:* ${lokasiName}\n`;
  }

  if (catatanSantri) {
    msg += `📝 *Catatan:* "${catatanSantri}"\n`;
  }

  if (fotoUrl) {
    msg += `📸 *Bukti Foto Kegiatan:* ${fotoUrl}\n`;
  }

  msg += `\nMohon perkenan Ustadz untuk meninjau dan memvalidasi laporan ini di dashboard Musyrif RajinQU.\n\n` +
    `_Jazakumullah Khairan Katsiran_\n` +
    `*${pondokNama}*`;

  return msg;
}

/**
 * TEMPLATE 2: Konfirmasi Hasil Validasi Laporan dari Musyrif ke Santri (Disetujui / Ditolak)
 */
export function formatSantriReportStatusMessage({
  santriName,
  kegiatanName,
  status,
  poin,
  komentar,
  musyrifName = 'Musyrif Pembimbing',
}: {
  santriName: string;
  kegiatanName: string;
  status: 'APPROVED' | 'REJECTED';
  poin: number;
  komentar?: string;
  musyrifName?: string;
}): string {
  const isApproved = status === 'APPROVED';
  const icon = isApproved ? '✅' : '❌';
  const statusText = isApproved ? 'DISETUJUI (MUMTAZ)' : 'PERLU PERBAIKAN / DITOLAK';

  let msg = `${icon} *HASIL VALIDASI KEGIATAN - RAJINQU*\n\n` +
    `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n` +
    `Ananda *${santriName}*,\n\n` +
    `Laporan kegiatan liburanmu telah diperiksa oleh Ustadz *${musyrifName}*:\n\n` +
    `📖 *Kegiatan:* ${kegiatanName}\n` +
    `📌 *Status:* *${statusText}*\n`;

  if (isApproved) {
    msg += `⭐ *Poin Didapat:* +${poin} Poin\n`;
  }

  if (komentar) {
    msg += `💬 *Catatan Evaluasi / Bimbingan:*\n"${komentar}"\n`;
  }

  if (isApproved) {
    msg += `\nBarakallahu fiik! Terus pertahankan semangat ibadah dan rutinitas positifmu di rumah ya.\n\n`;
  } else {
    msg += `\nSilakan periksa kembali instruksi kegiatan, ambil foto bukti yang jelas, dan kirim ulang laporannya di aplikasi RajinQU.\n\n`;
  }

  msg += `Wassalamu'alaikum Warahmatullahi Wabarakatuh,\n` +
    `*${musyrifName}*\n` +
    `_RajinQU - Monitoring Liburan Berkah_`;

  return msg;
}

/**
 * TEMPLATE 3: Pesan Teguran Kedisiplinan / Pengingat Santri dari Musyrif
 */
export function formatSantriTeguranMessage({
  santriName,
  asrama,
  tanggal,
  missingKegiatan,
  musyrifName = 'Musyrif Pembimbing',
  musyrifAsrama = 'Pengurus Halaqoh',
}: {
  santriName: string;
  asrama?: string;
  tanggal: string;
  missingKegiatan: string[];
  musyrifName?: string;
  musyrifAsrama?: string;
}): string {
  const missingText =
    missingKegiatan.length > 0
      ? missingKegiatan.map((k) => `• ${k}`).join('\n')
      : '• Evaluasi kelengkapan foto dan kepatuhan waktu.';

  return `⚠️ *TEGURAN KEDISIPLINAN - RAJINQU*\n\n` +
    `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
    `Yth. Ananda *${santriName}* ${asrama ? `(${asrama})` : ''},\n\n` +
    `Berdasarkan monitoring kegiatan harian liburan pada tanggal *${tanggal}*, Ananda tercatat *belum menyelesaikan / mengunggah* laporan untuk kegiatan berikut:\n\n` +
    `${missingText}\n\n` +
    `Mohon untuk segera melaksanakan kewajiban kegiatan liburan dan mengunggah laporan selfie + validasi GPS ke aplikasi RajinQU sebelum batas waktu pengingat.\n\n` +
    `Semoga Allah senantiasa memberikan kemudahan, keistiqomahan, dan keberkahan.\n\n` +
    `Wassalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
    `*${musyrifName}*\n` +
    `_${musyrifAsrama}_`;
}

/**
 * Backward compatibility helpers
 */
export async function sendWhatsAppMessage(payload: {
  target: string;
  message: string;
}) {
  return {
    status: true,
    message: 'Manual WhatsApp confirmation is active.',
    data: payload,
  };
}

export async function notifyMusyrifNewReport(data: any) {
  return { status: true, message: 'Ready for manual WhatsApp confirmation' };
}

export async function notifySantriReportStatus(data: any) {
  return { status: true, message: 'Ready for manual WhatsApp confirmation' };
}

export async function sendDailyReminderToSantri(data: any) {
  return { status: true, message: 'Ready for manual WhatsApp confirmation' };
}
