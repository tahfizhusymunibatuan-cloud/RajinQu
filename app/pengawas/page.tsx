'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Users,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Search,
  Filter,
  MessageCircle,
  Eye,
  LogOut,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertCircle,
  XCircle,
  UserCheck,
  TrendingUp,
  Award,
  BookOpen,
  Send,
  Heart,
  MessageSquare,
  Copy,
  Smartphone,
  Check,
  Building2,
  Newspaper,
  Layers,
  BarChart3
} from 'lucide-react';
import {
  openWhatsAppDirect,
  copyMessageToClipboard,
  formatPhoneNumber,
  getWhatsAppUrl
} from '@/lib/whatsapp';
import { formatDriveImageUrl } from '@/lib/google-drive';

export default function PengawasPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const {
    laporanList,
    allUsers,
    santriList,
    musyrifList,
    kegiatanList,
    kelompokList,
    activePeriode,
    toggleLike,
    addComment,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'laporan' | 'santri' | 'feed' | 'musyrif' | 'profil'>('laporan');
  const [selectedHalaqoh, setSelectedHalaqoh] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedCategoryFilter, setFeedCategoryFilter] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Detail Modal for Inspection
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    laporan: any | null;
  }>({
    isOpen: false,
    laporan: null,
  });

  // WhatsApp Inquiry / Reminder Modal
  const [waInquiryModal, setWaInquiryModal] = useState<{
    isOpen: boolean;
    targetName: string;
    targetPhone: string;
    targetRole: 'SANTRI' | 'MUSYRIF';
    roleDesc: string;
    message: string;
    copied: boolean;
  }>({
    isOpen: false,
    targetName: '',
    targetPhone: '',
    targetRole: 'SANTRI',
    roleDesc: '',
    message: '',
    copied: false,
  });

  // Comment input state per laporan
  const [commentInput, setCommentInput] = useState<{ [key: string]: string }>({});

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, mounted, router]);

  if (!mounted || isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Extract unique kelompok / asrama / halaqoh list
  const halaqohList = Array.from(
    new Set(
      kelompokList
        .map((k) => k.nama)
        .concat(santriList.map((s) => s.kelompokNama || '').filter(Boolean))
        .concat(musyrifList.map((m) => m.asrama || '').filter(Boolean))
    )
  ).filter(Boolean) as string[];

  // Filtered Laporan across ALL santri (Memoized)
  const filteredLaporan = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return laporanList.filter((lap) => {
      const santriObj = santriList.find((s) => s.id === lap.userId || s.nama === lap.userNama);
      const matchHalaqoh =
        selectedHalaqoh === 'ALL' ||
        lap.userAsrama === selectedHalaqoh ||
        santriObj?.kelompokNama === selectedHalaqoh;
      const matchStatus = selectedStatus === 'ALL' || lap.status === selectedStatus;
      const matchSearch =
        query === '' ||
        lap.userNama.toLowerCase().includes(query) ||
        lap.kegiatanNama.toLowerCase().includes(query) ||
        (santriObj?.kelompokNama && santriObj.kelompokNama.toLowerCase().includes(query)) ||
        lap.userAsrama.toLowerCase().includes(query);
      return matchHalaqoh && matchStatus && matchSearch;
    });
  }, [laporanList, santriList, selectedHalaqoh, selectedStatus, searchQuery]);

  // Filtered Santri across ALL halaqoh (Memoized)
  const filteredSantri = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return santriList.filter((s) => {
      const matchHalaqoh =
        selectedHalaqoh === 'ALL' ||
        s.kelompokNama === selectedHalaqoh ||
        s.asrama === selectedHalaqoh;
      const matchSearch =
        query === '' ||
        s.nama.toLowerCase().includes(query) ||
        (s.kelompokNama && s.kelompokNama.toLowerCase().includes(query)) ||
        s.username.toLowerCase().includes(query);
      return matchHalaqoh && matchSearch;
    });
  }, [santriList, selectedHalaqoh, searchQuery]);

  // Feed Laporan (all approved reports for oversight & moderation) (Memoized)
  const feedLaporans = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return laporanList.filter((lap) => {
      const matchCat = feedCategoryFilter === 'ALL' || lap.kategori === feedCategoryFilter;
      const matchSearch =
        query === '' ||
        lap.userNama.toLowerCase().includes(query) ||
        lap.kegiatanNama.toLowerCase().includes(query);
      return matchCat && matchSearch;
    });
  }, [laporanList, feedCategoryFilter, searchQuery]);

  // KPI Metrics (Memoized)
  const totalPending = useMemo(() => laporanList.filter((l) => l.status === 'PENDING').length, [laporanList]);
  const totalApproved = useMemo(() => laporanList.filter((l) => l.status === 'APPROVED').length, [laporanList]);
  const totalRejected = useMemo(() => laporanList.filter((l) => l.status === 'REJECTED').length, [laporanList]);

  const handleSendComment = (laporanId: string) => {
    const text = commentInput[laporanId];
    if (text && user) {
      addComment(laporanId, user, `[Catatan Pengawas] ${text}`);
      setCommentInput({ ...commentInput, [laporanId]: '' });
    }
  };

  const handleOpenSantriInquiry = (santri: any) => {
    const msg =
      `*PEMBERITAHUAN PENGAWAS KESANTRIAN - RAJINQU*\n\n` +
      `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n` +
      `Ananda *${santri.nama}* (${santri.asrama || 'Santri'}),\n\n` +
      `Semoga ananda senantiasa dalam lindungan Allah SWT dan istiqomah menjalankan rutinitas ibadah liburan.\n\n` +
      `Berdasarkan pantauan sistem Pengawasan Kesantrian RajinQU:\n` +
      `• Total Poin: *${santri.totalPoin} Poin*\n` +
      `• Peringkat Saat Ini: *#${santri.peringkat || '-'}*\n` +
      `• Pembimbing: *${santri.musyrifNama || 'Ustadz Pembina'}*\n\n` +
      `Mohon agar senantiasa tertib dan tepat waktu mengunggah laporan harian.\n\n` +
      `Jazakumullah Khairan,\n` +
      `*${user?.nama || 'Ustadz Pengawas Kesantrian'}*\n` +
      `_Pengawas Utama Kesantrian PTQA Batuan_`;

    setWaInquiryModal({
      isOpen: true,
      targetName: santri.nama,
      targetPhone: santri.noHp,
      targetRole: 'SANTRI',
      roleDesc: santri.asrama || 'Santri Pondok',
      message: msg,
      copied: false,
    });
  };

  const handleOpenMusyrifReminder = (musyrif: any, pendingCount: number) => {
    const msg =
      `*KOORDINASI PENGAWAS KESANTRIAN - RAJINQU*\n\n` +
      `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n` +
      `Ustadz *${musyrif.nama}* (${musyrif.asrama || 'Musyrif Pembina'}),\n\n` +
      `Semoga Ustadz senantiasa dalam keadaan sehat dan berkah dalam membina para santri.\n\n` +
      `Berdasarkan pantauan dashboard Pengawas RajinQU hari ini:\n` +
      `• Terdapat *${pendingCount} laporan santri binaan* yang masih menunggu validasi di halaqoh Ustadz.\n\n` +
      `Mohon perkenan Ustadz untuk meninjau dan memvalidasi laporan santri binaan agar poin santri dapat segera terakumulasi.\n\n` +
      `Terima kasih atas dedikasi dan bimbingan Ustadz.\n\n` +
      `Salam ta'dzim,\n` +
      `*${user?.nama || 'Ustadz Pengawas Kesantrian'}*\n` +
      `_Pengawas Utama Kesantrian PTQA Batuan_`;

    setWaInquiryModal({
      isOpen: true,
      targetName: musyrif.nama,
      targetPhone: musyrif.noHp,
      targetRole: 'MUSYRIF',
      roleDesc: musyrif.asrama || 'Musyrif Pembina',
      message: msg,
      copied: false,
    });
  };

  return (
    <div className="app-mobile-container bg-slate-50 min-h-screen pb-24 shadow-xl border-x border-slate-200">
      
      {/* ============================================================= */}
      {/* TOP HEADER PENGAWAS */}
      {/* ============================================================= */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white px-4 py-3.5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center border border-amber-300/60 shadow-sm shrink-0">
              <img
                src="/logo-pondok.png"
                alt="Logo PPTQ Al-Usymuni"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight">Rajin<span className="text-amber-400">Qu</span></span>
                <span className="text-[10px] bg-sky-400/20 text-sky-300 px-1.5 py-0.5 rounded-full font-bold border border-sky-400/30">
                  Pengawas
                </span>
              </div>
              <p className="text-[11px] text-teal-200 font-medium truncate max-w-[200px]">
                {user?.nama || 'Pengawas Kesantrian'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-sky-400/20 border border-sky-400/30 text-sky-300 px-2.5 py-1 rounded-full text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Semua Santri</span>
            </div>

            <button
              onClick={logout}
              title="Keluar"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-teal-200 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="p-3.5 space-y-3.5">
        
        {/* ============================================================= */}
        {/* TAB 1: PANTAU SEMUA LAPORAN (READ-ONLY MONITORING) */}
        {/* ============================================================= */}
        {activeTab === 'laporan' && (
          <div className="space-y-3.5">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-xs">
                <div className="text-[10px] font-bold text-amber-700">Menunggu Validasi</div>
                <div className="text-lg font-black text-amber-900 mt-0.5">{totalPending}</div>
                <div className="text-[9px] text-slate-400">Tugas Musyrif</div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-emerald-200 shadow-xs">
                <div className="text-[10px] font-bold text-emerald-700">Telah Disetujui</div>
                <div className="text-lg font-black text-emerald-900 mt-0.5">{totalApproved}</div>
                <div className="text-[9px] text-slate-400">Valid & Dinilai</div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-rose-200 shadow-xs">
                <div className="text-[10px] font-bold text-rose-700">Ditolak / Revisi</div>
                <div className="text-lg font-black text-rose-900 mt-0.5">{totalRejected}</div>
                <div className="text-[9px] text-slate-400">Evaluasi Musyrif</div>
              </div>
            </div>

            {/* Banner Peran Pengawas */}
            <div className="p-3 bg-gradient-to-r from-sky-900 to-teal-950 text-white rounded-2xl text-xs space-y-1 shadow-sm">
              <div className="font-bold flex items-center gap-1.5 text-sky-200">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Pengawasan Menyeluruh Seluruh Santri</span>
              </div>
              <p className="text-[11px] text-sky-100/90 leading-relaxed">
                Pengawas memantau kualitas seluruh laporan santri dari semua halaqoh/asrama. Wewenang validasi persetujuan poin tetap berada pada Musyrif Penanggung Jawab.
              </p>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2.5 shadow-xs">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama santri, kegiatan, atau halaqoh..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Filter Kelompok:</label>
                  <select
                    value={selectedHalaqoh}
                    onChange={(e) => setSelectedHalaqoh(e.target.value)}
                    className="w-full text-[11px] p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="ALL">Semua Kelompok ({santriList.length} Santri)</option>
                    {halaqohList.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Status Validasi:</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as any)}
                    className="w-full text-[11px] p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="ALL">Semua Status ({laporanList.length})</option>
                    <option value="PENDING">Menunggu Validasi ({totalPending})</option>
                    <option value="APPROVED">Disetujui ({totalApproved})</option>
                    <option value="REJECTED">Ditolak ({totalRejected})</option>
                  </select>
                </div>
              </div>
            </div>

            {/* List Laporan Santri */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Daftar Laporan Terpantau ({filteredLaporan.length})
                </h3>
                <span className="text-[10px] text-slate-400">Lintas Seluruh Halaqoh</span>
              </div>

              {filteredLaporan.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-1">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300" />
                  <div className="text-xs font-bold text-slate-700">Tidak ada laporan yang sesuai filter.</div>
                  <p className="text-[11px]">Coba ubah kata kunci pencarian atau filter halaqoh.</p>
                </div>
              ) : (
                filteredLaporan.map((lap) => {
                  const santri = allUsers.find((u) => u.id === lap.userId || u.nama === lap.userNama);
                  const musyrif =
                    allUsers.find((u) => u.id === santri?.musyrifId || u.nama === santri?.musyrifNama) ||
                    musyrifList[0];

                  return (
                    <div
                      key={lap.id}
                      className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-3 hover:border-sky-300 transition"
                    >
                      {/* Header Card: Santri Info + Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={lap.userAvatar}
                            alt={lap.userNama}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">{lap.userNama}</div>
                            <div className="text-[10px] text-slate-500 truncate">{lap.userAsrama}</div>
                            <div className="text-[9px] text-teal-800 font-semibold mt-0.5">
                              Pembimbing: {santri?.musyrifNama || musyrif?.nama || 'Ustadz Pembina'}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 text-right">
                          {lap.status === 'PENDING' && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Menunggu Musyrif
                            </span>
                          )}
                          {lap.status === 'APPROVED' && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Disetujui (+{lap.poin} Poin)
                            </span>
                          )}
                          {lap.status === 'REJECTED' && (
                            <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 inline-flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Ditolak Musyrif
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content Preview: Kegiatan + Bukti Foto + GPS */}
                      <div className="bg-slate-50 p-2.5 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{lap.kegiatanNama}</span>
                          <span className="text-[10px] font-bold text-teal-700 bg-white px-2 py-0.5 rounded border border-teal-200">
                            {lap.poin} Poin
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed italic">
                          "{lap.catatanSantri || 'Melaksanakan kegiatan dengan tertib.'}"
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{lap.waktuLaporWIB || lap.createdAt}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-semibold text-[9px] ${
                                lap.statusWaktu === 'TEPAT_WAKTU'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {lap.statusWaktu === 'TEPAT_WAKTU' ? 'Tepat Waktu' : 'Terlambat'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 truncate max-w-[140px]">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            <span className="truncate">{lap.lokasiName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Catatan Musyrif jika ada */}
                      {lap.catatanPengurus && (
                        <div className="p-2 bg-teal-50/70 rounded-xl border border-teal-200/80 text-[11px] text-teal-900">
                          <span className="font-bold">Catatan Musyrif: </span>
                          <span>{lap.catatanPengurus}</span>
                        </div>
                      )}

                      {/* Actions Strip: Lihat Detail & Hubungi */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => setDetailModal({ isOpen: true, laporan: lap })}
                          className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-800 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspeksi Bukti Foto</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenSantriInquiry(santri || { nama: lap.userNama, noHp: '08123456789', asrama: lap.userAsrama })}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Hubungi Santri</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 2: SEMUA SANTRI BINAAN (MASTER DIRECTORY) */}
        {/* ============================================================= */}
        {activeTab === 'santri' && (
          <div className="space-y-3.5">
            {/* Header & Filter */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Direktori Seluruh Santri ({filteredSantri.length})
                  </h3>
                  <p className="text-[10px] text-slate-500">Pantau poin, peringkat & kedisiplinan lintas halaqoh</p>
                </div>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari santri berdasarkan nama atau NIS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <select
                  value={selectedHalaqoh}
                  onChange={(e) => setSelectedHalaqoh(e.target.value)}
                  className="w-full text-[11px] p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="ALL">Semua Halaqoh ({santriList.length} Santri)</option>
                  {halaqohList.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* List Santri Cards */}
            <div className="space-y-2.5">
              {filteredSantri.map((santri) => {
                const approvedCount = laporanList.filter(
                  (l) => (l.userId === santri.id || l.userNama === santri.nama) && l.status === 'APPROVED'
                ).length;

                return (
                  <div
                    key={santri.id}
                    className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs space-y-2.5 hover:border-sky-300 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={santri.avatarUrl}
                          alt={santri.nama}
                          className="w-11 h-11 rounded-full object-cover border-2 border-sky-400/40 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{santri.nama}</div>
                          <div className="text-[10px] text-slate-500 truncate">
                            NIS: <span className="font-mono font-bold">{santri.username}</span>
                          </div>
                          {santri.kelompokNama && (
                            <div className="mt-0.5">
                              <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded-md">
                                {santri.kelompokNama}
                              </span>
                            </div>
                          )}
                          <div className="text-[9px] text-teal-800 font-semibold mt-0.5">
                            Pembimbing: {santri.musyrifNama || 'Belum Ditugaskan'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                          {santri.totalPoin} Poin
                        </div>
                        <div className="text-[9px] text-amber-600 font-bold mt-1">
                          Peringkat #{santri.peringkat || '-'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500">
                        Total {approvedCount} Laporan Disetujui
                      </span>

                      <button
                        type="button"
                        onClick={() => handleOpenSantriInquiry(santri)}
                        className="inline-flex items-center gap-1 font-bold text-xs text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Kirim WA Pengawas</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 3: FEED PENGAWASAN & MODERASI KONTEN */}
        {/* ============================================================= */}
        {activeTab === 'feed' && (
          <div className="space-y-3.5">
            {/* Header Feed */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Feed Pengawasan & Moderasi
                  </h3>
                  <p className="text-[10px] text-slate-500">Pantau bukti foto kegiatan santri untuk mencegah laporan palsu/tidak pantas</p>
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex gap-1 overflow-x-auto pb-1 text-[11px] font-bold">
                {['ALL', 'IBADAH', 'BELAJAR', 'MANDIRI', 'SOSIAL'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFeedCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl shrink-0 transition ${
                      feedCategoryFilter === cat
                        ? 'bg-sky-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'Semua Kategori' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Feed Cards */}
            <div className="space-y-4">
              {feedLaporans.map((lap) => (
                <div
                  key={lap.id}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm space-y-3 p-3.5"
                >
                  {/* Author Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={lap.userAvatar}
                        alt={lap.userNama}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">{lap.userNama}</div>
                        <div className="text-[10px] text-slate-500">{lap.userAsrama}</div>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                      {lap.kategori}
                    </span>
                  </div>

                  {/* Activity Title & Image */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{lap.kegiatanNama}</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      {lap.catatanSantri}
                    </p>
                  </div>

                  <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-100 max-h-80 flex items-center justify-center">
                    <img
                      src={formatDriveImageUrl(lap.fotoUrl)}
                      alt={lap.kegiatanNama}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Meta Bar */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{lap.waktuLaporWIB || lap.createdAt}</span>
                    </div>

                    <div className="flex items-center gap-1 truncate max-w-[170px]">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="truncate">{lap.lokasiName}</span>
                    </div>
                  </div>

                  {/* Pengawas Comment / Notes Box */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    {/* List Existing Comments */}
                    {lap.comments && lap.comments.length > 0 && (
                      <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-2xl">
                        {lap.comments.map((c) => (
                          <div key={c.id} className="text-[11px] text-slate-700 leading-snug">
                            <span className="font-bold text-slate-900">{c.nama}: </span>
                            <span>{c.isi}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Beri catatan pengawasan / bimbingan..."
                        value={commentInput[lap.id] || ''}
                        onChange={(e) =>
                          setCommentInput({ ...commentInput, [lap.id]: e.target.value })
                        }
                        className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendComment(lap.id)}
                        className="px-3 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl font-bold text-xs flex items-center justify-center transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 4: MONITORING KINERJA & BEBAN KERJA MUSYRIF */}
        {/* ============================================================= */}
        {activeTab === 'musyrif' && (
          <div className="space-y-3.5">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Monitoring Beban Kerja Musyrif ({musyrifList.length})
              </h3>
              <p className="text-[10px] text-slate-500">
                Memastikan setiap Musyrif aktif memvalidasi laporan santri binaan di halaqohnya
              </p>
            </div>

            <div className="space-y-3">
              {musyrifList.map((musyrif) => {
                const binaanSantri = santriList.filter(
                  (s) => s.musyrifId === musyrif.id || s.musyrifNama === musyrif.nama
                );

                const halaqohLaporans = laporanList.filter((l) =>
                  binaanSantri.some((s) => s.id === l.userId || s.nama === l.userNama)
                );

                const pendingHalaqoh = halaqohLaporans.filter((l) => l.status === 'PENDING').length;
                const approvedHalaqoh = halaqohLaporans.filter((l) => l.status === 'APPROVED').length;

                return (
                  <div
                    key={musyrif.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 hover:border-sky-300 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={musyrif.avatarUrl}
                          alt={musyrif.nama}
                          className="w-12 h-12 rounded-full object-cover border-2 border-amber-400/40 shrink-0"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{musyrif.nama}</div>
                          <div className="text-[10px] text-slate-500">{musyrif.asrama || 'Musyrif Pembina'}</div>
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">📱 {musyrif.noHp}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenMusyrifReminder(musyrif, pendingHalaqoh)}
                        className="inline-flex items-center gap-1 font-bold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Kirim WA</span>
                      </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs">
                      <div>
                        <div className="text-[10px] text-slate-500">Santri Binaan</div>
                        <div className="text-sm font-black text-slate-800 mt-0.5">{binaanSantri.length}</div>
                      </div>

                      <div>
                        <div className="text-[10px] text-emerald-600 font-semibold">Tervalidasi</div>
                        <div className="text-sm font-black text-emerald-800 mt-0.5">{approvedHalaqoh}</div>
                      </div>

                      <div>
                        <div className="text-[10px] text-amber-600 font-semibold">Pending Validasi</div>
                        <div className="text-sm font-black text-amber-800 mt-0.5">{pendingHalaqoh}</div>
                      </div>
                    </div>

                    {pendingHalaqoh > 0 ? (
                      <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-900 flex items-center justify-between">
                        <span>⚠️ Ada {pendingHalaqoh} laporan santri menunggu validasi.</span>
                        <button
                          type="button"
                          onClick={() => handleOpenMusyrifReminder(musyrif, pendingHalaqoh)}
                          className="font-bold text-amber-900 underline"
                        >
                          Ingatkan Musyrif
                        </button>
                      </div>
                    ) : (
                      <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-[10px] text-emerald-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Semua laporan halaqoh ini telah tuntas divalidasi.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* TAB 5: PROFIL PENGAWAS & RINGKASAN PONDOK */}
        {/* ============================================================= */}
        {activeTab === 'profil' && (
          <div className="space-y-3.5">
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={user?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'}
                  alt={user?.nama}
                  className="w-14 h-14 rounded-full object-cover border-2 border-sky-500/50"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{user?.nama}</h3>
                  <p className="text-xs text-slate-500">Koordinator / Pengawas Utama Kesantrian</p>
                  <span className="text-[10px] font-bold bg-sky-50 text-sky-800 px-2 py-0.5 rounded border border-sky-200 mt-1 inline-block">
                    PTQA AL-USYMUNI BATUAN
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-semibold">Total Seluruh Santri</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">{santriList.length} Santri</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-semibold">Total Musyrif Pembina</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">{musyrifList.length} Musyrif</div>
                </div>
              </div>

              <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100/70 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1">
                <div className="font-bold flex items-center justify-between">
                  <span>Periode Aktif: {activePeriode?.nama}</span>
                  <span className="text-[10px] bg-amber-200 px-2 py-0.5 rounded font-black">
                    Target {activePeriode?.targetPoin || 400} Poin
                  </span>
                </div>
                <p className="text-[11px] text-amber-800">
                  {activePeriode?.deskripsiReward || 'Sertifikat penghargaan santri berprestasi.'}
                </p>
              </div>

              <button
                type="button"
                onClick={logout}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center justify-center gap-1.5 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Akun Pengawas</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================= */}
      {/* BOTTOM NAVBAR PENGAWAS */}
      {/* ============================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-3 py-2">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1 text-center">
          <button
            type="button"
            onClick={() => setActiveTab('laporan')}
            className={`py-1.5 px-1 rounded-2xl transition flex flex-col items-center gap-0.5 ${
              activeTab === 'laporan'
                ? 'bg-sky-50 text-sky-800 font-extrabold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className={`w-4 h-4 ${activeTab === 'laporan' ? 'text-sky-700 stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">Laporan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('santri')}
            className={`py-1.5 px-1 rounded-2xl transition flex flex-col items-center gap-0.5 ${
              activeTab === 'santri'
                ? 'bg-sky-50 text-sky-800 font-extrabold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === 'santri' ? 'text-sky-700 stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">Semua Santri</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('feed')}
            className={`py-1.5 px-1 rounded-2xl transition flex flex-col items-center gap-0.5 ${
              activeTab === 'feed'
                ? 'bg-sky-50 text-sky-800 font-extrabold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Newspaper className={`w-4 h-4 ${activeTab === 'feed' ? 'text-sky-700 stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">Feed</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('musyrif')}
            className={`py-1.5 px-1 rounded-2xl transition flex flex-col items-center gap-0.5 ${
              activeTab === 'musyrif'
                ? 'bg-sky-50 text-sky-800 font-extrabold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className={`w-4 h-4 ${activeTab === 'musyrif' ? 'text-sky-700 stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">Musyrif</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profil')}
            className={`py-1.5 px-1 rounded-2xl transition flex flex-col items-center gap-0.5 ${
              activeTab === 'profil'
                ? 'bg-sky-50 text-sky-800 font-extrabold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${activeTab === 'profil' ? 'text-sky-700 stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">Profil</span>
          </button>
        </div>
      </nav>

      {/* ============================================================= */}
      {/* MODAL 1: INSPEKSI BUKTI FOTO LAPORAN */}
      {/* ============================================================= */}
      {detailModal.isOpen && detailModal.laporan && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
                  <Eye className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800">Inspeksi Laporan Santri</h3>
                  <p className="text-[10px] text-slate-400">Pengawasan Mutu & Bukti Kegiatan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModal({ isOpen: false, laporan: null })}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 text-xs">
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
                <img
                  src={detailModal.laporan.userAvatar}
                  alt={detailModal.laporan.userNama}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <div className="font-bold text-slate-900">{detailModal.laporan.userNama}</div>
                  <div className="text-[10px] text-slate-500">{detailModal.laporan.userAsrama}</div>
                </div>
              </div>

              {/* Bukti Foto Kegiatan */}
              <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 max-h-72 flex items-center justify-center">
                <img
                  src={formatDriveImageUrl(detailModal.laporan.fotoUrl)}
                  alt={detailModal.laporan.kegiatanNama}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5">
                <div className="flex justify-between items-center font-bold text-slate-800">
                  <span>{detailModal.laporan.kegiatanNama}</span>
                  <span className="text-teal-700">+{detailModal.laporan.poin} Poin</span>
                </div>
                <p className="text-[11px] text-slate-600 italic">
                  "{detailModal.laporan.catatanSantri}"
                </p>
                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200">
                  <span>⏰ {detailModal.laporan.waktuLaporWIB || detailModal.laporan.createdAt}</span>
                  <span className="font-semibold text-rose-600">📍 {detailModal.laporan.lokasiName}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailModal({ isOpen: false, laporan: null })}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Tutup Inspeksi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL 2: WHATSAPP INQUIRY / REMINDER MODAL */}
      {/* ============================================================= */}
      {waInquiryModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800">
                    {waInquiryModal.targetRole === 'SANTRI' ? 'Komunikasi Santri' : 'Koordinasi Musyrif'}
                  </h3>
                  <p className="text-[10px] text-slate-400">Pengawasan Langsung via WhatsApp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaInquiryModal((prev) => ({ ...prev, isOpen: false }))}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 text-xs">
              <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200">
                <div className="font-bold text-slate-900">{waInquiryModal.targetName}</div>
                <div className="text-[10px] text-slate-600 font-mono mt-0.5">
                  📱 {waInquiryModal.targetPhone} • {waInquiryModal.roleDesc}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Draft Pesan WhatsApp (Dapat Diedit):
                  </label>
                  <span className="text-[9px] text-slate-400">Resmi Pengawas</span>
                </div>
                <textarea
                  rows={9}
                  value={waInquiryModal.message}
                  onChange={(e) =>
                    setWaInquiryModal((prev) => ({ ...prev, message: e.target.value }))
                  }
                  className="w-full text-[11px] p-2.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 leading-relaxed shadow-2xs"
                ></textarea>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={() => {
                  openWhatsAppDirect(waInquiryModal.targetPhone, waInquiryModal.message);
                  setWaInquiryModal((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow flex items-center justify-center gap-2 transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka WhatsApp & Kirim Pesan</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const success = await copyMessageToClipboard(waInquiryModal.message);
                  if (success) {
                    setWaInquiryModal((prev) => ({ ...prev, copied: true }));
                    setTimeout(() => {
                      setWaInquiryModal((prev) => ({ ...prev, copied: false }));
                    }, 2500);
                  }
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{waInquiryModal.copied ? '✓ Pesan Berhasil Disalin!' : 'Salin Draft Pesan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
