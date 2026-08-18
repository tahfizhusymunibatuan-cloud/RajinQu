'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  MessageSquare,
  Send,
  Sparkles,
  LogOut,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  CheckCheck,
  Smartphone,
  PhoneCall,
  Flame,
  BarChart3,
  Search,
  Calendar,
  ExternalLink,
  Check,
  X,
  Eye,
  MessageCircle,
  Heart,
  User,
  Shield,
  Key,
  Award,
  BookOpen,
  Newspaper,
  Save,
  Lock,
  Phone,
  Layers,
  GraduationCap,
  Camera,
  Copy
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import { PrayerCountdownWidget } from '@/components/prayer-countdown-widget';
import { uploadImageToStorage, formatDriveImageUrl } from '@/lib/google-drive';
import {
  formatSantriReportStatusMessage,
  formatSantriTeguranMessage,
  openWhatsAppDirect,
  copyMessageToClipboard,
  formatPhoneNumber,
  getWhatsAppUrl,
} from '@/lib/whatsapp';

export default function PengurusPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const {
    laporanList,
    allUsers,
    santriList,
    kegiatanList,
    kelompokList,
    approveLaporan,
    rejectLaporan,
    broadcastReminder,
    toggleLike,
    addComment,
    updateUser,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'validasi' | 'santri' | 'feed' | 'statistik' | 'profil'>('validasi');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State Modal Konfirmasi Persetujuan Laporan + WhatsApp Manual
  const [approveModal, setApproveModal] = useState<{
    isOpen: boolean;
    laporan: any | null;
    santri: any | null;
    catatan: string;
    message: string;
    copied: boolean;
  }>({
    isOpen: false,
    laporan: null,
    santri: null,
    catatan: 'Mumtaz! Laporan diterima dan poin ditambahkan.',
    message: '',
    copied: false,
  });

  // State Modal Penolakan Laporan + WhatsApp Manual
  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    laporan: any | null;
    santri: any | null;
    alasan: string;
    message: string;
    copied: boolean;
  }>({
    isOpen: false,
    laporan: null,
    santri: null,
    alasan: 'Foto kurang jelas / belum memenuhi kriteria kegiatan, mohon foto ulang.',
    message: '',
    copied: false,
  });

  // Feed States
  const [feedFilter, setFeedFilter] = useState<'ALL' | 'IBADAH' | 'BELAJAR' | 'MANDIRI' | 'SOSIAL'>('ALL');
  const [feedSearch, setFeedSearch] = useState('');
  const [commentInput, setCommentInput] = useState<{ [key: string]: string }>({});
  const [showCommentBox, setShowCommentBox] = useState<{ [key: string]: boolean }>({});

  // Profil Form States
  const [profileForm, setProfileForm] = useState({
    nama: user?.nama || '',
    username: user?.username || '',
    noHp: user?.noHp || '',
    password: user?.password || '',
    asrama: user?.asrama || '',
  });

  // Filter Tanggal & Rincian Kegiatan Santri
  const [filterDate, setFilterDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [expandedSantri, setExpandedSantri] = useState<{ [santriId: string]: boolean }>({});
  const [previewFotoUrl, setPreviewFotoUrl] = useState<{ url: string; title: string } | null>(null);

  // Modal Konfirmasi Teguran WhatsApp
  const [isTeguranModalOpen, setIsTeguranModalOpen] = useState(false);
  const [teguranTarget, setTeguranTarget] = useState<{
    santri: any;
    missingKegiatan: string[];
    customMessage: string;
    copied: boolean;
  } | null>(null);

  const musyrifAvatarInputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!user) {
        router.push('/login');
      } else {
        setProfileForm({
          nama: user.nama || '',
          username: user.username || '',
          noHp: user.noHp || '',
          password: user.password || '',
          asrama: user.asrama || '',
        });
      }
    }
  }, [user, isLoading, mounted, router]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter santri binaan yang dipertanggungjawabkan ke musyrif ini (Memoized)
  const mySantriBinaan = useMemo(() => {
    return santriList.filter(
      (s) => s.musyrifId === user?.id || s.musyrifNama === user?.nama
    );
  }, [santriList, user?.id, user?.nama]);

  const displaySantri = useMemo(() => {
    return mySantriBinaan.length > 0 ? mySantriBinaan : santriList;
  }, [mySantriBinaan, santriList]);

  const pendingLaporans = useMemo(() => {
    return laporanList.filter((l) => {
      if (l.status !== 'PENDING') return false;
      const s = santriList.find((usr) => usr.id === l.userId || usr.nama === l.userNama);
      if (!s) return true;
      return mySantriBinaan.length === 0 || s.musyrifId === user?.id || s.musyrifNama === user?.nama;
    });
  }, [laporanList, santriList, mySantriBinaan, user?.id, user?.nama]);

  const approvedLaporans = useMemo(() => {
    return laporanList.filter((l) => l.status === 'APPROVED');
  }, [laporanList]);

  // Filter Laporan untuk Feed Seluruh Santri (Hanya yang sudah disetujui / APPROVED) (Memoized)
  const filteredFeed = useMemo(() => {
    const search = feedSearch.trim().toLowerCase();
    return laporanList.filter((lap) => {
      if (lap.status !== 'APPROVED') return false;
      const matchCategory = feedFilter === 'ALL' || lap.kategori === feedFilter;
      const matchSearch =
        search === '' ||
        lap.userNama.toLowerCase().includes(search) ||
        lap.kegiatanNama.toLowerCase().includes(search) ||
        (lap.userAsrama && lap.userAsrama.toLowerCase().includes(search));
      return matchCategory && matchSearch;
    });
  }, [laporanList, feedFilter, feedSearch]);

  const handleOpenApprove = (lap: any) => {
    const santri =
      allUsers.find((u) => u.id === lap.userId || u.nama === lap.userNama) ||
      santriList.find((u) => u.nama === lap.userNama) || {
        nama: lap.userNama,
        noHp: '08123456789',
        asrama: lap.userAsrama,
      };

    const officialKeg = kegiatanList.find((k) => k.id === lap.kegiatanId);
    const poinResmi = officialKeg ? officialKeg.poin : (lap.poin || 20);

    const defaultNote = 'Mumtaz! Laporan diterima dan poin telah ditambahkan.';
    const msg = formatSantriReportStatusMessage({
      santriName: santri.nama,
      kegiatanName: lap.kegiatanNama,
      status: 'APPROVED',
      poin: poinResmi,
      komentar: defaultNote,
      musyrifName: user?.nama || 'Musyrif Pembimbing',
    });

    setApproveModal({
      isOpen: true,
      laporan: { ...lap, poin: poinResmi },
      santri,
      catatan: defaultNote,
      message: msg,
      copied: false,
    });
  };

  const handleUpdateApproveCatatan = (newCatatan: string) => {
    if (!approveModal.laporan || !approveModal.santri) return;
    const msg = formatSantriReportStatusMessage({
      santriName: approveModal.santri.nama,
      kegiatanName: approveModal.laporan.kegiatanNama,
      status: 'APPROVED',
      poin: approveModal.laporan.poin,
      komentar: newCatatan,
      musyrifName: user?.nama || 'Musyrif Pembimbing',
    });
    setApproveModal((prev) => ({ ...prev, catatan: newCatatan, message: msg }));
  };

  const handleConfirmApproveWithWA = () => {
    if (!approveModal.laporan) return;
    approveLaporan(approveModal.laporan.id, approveModal.catatan);
    if (approveModal.santri?.noHp) {
      openWhatsAppDirect(approveModal.santri.noHp, approveModal.message);
    }
    setApproveModal((prev) => ({ ...prev, isOpen: false }));
    showToast('✅ Laporan disetujui & Membuka WhatsApp santri!');
  };

  const handleConfirmApproveOnly = () => {
    if (!approveModal.laporan) return;
    approveLaporan(approveModal.laporan.id, approveModal.catatan);
    setApproveModal((prev) => ({ ...prev, isOpen: false }));
    showToast('✅ Laporan berhasil disetujui!');
  };

  const handleOpenReject = (lap: any) => {
    const santri =
      allUsers.find((u) => u.id === lap.userId || u.nama === lap.userNama) ||
      santriList.find((u) => u.nama === lap.userNama) || {
        nama: lap.userNama,
        noHp: '08123456789',
        asrama: lap.userAsrama,
      };

    const defaultReason = 'Foto kurang jelas / belum memenuhi kriteria kegiatan. Mohon upload ulang dengan jelas.';
    const msg = formatSantriReportStatusMessage({
      santriName: santri.nama,
      kegiatanName: lap.kegiatanNama,
      status: 'REJECTED',
      poin: 0,
      komentar: defaultReason,
      musyrifName: user?.nama || 'Musyrif Pembimbing',
    });

    setRejectModal({
      isOpen: true,
      laporan: lap,
      santri,
      alasan: defaultReason,
      message: msg,
      copied: false,
    });
  };

  const handleUpdateRejectAlasan = (newAlasan: string) => {
    if (!rejectModal.laporan || !rejectModal.santri) return;
    const msg = formatSantriReportStatusMessage({
      santriName: rejectModal.santri.nama,
      kegiatanName: rejectModal.laporan.kegiatanNama,
      status: 'REJECTED',
      poin: 0,
      komentar: newAlasan,
      musyrifName: user?.nama || 'Musyrif Pembimbing',
    });
    setRejectModal((prev) => ({ ...prev, alasan: newAlasan, message: msg }));
  };

  const handleConfirmRejectWithWA = () => {
    if (!rejectModal.laporan) return;
    rejectLaporan(rejectModal.laporan.id, rejectModal.alasan);
    if (rejectModal.santri?.noHp) {
      openWhatsAppDirect(rejectModal.santri.noHp, rejectModal.message);
    }
    setRejectModal((prev) => ({ ...prev, isOpen: false }));
    showToast('❌ Laporan ditolak & Membuka WhatsApp santri!');
  };

  const handleConfirmRejectOnly = () => {
    if (!rejectModal.laporan) return;
    rejectLaporan(rejectModal.laporan.id, rejectModal.alasan);
    setRejectModal((prev) => ({ ...prev, isOpen: false }));
    showToast('❌ Laporan ditolak!');
  };

  // Komentar Musyrif ke Feed Santri
  const handleMusyrifComment = (laporanId: string) => {
    const text = commentInput[laporanId]?.trim();
    if (!text || !user) return;

    addComment(laporanId, user, text);
    setCommentInput((prev) => ({ ...prev, [laporanId]: '' }));
    showToast('💬 Komentar bimbingan berhasil diposting!');
  };

  // Update Profil Musyrif
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    updateUser(user.id, {
      nama: profileForm.nama.trim(),
      username: profileForm.username.trim(),
      noHp: profileForm.noHp.trim(),
      password: profileForm.password.trim(),
      asrama: profileForm.asrama.trim(),
    });

    showToast('✅ Profil & Pengaturan Akun berhasil diperbarui!');
  };

  const handleMusyrifAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Url = reader.result as string;
        if (user?.id) {
          const uploadRes = await uploadImageToStorage({
            imageBase64: base64Url,
            fileName: `AVATAR_MUSYRIF_${user.username || 'musyrif'}`,
            santriName: user.nama,
          });
          updateUser(user.id, { avatarUrl: uploadRes.fileUrl });
          showToast('✅ Foto profil musyrif berhasil diperbarui!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Buka Modal Konfirmasi Teguran WhatsApp dengan Daftar Kegiatan yang Belum
  const handleOpenTeguranModal = (santri: any) => {
    const santriLaporans = laporanList.filter(
      (l) => (l.userId === santri.id || l.userNama === santri.nama)
    );

    const doneKegiatanIds = santriLaporans
      .filter((l) => l.status !== 'REJECTED')
      .map((l) => l.kegiatanId);

    const missing = kegiatanList
      .filter((k) => !doneKegiatanIds.includes(k.id))
      .map((k) => `${k.nama} (${k.isWajib ? 'Wajib' : 'Sunnah'})`);

    const messageTemplate = formatSantriTeguranMessage({
      santriName: santri.nama,
      asrama: santri.asrama,
      tanggal: filterDate,
      missingKegiatan: missing,
      musyrifName: user?.nama || 'Musyrif Pembimbing',
      musyrifAsrama: user?.asrama || 'Pengurus Halaqoh',
    });

    setTeguranTarget({
      santri,
      missingKegiatan: missing,
      customMessage: messageTemplate,
      copied: false,
    });
    setIsTeguranModalOpen(true);
  };

  const handleOpenWhatsAppWeb = () => {
    if (!teguranTarget) return;
    openWhatsAppDirect(teguranTarget.santri.noHp, teguranTarget.customMessage);
    setIsTeguranModalOpen(false);
    showToast(`📱 Membuka WhatsApp untuk ${teguranTarget.santri.nama}...`);
  };

  const toggleExpandSantri = (santriId: string) => {
    setExpandedSantri((prev) => ({
      ...prev,
      [santriId]: !prev[santriId],
    }));
  };

  // Data kepatuhan santri untuk Recharts
  const kepatuhanData = [
    { hari: 'Senin', hadir: 5, target: 5 },
    { hari: 'Selasa', hadir: 4, target: 5 },
    { hari: 'Rabu', hadir: 5, target: 5 },
    { hari: 'Kamis', hadir: 3, target: 5 },
    { hari: 'Jumat', hadir: 5, target: 5 },
    { hari: 'Sabtu', hadir: 4, target: 5 },
    { hari: 'Ahad', hadir: 5, target: 5 },
  ];

  if (!mounted || isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-24 max-w-md mx-auto relative shadow-2xl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-full shadow-lg border border-slate-700 animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Pengurus */}
      <header className="bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 text-white p-4 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center border border-amber-300/60 shadow-sm shrink-0">
              <img
                src="/logo-pondok.png"
                alt="Logo PPTQ Al-Usymuni"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-tight">Dashboard Musyrif</h1>
                <span className="text-[9px] bg-teal-500/30 text-teal-200 px-1.5 py-0.2 rounded font-semibold border border-teal-400/30">
                  Pengurus
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">{user?.nama}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-3.5 space-y-4">
        {/* ============================================================= */}
        {/* TAB 1: ANTREAN VALIDASI LAPORAN (APPROVAL QUEUE) */}
        {/* ============================================================= */}
        {activeTab === 'validasi' && (
          <div className="space-y-4">
            {/* Widget Jadwal Sholat & Waktu Kegiatan PTQA */}
            <PrayerCountdownWidget compact kegiatanList={kegiatanList} />

            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Laporan Menunggu Validasi ({pendingLaporans.length})
              </h3>
              <span className="text-[10px] text-slate-400">Verifikasi foto & GPS</span>
            </div>

            {pendingLaporans.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
                <CheckCheck className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                <p className="text-xs font-bold text-slate-700">Semua Laporan Sudah Divalidasi!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Tidak ada antrean laporan baru saat ini.</p>
              </div>
            ) : (
              pendingLaporans.map((lap) => (
                <div
                  key={lap.id}
                  className="bg-white rounded-2xl border-2 border-amber-200 shadow-md overflow-hidden"
                >
                  {/* Card Header */}
                  {(() => {
                    const authorInfo = allUsers.find((u) => u.id === lap.userId) || santriList.find((u) => u.nama === lap.userNama);
                    const authorNama = authorInfo?.nama || lap.userNama;
                    const authorAsrama = authorInfo?.asrama || lap.userAsrama;
                    const authorAvatar = authorInfo?.avatarUrl || lap.userAvatar;

                    return (
                      <div className="p-3 bg-amber-50/50 flex items-center justify-between border-b border-amber-100">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={authorAvatar}
                            alt={authorNama}
                            className="w-9 h-9 rounded-full object-cover border border-amber-300"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-800">{authorNama}</div>
                            <div className="text-[10px] text-slate-500">{authorAsrama}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          +{lap.poin} Poin
                        </span>
                      </div>
                    );
                  })()}

                  {/* Foto Bukti Selfie (Rasio Potret 3:4) */}
                  <div className="relative bg-slate-900 aspect-[3/4] w-full overflow-hidden">
                    <img
                      src={formatDriveImageUrl(lap.fotoUrl)}
                      alt={lap.kegiatanNama}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-md font-semibold">
                      {lap.kegiatanNama}
                    </div>
                  </div>

                  {/* Data Geolocation & Waktu WIB */}
                  <div className="p-3 space-y-2 text-xs">
                    {/* Status Kepatuhan Waktu WIB */}
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-1.5 font-bold text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Waktu Kirim (WIB):</span>
                      </div>

                      {lap.statusWaktu === 'TERLAMBAT' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                          <span>⏳ Terlambat</span>
                          <span className="font-mono">({lap.waktuLaporWIB || lap.createdAt})</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <span>✓ Tepat Waktu</span>
                          <span className="font-mono">({lap.waktuLaporWIB || lap.createdAt})</span>
                        </span>
                      )}
                    </div>

                    {/* Alert jika Terlambat */}
                    {lap.statusWaktu === 'TERLAMBAT' && (
                      <div className="p-2 bg-amber-50 text-amber-900 rounded-xl border border-amber-200 text-[10px] leading-relaxed flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>Perhatian Musyrif:</strong> Santri mengirim laporan di luar batas jam kegiatan. Anda berhak <strong>Menerima dengan catatan toleransi</strong> atau <strong>Menolak</strong> jika tidak disiplin.
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="truncate">{lap.lokasiName}</span>
                    </div>

                    <div className="text-[11px] text-slate-700 bg-teal-50/50 p-2 rounded-xl border border-teal-100">
                      <span className="font-semibold text-teal-900">Catatan Santri: </span>
                      <span>{lap.catatanSantri}</span>
                    </div>

                    {/* Action Buttons: Setuju / Tolak */}
                    <div className="pt-2 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenReject(lap)}
                        className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 flex items-center justify-center gap-1.5 transition active:scale-95 text-xs"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Tolak Laporan</span>
                      </button>

                      <button
                        onClick={() => handleOpenApprove(lap)}
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition active:scale-95 text-xs"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{lap.statusWaktu === 'TERLAMBAT' ? 'Terima (Toleransi)' : 'Setuju (+ ' + lap.poin + ')'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: DAFTAR SANTRI BINAAN & STATUS LAPOR PER TANGGAL */}
        {/* ============================================================= */}
        {activeTab === 'santri' && (
          <div className="space-y-3.5">
            {/* Auto WhatsApp 19.00 Alert Box */}
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-3.5 text-white shadow-sm flex items-start gap-2.5">
              <Clock className="w-5 h-5 text-amber-100 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold">Auto-Reminder Pukul 19.00 WIB</div>
                <div className="text-[11px] text-amber-100 mt-0.5 leading-relaxed">
                  Sistem otomatis mengirim WhatsApp ke santri yang belum menyelesaikan kegiatan harian. Anda juga dapat mengirim teguran langsung di bawah.
                </div>
              </div>
            </div>

            {/* FILTER TANGGAL MONITORING */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Calendar className="w-4 h-4 text-teal-700" />
                  <span>Filter Tanggal Pemantauan:</span>
                </div>
                <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  WIB (UTC+7)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="flex-1 text-xs font-bold text-slate-800 p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setFilterDate(new Date().toISOString().split('T')[0])}
                  className="px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  Hari Ini
                </button>
              </div>
            </div>

            {/* Kelompok / Halaqah Binaan Info Banner */}
            {(() => {
              const myKelompokList = kelompokList.filter((k) => k.musyrifId === user?.id || k.musyrifNama === user?.nama);
              if (myKelompokList.length === 0) return null;
              return (
                <div className="bg-indigo-50 border border-indigo-200/80 rounded-2xl p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 block uppercase tracking-wider">
                        Halaqah / Kelompok Binaan
                      </span>
                      <span className="text-xs font-black text-indigo-950">
                        {myKelompokList.map((k) => k.nama).join(', ')}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-xl shrink-0">
                    {displaySantri.length} Santri
                  </span>
                </div>
              );
            })()}

            {/* List Santri Binaan dengan Rincian Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-700">
                <span>Santri Binaan Anda ({displaySantri.length})</span>
                <span className="text-[10px] text-slate-400">Tanggal: {filterDate}</span>
              </div>

              {displaySantri.map((santri) => {
                const santriLaporans = laporanList.filter(
                  (l) => (l.userId === santri.id || l.userNama === santri.nama)
                );

                const activitiesStatus = kegiatanList.map((keg) => {
                  const lap = santriLaporans.find(
                    (l) => (l.kegiatanId === keg.id || l.kegiatanNama === keg.nama) && l.status !== 'REJECTED'
                  );

                  return {
                    kegiatan: keg,
                    isDone: !!lap,
                    laporan: lap,
                  };
                });

                const completedCount = activitiesStatus.filter((a) => a.isDone).length;
                const totalCount = kegiatanList.length;
                const isExpanded = !!expandedSantri[santri.id];

                return (
                  <div
                    key={santri.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    {/* Header Santri Card */}
                    <div className="p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={santri.avatarUrl}
                            alt={santri.nama}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-800">{santri.nama}</span>
                              {santri.kelompokNama && (
                                <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded-md">
                                  {santri.kelompokNama}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">{santri.noHp}</div>
                          </div>
                        </div>

                        {/* Status Tag */}
                        {completedCount === totalCount ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ {completedCount}/{totalCount} Lengkap
                          </span>
                        ) : completedCount > 0 ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            ⏳ {completedCount}/{totalCount} Selesai
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            ⚠ Belum Lapor
                          </span>
                        )}
                      </div>

                      {/* Action Bar per Santri: Lihat Rincian + Kirim WA Teguran */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                        <button
                          type="button"
                          onClick={() => toggleExpandSantri(santri.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100/80 px-2.5 py-1 rounded-xl transition"
                        >
                          <span>Rincian Kegiatan ({completedCount}/{totalCount})</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenTeguranModal(santri)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition active:scale-95"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Kirim WA Teguran</span>
                        </button>
                      </div>
                    </div>

                    {/* Accordion Rincian Kegiatan */}
                    {isExpanded && (
                      <div className="bg-slate-50/80 p-3 border-t border-slate-100 space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Daftar Kepatuhan Kegiatan ({filterDate}):
                        </div>

                        {activitiesStatus.map(({ kegiatan, isDone, laporan }) => (
                          <div
                            key={kegiatan.id}
                            className={`p-2 rounded-xl border text-xs flex items-center justify-between ${
                              isDone
                                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                : 'bg-rose-50/60 border-rose-200 text-rose-950'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                isDone ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                              }`}>
                                {isDone ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              </div>
                              <div>
                                <div className="font-bold text-[11px] flex items-center gap-1.5">
                                  <span>{kegiatan.nama}</span>
                                  {kegiatan.isWajib ? (
                                    <span className="text-[8px] bg-amber-100 text-amber-900 px-1 py-0.2 rounded font-bold">Wajib</span>
                                  ) : (
                                    <span className="text-[8px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded">Sunnah</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {kegiatan.isTimeRestricted ? `⏰ ${kegiatan.jamMulai} - ${kegiatan.jamSelesai} WIB` : '♾️ Waktu Bebas'}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              {isDone ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                    {laporan?.statusWaktu === 'TERLAMBAT' ? '⏳ Telat' : '✓ Tepat'}
                                  </span>
                                  {laporan?.fotoUrl && (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewFotoUrl({ url: laporan.fotoUrl, title: `${santri.nama} - ${kegiatan.nama}` })}
                                      className="p-1 text-teal-700 hover:bg-teal-100 rounded-lg"
                                      title="Intip Foto Selfie"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                                  Belum Dikerjakan
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 3: FEED TIMELINE SELURUH SANTRI (UNIVERSAL FEED) */}
        {/* ============================================================= */}
        {activeTab === 'feed' && (
          <div className="space-y-3.5">
            {/* Search & Category Filter */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari santri, kelompok, atau kegiatan..."
                  value={feedSearch}
                  onChange={(e) => setFeedSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              {/* Chips Kategori */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar text-xs font-semibold">
                {(['ALL', 'IBADAH', 'BELAJAR', 'MANDIRI', 'SOSIAL'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFeedFilter(cat)}
                    className={`px-3 py-1 rounded-full shrink-0 transition ${
                      feedFilter === cat
                        ? 'bg-teal-800 text-white font-bold shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'Semua' : cat === 'IBADAH' ? '🕌 Ibadah' : cat === 'BELAJAR' ? '📖 Belajar' : cat === 'MANDIRI' ? '🏡 Mandiri' : '🤝 Sosial'}
                  </button>
                ))}
              </div>
            </div>

            {/* List Feed Cards */}
            <div className="space-y-3.5">
              {filteredFeed.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
                  <Newspaper className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold text-slate-700">Belum ada postingan kegiatan santri.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Laporan kegiatan santri akan otomatis muncul di timeline ini.</p>
                </div>
              ) : (
                filteredFeed.map((lap) => (
                  <div
                    key={lap.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-2.5"
                  >
                    {/* Header Feed Card */}
                    <div className="p-3.5 pb-0 flex items-center justify-between">
                      {(() => {
                        const authorInfo = allUsers.find((u) => u.id === lap.userId) || santriList.find((u) => u.nama === lap.userNama);
                        const authorNama = authorInfo?.nama || lap.userNama;
                        const authorKelompok = authorInfo?.kelompokNama;
                        const authorAvatar = authorInfo?.avatarUrl || lap.userAvatar;

                        return (
                          <div className="flex items-center gap-2.5">
                            <img
                              src={authorAvatar}
                              alt={authorNama}
                              className="w-9 h-9 rounded-full object-cover border border-teal-500/30"
                            />
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-800">{authorNama}</span>
                                {authorKelompok && (
                                  <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded-md">
                                    {authorKelompok}
                                  </span>
                                )}
                                
                                {lap.statusWaktu === 'TERLAMBAT' ? (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                    ⏳ Terlambat
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    ✓ Tepat Waktu
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{lap.createdAt}</div>
                            </div>
                          </div>
                        );
                      })()}

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                        +{lap.poin} Poin
                      </span>
                    </div>

                    {/* Foto Bukti Selfie (Rasio Potret 3:4) */}
                    <div className="relative bg-slate-900 aspect-[3/4] w-full overflow-hidden">
                      <img
                        src={formatDriveImageUrl(lap.fotoUrl)}
                        alt={lap.kegiatanNama}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-md font-semibold">
                        {lap.kegiatanNama}
                      </div>

                      {lap.status === 'APPROVED' && (
                        <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow">
                          <Check className="w-3 h-3" />
                          <span>Divalidasi</span>
                        </div>
                      )}
                    </div>

                    {/* Detail Laporan & Interaksi */}
                    <div className="px-3.5 pb-3.5 space-y-2.5 text-xs">
                      {/* Lokasi */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{lap.lokasiName}</span>
                      </div>

                      {/* Catatan Santri */}
                      {lap.catatanSantri && (
                        <p className="text-slate-700 text-xs leading-relaxed">
                          {lap.catatanSantri}
                        </p>
                      )}

                      {/* Catatan Musyrif jika ada */}
                      {lap.catatanPengurus && (
                        <div className="p-2 bg-teal-50 text-teal-900 rounded-xl border border-teal-200 text-[11px] leading-relaxed">
                          <strong>Bimbingan Musyrif:</strong> {lap.catatanPengurus}
                        </div>
                      )}

                      {/* Action Bar (Like & Comment) */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <button
                          onClick={() => toggleLike(lap.id, user?.id || 'musyrif')}
                          className={`flex items-center gap-1.5 text-xs font-bold transition ${
                            lap.isLikedByUser ? 'text-rose-600' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${lap.isLikedByUser ? 'fill-rose-600' : ''}`} />
                          <span>{lap.likesCount} Suka</span>
                        </button>

                        <button
                          onClick={() =>
                            setShowCommentBox((prev) => ({
                              ...prev,
                              [lap.id]: !prev[lap.id],
                            }))
                          }
                          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>{lap.comments?.length || 0} Komentar</span>
                        </button>
                      </div>

                      {/* Daftar Komentar */}
                      {lap.comments && lap.comments.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {lap.comments.map((comm) => (
                            <div key={comm.id} className="p-2 bg-slate-50 rounded-xl text-[11px] space-y-0.5">
                              <div className="flex items-center justify-between font-bold text-slate-800">
                                <span className="flex items-center gap-1">
                                  {comm.nama}
                                  {comm.role === 'MUSYRIF' && (
                                    <span className="text-[9px] bg-amber-200 text-amber-900 px-1 rounded font-bold">
                                      Musyrif
                                    </span>
                                  )}
                                </span>
                                <span className="text-[9px] text-slate-400 font-normal">{comm.waktu}</span>
                              </div>
                              <p className="text-slate-600">{comm.isi}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Input Komentar Musyrif */}
                      {showCommentBox[lap.id] && (
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Tulis pesan apresiasi / bimbingan musyrif..."
                            value={commentInput[lap.id] || ''}
                            onChange={(e) =>
                              setCommentInput((prev) => ({
                                ...prev,
                                [lap.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleMusyrifComment(lap.id);
                            }}
                            className="flex-1 text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleMusyrifComment(lap.id)}
                            className="px-3 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800 shadow-xs"
                          >
                            Kirim
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 4: GRAFIK & STATISTIK DISIPLIN */}
        {/* ============================================================= */}
        {activeTab === 'statistik' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-800">Tingkat Kedisiplinan Santri Binaan</h4>
                <span className="text-[10px] text-slate-400">Rata-rata 92%</span>
              </div>
              <div className="h-44 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kepatuhanData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="hari" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="hadir" fill="#0d9488" radius={[4, 4, 0, 0]} name="Laporan Valid" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 5: PROFIL MUSYRIF & PENGATURAN AKUN */}
        {/* ============================================================= */}
        {activeTab === 'profil' && (
          <div className="space-y-4">
            {/* Profile Header Card */}
            <div className="bg-gradient-to-br from-teal-900 via-slate-900 to-emerald-950 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden space-y-3">
              <div className="flex items-center gap-3.5">
                <div className="relative group shrink-0">
                  <img
                    src={user?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                    alt={user?.nama}
                    className="w-14 h-14 rounded-full object-cover border-2 border-amber-400 shadow"
                  />
                  <input
                    type="file"
                    ref={musyrifAvatarInputRef}
                    onChange={handleMusyrifAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => musyrifAvatarInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center shadow-md border-2 border-slate-900 transition active:scale-95"
                    title="Ganti Foto Profil Musyrif"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold truncate">{user?.nama}</h2>
                    <button
                      type="button"
                      onClick={() => musyrifAvatarInputRef.current?.click()}
                      className="text-[10px] font-bold text-amber-300 hover:text-amber-200 bg-amber-400/20 px-2 py-0.5 rounded-lg border border-amber-400/30 transition"
                    >
                      Ganti Foto
                    </button>
                  </div>
                  <div className="text-[11px] text-teal-200 font-medium truncate">
                    {user?.asrama || 'Musyrif PPTQ Batuan'}
                  </div>
                  <span className="inline-block mt-1 text-[9px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-400/40">
                    👑 Musyrif / Pembimbing
                  </span>
                </div>
              </div>

              {/* Ringkasan Statistik Singkat */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
                <div className="bg-white/10 p-2 rounded-2xl">
                  <div className="text-xs font-black text-amber-300">{mySantriBinaan.length}</div>
                  <div className="text-[9px] text-slate-300">Santri Binaan</div>
                </div>
                <div className="bg-white/10 p-2 rounded-2xl">
                  <div className="text-xs font-black text-emerald-300">{approvedLaporans.length}</div>
                  <div className="text-[9px] text-slate-300">Laporan Valid</div>
                </div>
                <div className="bg-white/10 p-2 rounded-2xl">
                  <div className="text-xs font-black text-teal-300">{kegiatanList.length}</div>
                  <div className="text-[9px] text-slate-300">Kegiatan Target</div>
                </div>
              </div>
            </div>

            {/* Form Edit Profil & Ganti PIN */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 pb-2 border-b border-slate-100">
                <Shield className="w-4 h-4 text-teal-700" />
                <span>Pengaturan Profil & Akun Login</span>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-2.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    required
                    value={profileForm.nama}
                    onChange={(e) => setProfileForm({ ...profileForm, nama: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Username Login</label>
                    <input
                      type="text"
                      required
                      value={profileForm.username}
                      onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Password / PIN</label>
                    <input
                      type="text"
                      required
                      value={profileForm.password}
                      onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp Musyrif</label>
                  <input
                    type="text"
                    required
                    value={profileForm.noHp}
                    onChange={(e) => setProfileForm({ ...profileForm, noHp: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 block">
                    Kelompok yang Dibina (PJ)
                  </span>
                  <p className="text-xs font-bold text-indigo-950 mt-0.5">
                    {kelompokList.filter((k) => k.musyrifId === user?.id).map((k) => k.nama).join(', ') || 'Belum Ditugaskan ke Kelompok'}
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow mt-1 flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan Profil</span>
                </button>
              </form>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={logout}
              className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Akun Musyrif</span>
            </button>
          </div>
        )}
      </main>

      {/* ============================================================= */}
      {/* BOTTOM NAVIGATION BAR */}
      {/* ============================================================= */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 max-w-md mx-auto z-40 px-2 py-1.5 shadow-lg">
        <div className="grid grid-cols-5 gap-1 text-center">
          <button
            onClick={() => setActiveTab('validasi')}
            className={`py-1.5 px-1 rounded-2xl transition flex flex-col items-center gap-0.5 relative ${
              activeTab === 'validasi'
                ? 'bg-teal-50 text-teal-800 font-extrabold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle className={`w-4 h-4 ${activeTab === 'validasi' ? 'text-teal-700 stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">Validasi</span>
            {pendingLaporans.length > 0 && (
              <span className="absolute top-0.5 right-2.5 w-3.5 h-3.5 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow">
                {pendingLaporans.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('santri')}
            className={`py-1.5 px-1 rounded-2xl transition flex flex-col items-center gap-0.5 ${
              activeTab === 'santri'
                ? 'bg-teal-50 text-teal-800 font-extrabold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === 'santri' ? 'text-teal-700 stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">Binaan</span>
          </button>

          <button
            onClick={() => setActiveTab('feed')}
            className={`py-1.5 px-1 rounded-2xl transition flex flex-col items-center gap-0.5 ${
              activeTab === 'feed'
                ? 'bg-teal-50 text-teal-800 font-extrabold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Newspaper className={`w-4 h-4 ${activeTab === 'feed' ? 'text-teal-700 stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('statistik')}
            className={`py-1.5 px-1 rounded-2xl transition flex flex-col items-center gap-0.5 ${
              activeTab === 'statistik'
                ? 'bg-teal-50 text-teal-800 font-extrabold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className={`w-4 h-4 ${activeTab === 'statistik' ? 'text-teal-700 stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">Disiplin</span>
          </button>

          <button
            onClick={() => setActiveTab('profil')}
            className={`py-1.5 px-1 rounded-2xl transition flex flex-col items-center gap-0.5 ${
              activeTab === 'profil'
                ? 'bg-teal-50 text-teal-800 font-extrabold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className={`w-4 h-4 ${activeTab === 'profil' ? 'text-teal-700 stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">Profil</span>
          </button>
        </div>
      </nav>

      {/* ============================================================= */}
      {/* MODAL 1: KONFIRMASI PERSETUJUAN LAPORAN (APPROVE + WA) */}
      {/* ============================================================= */}
      {approveModal.isOpen && approveModal.laporan && approveModal.santri && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800">Setujui Laporan Kegiatan</h3>
                  <p className="text-[10px] text-slate-400">+{approveModal.laporan.poin} Poin untuk Santri</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApproveModal((prev) => ({ ...prev, isOpen: false }))}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 text-xs">
              {/* Santri Card */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{approveModal.santri.nama}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    +{approveModal.laporan.poin} Poin
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  📖 {approveModal.laporan.kegiatanNama} • 📱 {approveModal.santri.noHp}
                </div>
              </div>

              {/* Input Catatan Apresiasi / Bimbingan */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan Apresiasi Musyrif (Opsional):
                </label>
                <input
                  type="text"
                  value={approveModal.catatan}
                  onChange={(e) => handleUpdateApproveCatatan(e.target.value)}
                  placeholder="Contoh: Mumtaz! Terus pertahankan hafalannya..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 shadow-2xs font-medium"
                />
              </div>

              {/* Preview Draft Pesan WA */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Draft Pesan Notifikasi WhatsApp:
                  </label>
                  <span className="text-[9px] text-slate-400">Siap dikirim ke Santri</span>
                </div>
                <textarea
                  rows={6}
                  value={approveModal.message}
                  onChange={(e) =>
                    setApproveModal((prev) => ({ ...prev, message: e.target.value }))
                  }
                  className="w-full text-[11px] p-2.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 leading-relaxed shadow-2xs"
                ></textarea>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={handleConfirmApproveWithWA}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow flex items-center justify-center gap-2 transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Setujui & Kirim via WhatsApp Santri</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const success = await copyMessageToClipboard(approveModal.message);
                    if (success) {
                      setApproveModal((prev) => ({ ...prev, copied: true }));
                      setTimeout(() => {
                        setApproveModal((prev) => ({ ...prev, copied: false }));
                      }, 2500);
                    }
                  }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{approveModal.copied ? '✓ Tersalin!' : 'Salin Pesan'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmApproveOnly}
                  className="flex-1 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs rounded-xl transition"
                >
                  Setujui Saja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: TOLAK LAPORAN + CATATAN EVALUASI WHATSAPP */}
      {/* ============================================================= */}
      {rejectModal.isOpen && rejectModal.laporan && rejectModal.santri && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-800">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <XCircle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800">Tolak Laporan Santri</h3>
                  <p className="text-[10px] text-slate-400">Kirim instruksi perbaikan via WhatsApp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectModal((prev) => ({ ...prev, isOpen: false }))}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 text-xs">
              <div className="p-3 bg-rose-50/70 rounded-2xl border border-rose-200">
                <div className="font-bold text-slate-800">{rejectModal.santri.nama}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  📖 {rejectModal.laporan.kegiatanNama} • 📱 {rejectModal.santri.noHp}
                </div>
              </div>

              {/* Input Alasan Penolakan */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Alasan Penolakan / Catatan Evaluasi:
                </label>
                <textarea
                  rows={2}
                  value={rejectModal.alasan}
                  onChange={(e) => handleUpdateRejectAlasan(e.target.value)}
                  placeholder="Tuliskan alasan penolakan agar santri dapat memperbaikinya..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 font-medium"
                ></textarea>
              </div>

              {/* Preview Draft Pesan WA */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Draft Pesan Evaluasi WhatsApp:
                  </label>
                  <span className="text-[9px] text-slate-400">Dapat diedit</span>
                </div>
                <textarea
                  rows={6}
                  value={rejectModal.message}
                  onChange={(e) =>
                    setRejectModal((prev) => ({ ...prev, message: e.target.value }))
                  }
                  className="w-full text-[11px] p-2.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono text-slate-800 focus:ring-2 focus:ring-rose-500 leading-relaxed shadow-2xs"
                ></textarea>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={handleConfirmRejectWithWA}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow flex items-center justify-center gap-2 transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Tolak & Kirim Evaluasi via WhatsApp</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const success = await copyMessageToClipboard(rejectModal.message);
                    if (success) {
                      setRejectModal((prev) => ({ ...prev, copied: true }));
                      setTimeout(() => {
                        setRejectModal((prev) => ({ ...prev, copied: false }));
                      }, 2500);
                    }
                  }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{rejectModal.copied ? '✓ Tersalin!' : 'Salin Pesan'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmRejectOnly}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-rose-700 font-bold text-xs rounded-xl transition"
                >
                  Tolak Saja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 3: KONFIRMASI TEGURAN KEDISIPLINAN WHATSAPP */}
      {/* ============================================================= */}
      {isTeguranModalOpen && teguranTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <MessageCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800">Teguran Kedisiplinan</h3>
                  <p className="text-[10px] text-slate-400">Kirim teguran manual via WhatsApp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTeguranModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 text-xs">
              <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200">
                <div className="font-bold text-slate-800">{teguranTarget.santri.nama}</div>
                <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                  📱 {teguranTarget.santri.noHp} • {teguranTarget.santri.asrama}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Draft Pesan Teguran (Dapat Diedit):
                  </label>
                  <span className="text-[9px] text-slate-400">Otomatis rincian tugas</span>
                </div>
                <textarea
                  rows={9}
                  value={teguranTarget.customMessage}
                  onChange={(e) =>
                    setTeguranTarget({ ...teguranTarget, customMessage: e.target.value })
                  }
                  className="w-full text-[11px] p-2.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono text-slate-800 focus:ring-2 focus:ring-amber-500 leading-relaxed shadow-2xs"
                ></textarea>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={handleOpenWhatsAppWeb}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow flex items-center justify-center gap-2 transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka WhatsApp & Kirim Pesan Teguran</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const success = await copyMessageToClipboard(teguranTarget.customMessage);
                    if (success) {
                      setTeguranTarget((prev) => (prev ? { ...prev, copied: true } : null));
                      setTimeout(() => {
                        setTeguranTarget((prev) => (prev ? { ...prev, copied: false } : null));
                      }, 2500);
                    }
                  }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{teguranTarget.copied ? '✓ Tersalin!' : 'Salin Pesan'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsTeguranModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INTIP FOTO BUKTI */}
      {previewFotoUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-3 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b">
              <span className="text-xs font-bold text-slate-800 truncate">{previewFotoUrl.title}</span>
              <button
                onClick={() => setPreviewFotoUrl(null)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden aspect-[3/4] bg-slate-900">
              <img src={previewFotoUrl.url} alt="Bukti Foto" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
