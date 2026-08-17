# RajinQu 🌟
**Aplikasi Web Monitoring Kegiatan Santri Liburan**

RajinQu adalah aplikasi web modern berbasis *Mobile-First* yang dirancang khusus untuk Pondok Pesantren dalam memantau rutinitas ibadah, belajar, dan khidmah santri selama masa liburan dengan validasi foto selfie + GPS Geolocation, moderasi musyrif, leaderboard gamifikasi, dan notifikasi WhatsApp otomatis.

---

## 🚀 Fitur Utama

### 1. Santri (Mobile Experience)
- **Feed Kegiatan**: Melihat postingan kegiatan santri lain yang sudah terverifikasi dengan fitur Like & Komentar.
- **Tugas Hari Ini**: Checklist rutinitas ibadah harian (Sholat Subuh, Dhuha, Muroja'ah Al-Qur'an, Membantu Orang Tua).
- **Upload Selfie + GPS**: Mengambil foto kegiatan dengan auto capture koordinat GPS & timestamp.
- **Leaderboard**: Klasemen Top 10 santri dengan podium animasi.
- **Riwayat**: Status laporan (Menunggu Validasi, Disetujui, Ditolak) beserta catatan evaluasi dari Musyrif.
- **Profil & Grafik**: Statistik perkembangan kepatuhan harian dan grafik mingguan interaktif.

### 2. Musyrif / Pengurus
- **Antrean Validasi (Approval Queue)**: Memeriksa foto kegiatan, lokasi GPS, dan waktu setor dengan tombol **Setuju (+Poin)** atau **Tolak (+Alasan)**.
- **Monitoring Santri Binaan**: Daftar santri dengan indikator status harian (*Lengkap, Sebagian, Belum Lapor*).
- **Auto-Reminder WhatsApp**: Pengingat otomatis pukul 19.00 WIB untuk santri yang belum menyelesaikan tugas harian + tombol teguran manual.
- **Grafik Disiplin**: Statistik kepatuhan santri binaan per asrama.

### 3. Super Admin / Yayasan
- **Pengaturan Poin**: Menyesuaikan bobot poin untuk tiap kegiatan ibadah/sunnah.
- **Data Akun**: Manajemen akun santri dan musyrif (didaftarkan oleh admin).
- **Periode & Reward**: Mengatur masa liburan dan target reward santri teladan.
- **Export Laporan**: Ekspor data rekapitulasi ke format CSV/Excel.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide React, Recharts
- **Database & ORM**: PostgreSQL (Neon DB ready) + Prisma ORM
- **Storage Bukti**: Google Drive via Google Apps Script Web App
- **WhatsApp Notification**: Direct WhatsApp Web / App Link Integration (`wa.me`) & Interactive Confirmation Modals
- **Cron Jobs**: Vercel Cron (`/api/cron/reminder-1900`)

---

## 📦 Panduan Instalasi & Menjalankan Aplikasi

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Konfigurasi File Lingkungan (.env)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Isi variabel konfigurasi:
- `DATABASE_URL`: URL PostgreSQL dari Neon DB
- `GOOGLE_APPS_SCRIPT_URL`: URL Web App dari deployment Google Apps Script

### 3. Generate Prisma Client (Jika menggunakan Database)
```bash
npx prisma generate
```

### 4. Jalankan Dev Server
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

---

## 📱 Akun Demo Siap Pakai

| Role | Username / NIS | Password / PIN | Keterangan |
|---|---|---|---|
| **Santri** | `2026001` | `123` | Muhammad Faiz (Asrama Abu Bakar) |
| **Musyrif** | `musyrif.abdullah` | `123` | Ustadz Abdullah Robbani |
| **Super Admin** | `admin` | `admin` | Yayasan Al-Hikmah |

*Catatan: Tersedia tombol **Quick Fill Demo** di halaman login dan tombol **Ganti Role** mengambang di pojok kanan bawah untuk memudahkan pengujian semua role.*
