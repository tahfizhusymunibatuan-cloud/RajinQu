'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Building2,
  Users,
  BookOpen,
  Calendar,
  Download,
  Plus,
  Edit,
  Trash2,
  Sparkles,
  LogOut,
  Save,
  CheckCircle2,
  UserCheck,
  GraduationCap,
  Link as LinkIcon,
  Phone,
  Lock,
  UserPlus,
  Home,
  Award,
  ChevronRight,
  AlertCircle,
  Clock,
  Search,
  Layers,
  FolderTree,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Database,
  RefreshCw,
} from 'lucide-react';
import { MOCK_REWARD_PERIODE, MockKegiatan, MockKelompok } from '@/lib/mock-data';
import VacationCountdownBanner from '@/components/VacationCountdownBanner';

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const {
    kegiatanList,
    allUsers,
    santriList,
    musyrifList,
    pengawasList,
    laporanList,
    kelompokList,
    activePeriode,
    isLoadingDb,
    syncFromDatabase,
    addMusyrif,
    addPengawas,
    addSantri,
    updateSantriMusyrif,
    updateUser,
    deleteUser,
    addKegiatan,
    updateKegiatanPoin,
    toggleKegiatanWajib,
    updateKegiatanTime,
    deleteKegiatan,
    periodeList,
    addPeriode,
    updatePeriode,
    togglePeriodeActive,
    deletePeriode,
    addKelompok,
    updateKelompok,
    deleteKelompok,
    assignSantriToKelompok,
    removeSantriFromKelompok,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'kegiatan' | 'santri' | 'periode' | 'kelompok'>('santri');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'SANTRI' | 'MUSYRIF' | 'PENGAWAS' | 'SUPER_ADMIN'>('ALL');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [editableKegiatan, setEditableKegiatan] = useState<MockKegiatan[]>(kegiatanList);
  const [targetPoinReward, setTargetPoinReward] = useState(MOCK_REWARD_PERIODE.targetPoin);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Kelompok Search & Filter State
  const [kelompokSearchQuery, setKelompokSearchQuery] = useState<string>('');
  const [kelompokGenderFilter, setKelompokGenderFilter] = useState<'ALL' | 'PUTRA' | 'PUTRI' | 'CAMPUR'>('ALL');

  // Modal Tambah Kelompok
  const [isAddKelompokOpen, setIsAddKelompokOpen] = useState(false);
  const [kelompokForm, setKelompokForm] = useState({
    nama: '',
    deskripsi: '',
    musyrifId: musyrifList[0]?.id || '',
    kategoriGender: 'CAMPUR' as 'PUTRA' | 'PUTRI' | 'CAMPUR',
    santriIds: [] as string[],
  });

  // Modal Edit Kelompok
  const [isEditKelompokOpen, setIsEditKelompokOpen] = useState(false);
  const [editKelompokForm, setEditKelompokForm] = useState({
    id: '',
    nama: '',
    deskripsi: '',
    musyrifId: '',
    kategoriGender: 'CAMPUR' as 'PUTRA' | 'PUTRI' | 'CAMPUR',
    santriIds: [] as string[],
  });

  // Modal Pindah / Masukkan Santri ke Kelompok
  const [isMoveSantriModalOpen, setIsMoveSantriModalOpen] = useState(false);
  const [targetSantriForMove, setTargetSantriForMove] = useState<any>(null);
  const [targetKelompokSelected, setTargetKelompokSelected] = useState<string>('');

  // Modal Tambah Musyrif
  const [isAddMusyrifOpen, setIsAddMusyrifOpen] = useState(false);
  const [musyrifForm, setMusyrifForm] = useState({
    nama: '',
    username: '',
    noHp: '',
    password: '123',
    kelompokId: '',
  });

  // Modal Tambah Pengawas
  const [isAddPengawasOpen, setIsAddPengawasOpen] = useState(false);
  const [pengawasForm, setPengawasForm] = useState({
    nama: '',
    username: '',
    noHp: '',
    password: '123',
    asrama: 'Koordinator / Pengawas Utama Kesantrian',
  });

  // Modal Tambah Santri
  const [isAddSantriOpen, setIsAddSantriOpen] = useState(false);
  const [santriForm, setSantriForm] = useState({
    nama: '',
    username: '',
    noHp: '',
    password: '123',
    asrama: '',
    musyrifId: musyrifList[0]?.id || '',
    kelompokId: kelompokList[0]?.id || '',
  });

  // Modal Sambungkan Santri dari Tab Musyrif
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedMusyrifForAssign, setSelectedMusyrifForAssign] = useState<any>(null);

  // Filter & Modal Kegiatan
  const [kegiatanFilter, setKegiatanFilter] = useState<'ALL' | 'WAJIB' | 'SUNNAH'>('ALL');
  const [isAddKegiatanOpen, setIsAddKegiatanOpen] = useState(false);
  const [kegiatanForm, setKegiatanForm] = useState({
    nama: '',
    deskripsi: '',
    kategori: 'IBADAH' as 'IBADAH' | 'BELAJAR' | 'SOSIAL' | 'MANDIRI',
    poin: 15,
    icon: 'Sparkles',
    isWajib: true,
    isTimeRestricted: true,
    jamMulai: '04:30',
    jamSelesai: '05:45',
    targetWaktu: '04:30 - 05:45 WIB',
  });

  // Modal Tambah Periode
  const [isAddPeriodeOpen, setIsAddPeriodeOpen] = useState(false);
  const [periodeForm, setPeriodeForm] = useState({
    nama: '',
    tanggalMulai: new Date().toISOString().split('T')[0],
    tanggalSelesai: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    targetPoin: 400,
    deskripsiReward: '',
    isActive: false,
  });

  // Modal Edit Periode
  const [isEditPeriodeOpen, setIsEditPeriodeOpen] = useState(false);
  const [editPeriodeForm, setEditPeriodeForm] = useState({
    id: '',
    nama: '',
    tanggalMulai: '2026-08-01',
    tanggalSelesai: '2026-08-31',
    targetPoin: 400,
    deskripsiReward: '',
    isActive: false,
  });

  // Modal Edit Santri
  const [isEditSantriOpen, setIsEditSantriOpen] = useState(false);
  const [editSantriForm, setEditSantriForm] = useState({
    id: '',
    nama: '',
    username: '',
    noHp: '',
    password: '',
    asrama: '',
    musyrifId: '',
    kelompokId: '',
  });

  // Modal Edit Musyrif
  const [isEditMusyrifOpen, setIsEditMusyrifOpen] = useState(false);
  const [editMusyrifForm, setEditMusyrifForm] = useState({
    id: '',
    nama: '',
    username: '',
    noHp: '',
    password: '',
    kelompokId: '',
  });

  // Modal Edit Pengawas
  const [isEditPengawasOpen, setIsEditPengawasOpen] = useState(false);
  const [editPengawasForm, setEditPengawasForm] = useState({
    id: '',
    nama: '',
    username: '',
    noHp: '',
    password: '',
    asrama: '',
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, mounted, router]);

  // Memoized Filtered Data untuk Performa 60-120 FPS Super Ringan
  const filteredUsers = useMemo(() => {
    const query = userSearchQuery.trim().toLowerCase();
    return allUsers.filter((u) => {
      const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
      const matchQuery =
        query === '' ||
        u.nama.toLowerCase().includes(query) ||
        u.username.toLowerCase().includes(query) ||
        u.noHp.toLowerCase().includes(query) ||
        (u.asrama && u.asrama.toLowerCase().includes(query));
      return matchRole && matchQuery;
    });
  }, [allUsers, userRoleFilter, userSearchQuery]);

  const filteredKegiatan = useMemo(() => {
    return kegiatanList.filter((keg) => {
      if (kegiatanFilter === 'WAJIB') return keg.isWajib;
      if (kegiatanFilter === 'SUNNAH') return !keg.isWajib;
      return true;
    });
  }, [kegiatanList, kegiatanFilter]);

  const showNotification = (msg: string) => {
    setSavedSuccess(msg);
    setTimeout(() => setSavedSuccess(null), 3500);
  };

  const handlePoinChange = (id: string, newPoin: number) => {
    setEditableKegiatan((prev) =>
      prev.map((k) => (k.id === id ? { ...k, poin: newPoin } : k))
    );
  };

  const handleSavePoinSettings = () => {
    showNotification('✅ Pengaturan bobot poin kegiatan berhasil disimpan!');
  };

  const handleCreateMusyrif = (e: React.FormEvent) => {
    e.preventDefault();
    if (!musyrifForm.nama || !musyrifForm.username || !musyrifForm.noHp) {
      alert('Harap isi semua kolom nama, username, dan no. WhatsApp.');
      return;
    }
    addMusyrif({
      nama: musyrifForm.nama.trim(),
      username: musyrifForm.username.trim(),
      noHp: musyrifForm.noHp.trim(),
      password: musyrifForm.password.trim(),
      kelompokId: musyrifForm.kelompokId || undefined,
    });
    setIsAddMusyrifOpen(false);
    setMusyrifForm({
      nama: '',
      username: '',
      noHp: '',
      password: '123',
      kelompokId: '',
    });
    showNotification('✅ Akun Musyrif baru berhasil dibuat & dihubungkan ke kelompok!');
  };

  const handleCreatePengawas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pengawasForm.nama || !pengawasForm.username || !pengawasForm.noHp) {
      alert('Harap isi semua kolom data pengawas.');
      return;
    }
    addPengawas(pengawasForm);
    setIsAddPengawasOpen(false);
    setPengawasForm({
      nama: '',
      username: '',
      noHp: '',
      password: '123',
      asrama: 'Koordinator / Pengawas Utama Kesantrian',
    });
    showNotification('✅ Akun Pengawas baru berhasil dibuat & siap bertugas!');
  };

  const handleCreateSantri = (e: React.FormEvent) => {
    e.preventDefault();
    if (!santriForm.nama || !santriForm.username || !santriForm.noHp) {
      alert('Harap isi semua kolom data santri.');
      return;
    }
    const chosenKel = kelompokList.find((k) => k.id === santriForm.kelompokId);
    const resolvedMusyrifId = chosenKel?.musyrifId || santriForm.musyrifId || '';

    addSantri({
      ...santriForm,
      kelompokId: santriForm.kelompokId || undefined,
      musyrifId: resolvedMusyrifId || undefined,
    });
    setIsAddSantriOpen(false);
    setSantriForm({
      nama: '',
      username: '',
      noHp: '',
      password: '123',
      asrama: '',
      musyrifId: '',
      kelompokId: '',
    });
    showNotification('✅ Akun Santri berhasil didaftarkan & disambungkan ke Kelompok / Musyrif!');
  };

  const handleCreateKelompok = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kelompokForm.nama || !kelompokForm.musyrifId) {
      alert('Nama Kelompok dan Musyrif Penanggung Jawab wajib diisi.');
      return;
    }
    addKelompok(kelompokForm);
    setIsAddKelompokOpen(false);
    setKelompokForm({
      nama: '',
      deskripsi: '',
      musyrifId: musyrifList[0]?.id || '',
      kategoriGender: 'CAMPUR',
      santriIds: [],
    });
    showNotification(`✅ Kelompok "${kelompokForm.nama}" berhasil dibuat!`);
  };

  const handleUpdateKelompokSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editKelompokForm.nama || !editKelompokForm.musyrifId) {
      alert('Nama Kelompok dan Musyrif Penanggung Jawab wajib diisi.');
      return;
    }
    updateKelompok(editKelompokForm.id, {
      nama: editKelompokForm.nama.trim(),
      deskripsi: editKelompokForm.deskripsi.trim(),
      musyrifId: editKelompokForm.musyrifId,
      kategoriGender: editKelompokForm.kategoriGender,
      santriIds: editKelompokForm.santriIds,
    });
    setIsEditKelompokOpen(false);
    showNotification(`✅ Kelompok "${editKelompokForm.nama}" berhasil diperbarui!`);
  };

  const handleDeleteKelompokAction = (kelompok: MockKelompok) => {
    if (confirm(`Hapus kelompok "${kelompok.nama}"? Santri di dalam kelompok ini akan menjadi tidak memiliki kelompok (status unassigned).`)) {
      deleteKelompok(kelompok.id);
      showNotification(`🗑️ Kelompok "${kelompok.nama}" berhasil dihapus.`);
    }
  };

  const handleMoveSantriSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSantriForMove || !targetKelompokSelected) return;

    if (targetKelompokSelected === '__REMOVE__') {
      removeSantriFromKelompok(targetSantriForMove.id);
      showNotification(`Santri ${targetSantriForMove.nama} dikeluarkan dari kelompok.`);
    } else {
      assignSantriToKelompok(targetSantriForMove.id, targetKelompokSelected);
      const targetKel = kelompokList.find((k) => k.id === targetKelompokSelected);
      showNotification(`✅ ${targetSantriForMove.nama} berhasil dimasukkan ke "${targetKel?.nama || 'Kelompok'}"!`);
    }
    setIsMoveSantriModalOpen(false);
    setTargetSantriForMove(null);
  };

  const handleAssignMusyrif = (santriId: string, musyrifId: string) => {
    updateSantriMusyrif(santriId, musyrifId);
    const m = musyrifList.find((x) => x.id === musyrifId);
    showNotification(`🔗 Santri berhasil disambungkan ke ${m?.nama || 'Musyrif'}`);
  };

  const handleExportCSV = () => {
    const headers = ['ID Laporan', 'Nama Santri', 'Asrama', 'Musyrif Pembimbing', 'Kegiatan', 'Poin', 'Status', 'Waktu', 'Lokasi'];
    const rows = laporanList.map((lap) => {
      const santri = santriList.find((s) => s.id === lap.userId || s.nama === lap.userNama);
      return [
        lap.id,
        `"${lap.userNama}"`,
        `"${lap.userAsrama}"`,
        `"${santri?.musyrifNama || '-'}"`,
        `"${lap.kegiatanNama}"`,
        lap.poin,
        lap.status,
        `"${lap.createdAt}"`,
        `"${lap.lokasiName}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_RajinQu_Pesantren_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!mounted || isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="app-mobile-container bg-slate-50 min-h-screen pb-24 shadow-xl border-x border-slate-200">
      
      {/* Top Header Admin */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-teal-950 via-teal-900 to-emerald-950 text-white px-4 py-3.5 shadow-md">
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
                <span className="text-base font-bold tracking-tight">Super Admin</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded-full font-semibold">Yayasan</span>
              </div>
              <p className="text-[11px] text-teal-200 truncate max-w-[190px]">
                {user?.nama || 'Super Admin Yayasan'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={async () => {
                await syncFromDatabase();
                showNotification('✨ Data berhasil disinkronkan dengan database Neon PostgreSQL!');
              }}
              title="Sinkronkan dengan Database Neon"
              className="px-2 py-1 rounded-full bg-teal-900/60 hover:bg-teal-800/80 border border-teal-500/40 flex items-center gap-1 text-[10px] font-semibold text-teal-200 transition active:scale-95"
            >
              <RefreshCw className={`w-3 h-3 text-teal-300 ${isLoadingDb ? 'animate-spin' : ''}`} />
              <span>{isLoadingDb ? 'Sinkron...' : 'Sync DB'}</span>
            </button>

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
      <div className="p-3.5 space-y-3.5">
        
        {/* Quick Export Banner */}
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Rekap & Laporan</h2>
            <p className="text-[11px] text-slate-500">Unduh data santri & validasi kegiatan ke CSV</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Alert Notifikasi Sukses */}
        {savedSuccess && (
          <div className="p-3 bg-emerald-500 text-white text-xs rounded-xl shadow flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{savedSuccess}</span>
          </div>
        )}



        {/* ================================================================= */}
        {/* TAB 1: DATA PENGGUNA (SEMUA ROLE: SANTRI, MUSYRIF, PENGAWAS, ADMIN) */}
        {/* ================================================================= */}
        {activeTab === 'santri' && (
          <div className="space-y-3">
            {/* Header Data Pengguna */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Data Pengguna ({allUsers.length})
                </h3>
                <p className="text-[10px] text-slate-500">Kelola akun Santri, Musyrif, Pengawas, & Super Admin</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <button
                  onClick={() => setIsAddSantriOpen(true)}
                  className="inline-flex items-center gap-1 bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-xs transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>Santri</span>
                </button>

                <button
                  onClick={() => setIsAddMusyrifOpen(true)}
                  className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-xs transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>Musyrif</span>
                </button>

                <button
                  onClick={() => setIsAddPengawasOpen(true)}
                  className="inline-flex items-center gap-1 bg-sky-700 hover:bg-sky-800 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl shadow-xs transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>Pengawas</span>
                </button>
              </div>
            </div>

            {/* Filter Role & Search Toolbar */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, NIS, username, atau no HP..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Role Filter Tabs */}
              <div className="flex gap-1 overflow-x-auto pb-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('ALL')}
                  className={`px-2.5 py-1 rounded-xl shrink-0 transition ${
                    userRoleFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua ({allUsers.length})
                </button>

                <button
                  type="button"
                  onClick={() => setUserRoleFilter('SANTRI')}
                  className={`px-2.5 py-1 rounded-xl shrink-0 transition ${
                    userRoleFilter === 'SANTRI'
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                  }`}
                >
                  Santri ({santriList.length})
                </button>

                <button
                  type="button"
                  onClick={() => setUserRoleFilter('MUSYRIF')}
                  className={`px-2.5 py-1 rounded-xl shrink-0 transition ${
                    userRoleFilter === 'MUSYRIF'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  Musyrif / PJ ({musyrifList.length})
                </button>

                <button
                  type="button"
                  onClick={() => setUserRoleFilter('PENGAWAS')}
                  className={`px-2.5 py-1 rounded-xl shrink-0 transition ${
                    userRoleFilter === 'PENGAWAS'
                      ? 'bg-sky-700 text-white shadow-2xs'
                      : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
                  }`}
                >
                  Pengawas ({pengawasList.length})
                </button>

                <button
                  type="button"
                  onClick={() => setUserRoleFilter('SUPER_ADMIN')}
                  className={`px-2.5 py-1 rounded-xl shrink-0 transition ${
                    userRoleFilter === 'SUPER_ADMIN'
                      ? 'bg-emerald-800 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  Super Admin ({allUsers.filter((u) => u.role === 'SUPER_ADMIN').length})
                </button>
              </div>
            </div>

            {/* List User Cards */}
            <div className="space-y-2.5">
              {filteredUsers.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-1">
                  <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold text-slate-700">Belum ada akun pada filter ini.</p>
                  <p className="text-[11px] text-slate-400">
                    Klik tombol <strong>+ Santri</strong>, <strong>+ Musyrif</strong>, atau <strong>+ Pengawas</strong> di atas untuk mendaftarkan akun baru.
                  </p>
                </div>
              ) : (
                filteredUsers.map((u) => {
                  return (
                    <div
                      key={u.id}
                      className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm space-y-2.5 hover:border-slate-300 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={u.avatarUrl}
                            alt={u.nama}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 truncate">{u.nama}</span>
                              {u.role === 'SANTRI' && (
                                <span className="text-[9px] font-bold bg-teal-50 text-teal-800 px-1.5 py-0.2 rounded border border-teal-200 shrink-0">
                                  Santri
                                </span>
                              )}
                              {u.role === 'MUSYRIF' && (
                                <span className="text-[9px] font-bold bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200 shrink-0">
                                  Musyrif / PJ
                                </span>
                              )}
                              {u.role === 'PENGAWAS' && (
                                <span className="text-[9px] font-bold bg-sky-50 text-sky-800 px-1.5 py-0.2 rounded border border-sky-200 shrink-0">
                                  Pengawas
                                </span>
                              )}
                              {u.role === 'SUPER_ADMIN' && (
                                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
                                  Super Admin
                                </span>
                              )}
                            </div>

                            <div className="text-[10px] text-slate-400 mt-0.5">
                              User: <span className="font-mono font-bold text-slate-700">{u.username}</span> • PIN: <span className="font-mono text-teal-700 font-bold">{u.password}</span> • 📱 {u.noHp}
                            </div>
                            {u.role === 'MUSYRIF' && (
                              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                {(() => {
                                  const assignedKel = kelompokList.filter((k) => k.musyrifId === u.id);
                                  if (assignedKel.length > 0) {
                                    return (
                                      <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
                                        <Layers className="w-3 h-3 text-indigo-600" />
                                        <span>PJ: {assignedKel.map((k) => k.nama).join(', ')}</span>
                                      </span>
                                    );
                                  }
                                  return <span className="text-slate-400 italic">Belum ditugaskan ke kelompok</span>;
                                })()}
                              </div>
                            )}
                            {u.role === 'PENGAWAS' && (
                              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                {u.asrama || 'Pengawas Utama'}
                              </div>
                            )}
                            {u.role === 'SUPER_ADMIN' && (
                              <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                {u.asrama || u.pondokNama}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {u.role === 'SANTRI' && (
                            <span className="text-xs font-extrabold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                              {u.totalPoin} Poin
                            </span>
                          )}

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (u.role === 'SANTRI') {
                                setEditSantriForm({
                                  id: u.id,
                                  nama: u.nama,
                                  username: u.username,
                                  noHp: u.noHp,
                                  password: u.password,
                                  asrama: u.asrama || '',
                                  musyrifId: u.musyrifId || '',
                                  kelompokId: u.kelompokId || '',
                                });
                                setIsEditSantriOpen(true);
                              } else if (u.role === 'MUSYRIF') {
                                setEditMusyrifForm({
                                  id: u.id,
                                  nama: u.nama,
                                  username: u.username,
                                  noHp: u.noHp,
                                  password: u.password,
                                  kelompokId: kelompokList.find((k) => k.musyrifId === u.id)?.id || '',
                                });
                                setIsEditMusyrifOpen(true);
                              } else if (u.role === 'PENGAWAS') {
                                setEditPengawasForm({
                                  id: u.id,
                                  nama: u.nama,
                                  username: u.username,
                                  noHp: u.noHp,
                                  password: u.password,
                                  asrama: u.asrama || '',
                                });
                                setIsEditPengawasOpen(true);
                              } else {
                                alert('Akun Super Admin Utama tidak dapat diubah dari sini.');
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-teal-100 text-slate-500 hover:text-teal-700 transition"
                            title="Edit Data User"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button (kecuali Super Admin) */}
                          {u.role !== 'SUPER_ADMIN' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Hapus data akun "${u.nama}" (${u.role})?`)) {
                                  deleteUser(u.id);
                                  showNotification(`🗑️ Akun ${u.nama} berhasil dihapus.`);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                              title="Hapus Akun"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Khusus Santri: Kelompok & Musyrif PJ info row */}
                      {u.role === 'SANTRI' && (
                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="p-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200 shrink-0">
                              <Layers className="w-3.5 h-3.5" />
                            </span>
                            <div className="text-xs truncate font-semibold text-slate-800">
                              {u.kelompokNama ? (
                                <>
                                  <span className="font-bold text-indigo-950">{u.kelompokNama}</span>
                                  <span className="text-[11px] text-slate-500 ml-1 font-normal">
                                    (PJ: {u.musyrifNama || 'Musyrif'})
                                  </span>
                                </>
                              ) : (
                                <span className="text-slate-400 font-normal italic">Belum Ada Kelompok</span>
                              )}
                            </div>
                          </div>

                          <select
                            value={u.kelompokId || ''}
                            onChange={(e) => {
                              const newKelId = e.target.value;
                              if (!newKelId) {
                                removeSantriFromKelompok(u.id);
                                showNotification(`${u.nama} dikeluarkan dari kelompok.`);
                              } else {
                                assignSantriToKelompok(u.id, newKelId);
                                const targetKel = kelompokList.find((k) => k.id === newKelId);
                                showNotification(`✅ ${u.nama} masuk ke ${targetKel?.nama || 'Kelompok'}`);
                              }
                            }}
                            className="text-xs py-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold focus:ring-1 focus:ring-indigo-500 cursor-pointer shrink-0"
                          >
                            <option value="">{u.kelompokId ? 'Ubah Kelompok...' : 'Pilih Kelompok...'}</option>
                            {kelompokList.map((k) => (
                              <option key={k.id} value={k.id}>
                                {k.nama} (PJ: {k.musyrifNama})
                              </option>
                            ))}
                            {u.kelompokId && (
                              <option value="">❌ Keluarkan dari Kelompok</option>
                            )}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 1.5: MANAJEMEN KELOMPOK / HALAQAH SANTRI & MUSYRIF PJ */}
        {/* ================================================================= */}
        {activeTab === 'kelompok' && (
          <div className="space-y-4">
            {/* Header Manajemen Kelompok */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Kelompok & Halaqah ({kelompokList.length})</span>
                </h3>
                <p className="text-[10px] text-slate-500">
                  Pembagian santri dengan Musyrif sebagai Penanggung Jawab
                </p>
              </div>
              <button
                onClick={() => {
                  setKelompokForm({
                    nama: '',
                    deskripsi: '',
                    musyrifId: musyrifList[0]?.id || '',
                    kategoriGender: 'CAMPUR',
                    santriIds: [],
                  });
                  setIsAddKelompokOpen(true);
                }}
                className="inline-flex items-center gap-1 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kelompok</span>
              </button>
            </div>

            {/* Stats Summary Kelompok */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-2xl">
                <span className="text-[10px] font-bold text-indigo-600 block">Total Kelompok</span>
                <span className="text-lg font-black text-indigo-950">{kelompokList.length}</span>
              </div>
              <div className="bg-teal-50 border border-teal-100 p-2.5 rounded-2xl">
                <span className="text-[10px] font-bold text-teal-600 block">Santri Terbagi</span>
                <span className="text-lg font-black text-teal-950">
                  {santriList.filter((s) => s.kelompokId).length} / {santriList.length}
                </span>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-2xl">
                <span className="text-[10px] font-bold text-amber-700 block">Belum Ada Kelompok</span>
                <span className="text-lg font-black text-amber-950">
                  {santriList.filter((s) => !s.kelompokId).length}
                </span>
              </div>
              <div className="bg-purple-50 border border-purple-100 p-2.5 rounded-2xl">
                <span className="text-[10px] font-bold text-purple-700 block">Musyrif PJ Aktif</span>
                <span className="text-lg font-black text-purple-950">
                  {new Set(kelompokList.map((k) => k.musyrifId)).size} Musyrif
                </span>
              </div>
            </div>

            {/* Search & Kategori Filter Toolbar */}
            <div className="space-y-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama kelompok, musyrif PJ, atau santri..."
                  value={kelompokSearchQuery}
                  onChange={(e) => setKelompokSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto pb-0.5 text-[11px] font-bold">
                {(['ALL', 'PUTRA', 'PUTRI', 'CAMPUR'] as const).map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => setKelompokGenderFilter(gender)}
                    className={`px-3 py-1 rounded-xl shrink-0 transition ${
                      kelompokGenderFilter === gender
                        ? 'bg-indigo-700 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {gender === 'ALL' && `Semua (${kelompokList.length})`}
                    {gender === 'PUTRA' && `Putra (${kelompokList.filter((k) => k.kategoriGender === 'PUTRA').length})`}
                    {gender === 'PUTRI' && `Putri (${kelompokList.filter((k) => k.kategoriGender === 'PUTRI').length})`}
                    {gender === 'CAMPUR' && `Campur (${kelompokList.filter((k) => k.kategoriGender === 'CAMPUR').length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Kelompok Cards */}
            <div className="space-y-3">
              {(() => {
                const filteredKelompok = kelompokList
                  .filter((k) => {
                    if (kelompokGenderFilter !== 'ALL' && k.kategoriGender !== kelompokGenderFilter) return false;
                    if (!kelompokSearchQuery) return true;
                    const query = kelompokSearchQuery.toLowerCase();
                    const matchName = k.nama.toLowerCase().includes(query);
                    const matchMusyrif = k.musyrifNama.toLowerCase().includes(query);
                    const matchSantri = santriList
                      .filter((s) => k.santriIds.includes(s.id) || s.kelompokId === k.id)
                      .some((s) => s.nama.toLowerCase().includes(query));
                    return matchName || matchMusyrif || matchSantri;
                  });

                if (filteredKelompok.length === 0) {
                  return (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-1">
                      <Layers className="w-10 h-10 mx-auto mb-2 text-indigo-300" />
                      <p className="text-xs font-bold text-slate-700">Belum ada kelompok yang dibuat.</p>
                      <p className="text-[11px] text-slate-400">
                        Klik tombol <strong>+ Buat Kelompok</strong> di atas untuk membuat kelompok halaqah santri.
                      </p>
                    </div>
                  );
                }

                return filteredKelompok.map((kelompok) => {
                  const anggotaSantri = santriList.filter(
                    (s) => kelompok.santriIds.includes(s.id) || s.kelompokId === kelompok.id
                  );
                  const totalPoinKelompok = anggotaSantri.reduce((acc, s) => acc + (s.totalPoin || 0), 0);
                  const avgPoin = anggotaSantri.length > 0 ? Math.round(totalPoinKelompok / anggotaSantri.length) : 0;
                  const pjMusyrif = allUsers.find((u) => u.id === kelompok.musyrifId);

                  return (
                    <div
                      key={kelompok.id}
                      className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs space-y-3 transition hover:border-indigo-200"
                    >
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                kelompok.kategoriGender === 'PUTRA'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : kelompok.kategoriGender === 'PUTRI'
                                  ? 'bg-pink-50 text-pink-700 border-pink-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {kelompok.kategoriGender || 'CAMPUR'}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">{kelompok.nama}</h4>
                          </div>
                          {kelompok.deskripsi && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{kelompok.deskripsi}</p>
                          )}
                        </div>

                        {/* Actions: Edit & Delete */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditKelompokForm({
                                id: kelompok.id,
                                nama: kelompok.nama,
                                deskripsi: kelompok.deskripsi || '',
                                musyrifId: kelompok.musyrifId,
                                kategoriGender: kelompok.kategoriGender || 'CAMPUR',
                                santriIds: kelompok.santriIds || [],
                              });
                              setIsEditKelompokOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-500 hover:text-indigo-700 transition"
                            title="Edit Kelompok"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteKelompokAction(kelompok)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                            title="Hapus Kelompok"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Penanggung Jawab (Musyrif) Banner */}
                      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={
                              pjMusyrif?.avatarUrl ||
                              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                            }
                            alt={kelompok.musyrifNama}
                            className="w-8 h-8 rounded-full object-cover border border-amber-300 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 block">
                              Musyrif Penanggung Jawab
                            </span>
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {kelompok.musyrifNama}
                            </p>
                          </div>
                        </div>

                        {pjMusyrif?.noHp && (
                          <a
                            href={`https://wa.me/${pjMusyrif.noHp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 transition shadow-2xs"
                          >
                            <Phone className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>

                      {/* Stats Row */}
                      <div className="grid grid-cols-3 gap-1.5 text-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold block">Anggota</span>
                          <span className="text-xs font-black text-slate-800">{anggotaSantri.length} Santri</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold block">Total Poin</span>
                          <span className="text-xs font-black text-teal-700">{totalPoinKelompok} Poin</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold block">Rata-rata</span>
                          <span className="text-xs font-black text-indigo-700">{avgPoin} Poin/Santri</span>
                        </div>
                      </div>

                      {/* Santri Members List */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                          <span>Daftar Santri Anggota ({anggotaSantri.length}):</span>
                        </div>

                        {anggotaSantri.length === 0 ? (
                          <div className="text-center p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-[11px]">
                            Belum ada santri di dalam kelompok ini.
                          </div>
                        ) : (
                          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                            {anggotaSantri.map((santri) => (
                              <div
                                key={santri.id}
                                className="flex items-center justify-between p-1.5 bg-slate-50/80 hover:bg-indigo-50/50 border border-slate-100 rounded-xl text-xs transition"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <img
                                    src={
                                      santri.avatarUrl ||
                                      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
                                    }
                                    alt={santri.nama}
                                    className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <span className="font-semibold text-slate-900 truncate block text-[11px]">
                                      {santri.nama}
                                    </span>
                                    <span className="text-[9px] text-slate-400">
                                      NIS: {santri.username} • {santri.totalPoin} Poin
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTargetSantriForMove(santri);
                                      setTargetKelompokSelected(kelompok.id);
                                      setIsMoveSantriModalOpen(true);
                                    }}
                                    className="p-1 text-[10px] text-indigo-700 hover:bg-indigo-100 rounded-md font-bold transition flex items-center gap-0.5"
                                    title="Pindah ke Kelompok Lain"
                                  >
                                    <ArrowRightLeft className="w-3 h-3" />
                                    <span>Pindah</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Keluarkan ${santri.nama} dari ${kelompok.nama}?`)) {
                                        removeSantriFromKelompok(santri.id);
                                        showNotification(`${santri.nama} dikeluarkan dari kelompok.`);
                                      }
                                    }}
                                    className="p-1 text-[10px] text-rose-600 hover:bg-rose-50 rounded-md font-bold transition"
                                    title="Keluarkan dari Kelompok"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer: Quick Add Santri Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditKelompokForm({
                            id: kelompok.id,
                            nama: kelompok.nama,
                            deskripsi: kelompok.deskripsi || '',
                            musyrifId: kelompok.musyrifId,
                            kategoriGender: kelompok.kategoriGender || 'CAMPUR',
                            santriIds: kelompok.santriIds || [],
                          });
                          setIsEditKelompokOpen(true);
                        }}
                        className="w-full py-1.5 text-center text-xs font-bold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 rounded-xl transition border border-indigo-200/60 flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Kelola Anggota Santri</span>
                      </button>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Unassigned Santri Alert & Drawer */}
            {santriList.filter((s) => !s.kelompokId).length > 0 && (
              <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Santri Belum Masuk Kelompok ({santriList.filter((s) => !s.kelompokId).length})
                  </span>
                </div>
                <p className="text-[10px] text-amber-800">
                  Santri-santri berikut belum dimasukkan ke dalam kelompok/halaqah manapun. Klik &quot;+ Masukkan&quot; untuk mengalokasikan santri ke kelompok:
                </p>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {santriList
                    .filter((s) => !s.kelompokId)
                    .map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-1.5 bg-white rounded-xl border border-amber-100 text-xs shadow-2xs"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 block truncate text-[11px]">{s.nama}</span>
                          <span className="text-[9px] text-slate-400">NIS: {s.username} • {s.asrama}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setTargetSantriForMove(s);
                            setTargetKelompokSelected(kelompokList[0]?.id || '');
                            setIsMoveSantriModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 transition"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Masukkan Kelompok</span>
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB: MANAJEMEN KEGIATAN (WAJIB / SUNNAH & ATUR POIN) */}
        {/* ================================================================= */}
        {activeTab === 'kegiatan' && (
          <div className="space-y-3">
            {/* Header Kegiatan */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Daftar Kegiatan Liburan ({kegiatanList.length})
                </h3>
                <p className="text-[10px] text-slate-500">Kelola ibadah wajib, sunnah, dan bobot poin santri</p>
              </div>
              <button
                onClick={() => setIsAddKegiatanOpen(true)}
                className="inline-flex items-center gap-1 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kegiatan</span>
              </button>
            </div>

            {/* Filter Chips: Semua, Wajib, Sunnah */}
            <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setKegiatanFilter('ALL')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  kegiatanFilter === 'ALL' ? 'bg-white text-slate-900 font-bold shadow-sm' : 'text-slate-600'
                }`}
              >
                Semua ({kegiatanList.length})
              </button>
              <button
                onClick={() => setKegiatanFilter('WAJIB')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  kegiatanFilter === 'WAJIB' ? 'bg-white text-rose-700 font-bold shadow-sm' : 'text-slate-600'
                }`}
              >
                Wajib ({kegiatanList.filter((k) => k.isWajib).length})
              </button>
              <button
                onClick={() => setKegiatanFilter('SUNNAH')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  kegiatanFilter === 'SUNNAH' ? 'bg-white text-amber-700 font-bold shadow-sm' : 'text-slate-600'
                }`}
              >
                Sunnah ({kegiatanList.filter((k) => !k.isWajib).length})
              </button>
            </div>

            {/* List Kegiatan Cards */}
            <div className="space-y-2.5">
              {(() => {
                const filteredKegiatan = kegiatanList.filter((keg) => {
                  if (kegiatanFilter === 'WAJIB') return keg.isWajib;
                  if (kegiatanFilter === 'SUNNAH') return !keg.isWajib;
                  return true;
                });

                if (filteredKegiatan.length === 0) {
                  return (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-1">
                      <Sparkles className="w-10 h-10 mx-auto mb-2 text-teal-300" />
                      <p className="text-xs font-bold text-slate-700">Belum ada kegiatan ibadah pada filter ini.</p>
                      <p className="text-[11px] text-slate-400">
                        Klik tombol <strong>+ Tambah Kegiatan</strong> di atas untuk membuat kegiatan harian baru.
                      </p>
                    </div>
                  );
                }

                return filteredKegiatan.map((keg) => (
                  <div
                    key={keg.id}
                    className={`bg-white rounded-2xl p-3.5 border shadow-sm space-y-2.5 transition ${
                      keg.isWajib ? 'border-slate-200' : 'border-amber-200/80 bg-amber-50/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{keg.nama}</span>
                          
                          {/* Toggle Badge Wajib / Sunnah */}
                          <button
                            type="button"
                            onClick={() => {
                              toggleKegiatanWajib(keg.id);
                              showNotification(`🔄 Status kegiatan "${keg.nama}" diubah ke ${!keg.isWajib ? 'Wajib' : 'Sunnah'}`);
                            }}
                            title="Klik untuk ubah Wajib / Sunnah"
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition active:scale-95 ${
                              keg.isWajib
                                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                            }`}
                          >
                            {keg.isWajib ? '★ Wajib' : '○ Sunnah'}
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-500 leading-relaxed">{keg.deskripsi}</p>
                        
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-medium pt-0.5">
                          <span className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-600 font-semibold">{keg.kategori}</span>
                          
                          {/* Badge & Toggle Dibatasi Waktu vs Bebas */}
                          <button
                            type="button"
                            onClick={() => {
                              const newRestricted = !keg.isTimeRestricted;
                              updateKegiatanTime(
                                keg.id,
                                newRestricted,
                                newRestricted ? (keg.jamMulai || '05:00') : undefined,
                                newRestricted ? (keg.jamSelesai || '07:00') : undefined
                              );
                              showNotification(`⏰ Batasan waktu kegiatan "${keg.nama}" diubah ke: ${newRestricted ? 'Dibatasi Jam Tertentu' : 'Waktu Bebas / Fleksibel'}`);
                            }}
                            title="Klik untuk ubah status batasan waktu"
                            className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 transition ${
                              keg.isTimeRestricted
                                ? 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <Clock className="w-3 h-3 text-teal-600" />
                            <span>{keg.isTimeRestricted ? `Dibatasi: ${keg.targetWaktu}` : '♾️ Waktu Bebas (Kapan Saja)'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Tombol Hapus */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus kegiatan "${keg.nama}"?`)) {
                            deleteKegiatan(keg.id);
                            showNotification(`🗑️ Kegiatan "${keg.nama}" berhasil dihapus.`);
                          }
                        }}
                        className="text-slate-300 hover:text-rose-600 p-1 transition"
                        title="Hapus Kegiatan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Pengaturan Jam Langsung jika Dibatasi Waktu */}
                    {keg.isTimeRestricted && (
                      <div className="bg-teal-50/60 border border-teal-200/80 p-2 rounded-xl text-xs flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-teal-900 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-teal-700" />
                          <span>Rentang Jam Lapor:</span>
                        </span>

                        <div className="flex items-center gap-1 text-[11px]">
                          <input
                            type="time"
                            defaultValue={keg.jamMulai || '04:30'}
                            onChange={(e) => {
                              const mulai = e.target.value;
                              updateKegiatanTime(keg.id, true, mulai, keg.jamSelesai || '06:00');
                            }}
                            className="bg-white border border-teal-300 rounded px-1.5 py-0.5 text-xs font-bold text-teal-950"
                          />
                          <span className="text-teal-700 font-bold">s/d</span>
                          <input
                            type="time"
                            defaultValue={keg.jamSelesai || '06:00'}
                            onChange={(e) => {
                              const selesai = e.target.value;
                              updateKegiatanTime(keg.id, true, keg.jamMulai || '04:30', selesai);
                            }}
                            className="bg-white border border-teal-300 rounded px-1.5 py-0.5 text-xs font-bold text-teal-950"
                          />
                          <span className="text-[10px] text-teal-700 font-bold">WIB</span>
                        </div>
                      </div>
                    )}

                    {/* Live Edit Poin Langsung */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-500">
                        Poin Kegiatan per Laporan:
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-teal-700">+</span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={keg.poin}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            updateKegiatanPoin(keg.id, val);
                          }}
                          className="w-14 text-xs font-black text-center py-1 px-1.5 bg-white border border-teal-300 rounded-lg text-teal-900 focus:ring-2 focus:ring-teal-500 shadow-2xs"
                        />
                        <span className="text-xs font-bold text-teal-800">Poin</span>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: PERIODE LIBURAN & REWARD (TAMBAH, AKTIFKAN & NONAKTIFKAN) */}
        {/* ================================================================= */}
        {activeTab === 'periode' && (
          <div className="space-y-3">
            {/* Header Periode */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Daftar Periode Liburan ({periodeList.length})
                </h3>
                <p className="text-[10px] text-slate-500">Kelola masa liburan, target poin, dan periode aktif</p>
              </div>
              <button
                onClick={() => setIsAddPeriodeOpen(true)}
                className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Periode</span>
              </button>
            </div>

            {/* Banner Live Perhitungan Masa Liburan & Sisa Hari */}
            <VacationCountdownBanner
              periode={activePeriode}
              variant="compact"
            />

            {/* List Periode Cards */}
            <div className="space-y-3">
              {periodeList.map((periode) => (
                <div
                  key={periode.id}
                  className={`bg-white rounded-2xl p-4 border shadow-sm space-y-3 transition ${
                    periode.isActive
                      ? 'border-2 border-emerald-500 bg-gradient-to-b from-emerald-50/30 to-white'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{periode.nama}</h4>
                        {periode.isActive ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            <span>Sedang Aktif</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            Nonaktif
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>{periode.rentangTanggal}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Tombol Edit Periode */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditPeriodeForm({
                            id: periode.id,
                            nama: periode.nama,
                            tanggalMulai: periode.tanggalMulai || (periode.rentangTanggal?.split(' s/d ')[0]) || '2026-08-01',
                            tanggalSelesai: periode.tanggalSelesai || (periode.rentangTanggal?.split(' s/d ')[1]) || '2026-08-31',
                            targetPoin: periode.targetPoin,
                            deskripsiReward: periode.deskripsiReward || '',
                            isActive: periode.isActive,
                          });
                          setIsEditPeriodeOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-800 transition"
                        title="Edit Data Periode"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {!periode.isActive && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Hapus periode "${periode.nama}"?`)) {
                              deletePeriode(periode.id);
                              showNotification('🗑️ Periode liburan berhasil dihapus.');
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                          title="Hapus Periode"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Target Poin & Reward Box */}
                  <div className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1.5 border border-slate-100">
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-semibold">Target Poin Santri Teladan:</span>
                      <span className="font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {periode.targetPoin} Poin
                      </span>
                    </div>

                    {periode.deskripsiReward && (
                      <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 leading-relaxed">
                        <span className="font-semibold text-slate-700">Hadiah / Reward: </span>
                        <span>{periode.deskripsiReward}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Toggle Aktifkan / Nonaktifkan */}
                  <div className="pt-1 flex items-center justify-between">
                    {periode.isActive ? (
                      <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Periode ini sedang digunakan di aplikasi</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          togglePeriodeActive(periode.id);
                          showNotification(`⚡ Periode "${periode.nama}" sekarang aktif sebagai periode berjalan!`);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Aktifkan Periode Ini</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* BOTTOM NAVBAR SUPER ADMIN */}
      {/* ============================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-2">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1 text-center">
          <button
            type="button"
            onClick={() => setActiveTab('santri')}
            className={`py-1.5 px-0.5 rounded-2xl transition flex flex-col items-center gap-0.5 ${
              activeTab === 'santri'
                ? 'bg-teal-50 text-teal-800 font-extrabold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === 'santri' ? 'text-teal-700 stroke-[2.5]' : ''}`} />
            <span className="text-[9px]">Pengguna</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kelompok')}
            className={`py-1.5 px-0.5 rounded-2xl transition flex flex-col items-center gap-0.5 ${
              activeTab === 'kelompok'
                ? 'bg-indigo-50 text-indigo-800 font-extrabold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className={`w-4 h-4 ${activeTab === 'kelompok' ? 'text-indigo-700 stroke-[2.5]' : ''}`} />
            <span className="text-[9px]">Kelompok</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kegiatan')}
            className={`py-1.5 px-0.5 rounded-2xl transition flex flex-col items-center gap-0.5 ${
              activeTab === 'kegiatan'
                ? 'bg-teal-50 text-teal-800 font-extrabold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${activeTab === 'kegiatan' ? 'text-teal-700 stroke-[2.5]' : ''}`} />
            <span className="text-[9px]">Bobot</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('periode')}
            className={`py-1.5 px-0.5 rounded-2xl transition flex flex-col items-center gap-0.5 ${
              activeTab === 'periode'
                ? 'bg-teal-50 text-teal-800 font-extrabold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className={`w-4 h-4 ${activeTab === 'periode' ? 'text-teal-700 stroke-[2.5]' : ''}`} />
            <span className="text-[9px]">Reward</span>
          </button>
        </div>
      </nav>

      {/* ================================================================= */}
      {/* MODAL TAMBAH SANTRI & SAMBUNGKAN KE KELOMPOK / MUSYRIF */}
      {/* ================================================================= */}
      {isAddSantriOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                <GraduationCap className="w-5 h-5 text-teal-600" />
                <span>Buat Akun Santri Baru</span>
              </div>
              <button
                onClick={() => setIsAddSantriOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSantri} className="space-y-2.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Santri</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bilal Al-Bantani"
                  value={santriForm.nama}
                  onChange={(e) => setSantriForm({ ...santriForm, nama: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIS / Username</label>
                  <input
                    type="text"
                    required
                    placeholder="2026006"
                    value={santriForm.username}
                    onChange={(e) => setSantriForm({ ...santriForm, username: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PIN / Password</label>
                  <input
                    type="text"
                    required
                    value={santriForm.password}
                    onChange={(e) => setSantriForm({ ...santriForm, password: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">No. WhatsApp Santri / Wali</label>
                  <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                    Bisa nomor sama untuk saudara
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="0812XXXXXXXX"
                  value={santriForm.noHp}
                  onChange={(e) => setSantriForm({ ...santriForm, noHp: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  1 nomor WhatsApp dapat digunakan oleh lebih dari 1 akun santri (misal: kakak-beradik menggunakan nomor HP orang tua yang sama).
                </p>
              </div>

              {/* DROPDOWN KAITKAN KE KELOMPOK */}
              <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-200">
                <label className="block font-bold text-indigo-900 mb-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Masukkan ke Kelompok / Halaqah</span>
                </label>
                <select
                  value={santriForm.kelompokId || ''}
                  onChange={(e) => {
                    const chosenKelId = e.target.value;
                    const chosenKel = kelompokList.find((k) => k.id === chosenKelId);
                    setSantriForm({
                      ...santriForm,
                      kelompokId: chosenKelId,
                      musyrifId: chosenKel ? chosenKel.musyrifId : santriForm.musyrifId,
                    });
                  }}
                  className="w-full p-2 bg-white border border-indigo-300 rounded-xl text-indigo-950 font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Tanpa Kelompok --</option>
                  {kelompokList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama} (PJ: {k.musyrifNama})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow mt-2"
              >
                Simpan & Tambah Santri
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL TAMBAH MUSYRIF BARU */}
      {/* ================================================================= */}
      {isAddMusyrifOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                <UserCheck className="w-4 h-4 text-teal-700" />
                <span>Tambah Musyrif / Pembina Baru</span>
              </div>
              <button
                onClick={() => setIsAddMusyrifOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMusyrif} className="space-y-2.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ustadz Ahmad Zulfikar, S.Pd."
                  value={musyrifForm.nama}
                  onChange={(e) => setMusyrifForm({ ...musyrifForm, nama: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username Login</label>
                  <input
                    type="text"
                    required
                    placeholder="musyrif.ahmad"
                    value={musyrifForm.username}
                    onChange={(e) => setMusyrifForm({ ...musyrifForm, username: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password / PIN</label>
                  <input
                    type="text"
                    required
                    placeholder="123"
                    value={musyrifForm.password}
                    onChange={(e) => setMusyrifForm({ ...musyrifForm, password: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp Musyrif</label>
                <input
                  type="text"
                  required
                  placeholder="0812XXXXXXXX"
                  value={musyrifForm.noHp}
                  onChange={(e) => setMusyrifForm({ ...musyrifForm, noHp: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* DROPDOWN HUBUNGKAN KE KELOMPOK */}
              <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-200">
                <label className="block font-bold text-indigo-900 mb-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Tugaskan Sebagai PJ Kelompok</span>
                </label>
                <select
                  value={musyrifForm.kelompokId || ''}
                  onChange={(e) => setMusyrifForm({ ...musyrifForm, kelompokId: e.target.value })}
                  className="w-full p-2 bg-white border border-indigo-300 rounded-xl text-indigo-950 font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Belum Ditugaskan ke Kelompok --</option>
                  {kelompokList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama} {k.musyrifNama ? `(PJ: ${k.musyrifNama})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-indigo-700 mt-1">
                  Musyrif akan otomatis menjadi Penanggung Jawab bagi seluruh santri di kelompok yang dipilih.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow mt-2"
              >
                Simpan & Aktifkan Musyrif
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL TAMBAH PENGAWAS KESANTRIAN */}
      {/* ================================================================= */}
      {isAddPengawasOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2 text-sky-900 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-sky-600" />
                <span>Buat Akun Pengawas Baru</span>
              </div>
              <button
                onClick={() => setIsAddPengawasOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePengawas} className="space-y-2.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ustadz Dr. H. Usman Ridwan, M.Pd."
                  value={pengawasForm.nama}
                  onChange={(e) => setPengawasForm({ ...pengawasForm, nama: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username Login</label>
                  <input
                    type="text"
                    required
                    placeholder="pengawas.usman"
                    value={pengawasForm.username}
                    onChange={(e) => setPengawasForm({ ...pengawasForm, username: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password / PIN</label>
                  <input
                    type="text"
                    required
                    value={pengawasForm.password}
                    onChange={(e) => setPengawasForm({ ...pengawasForm, password: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp Pengawas</label>
                <input
                  type="text"
                  required
                  placeholder="0812XXXXXXXX"
                  value={pengawasForm.noHp}
                  onChange={(e) => setPengawasForm({ ...pengawasForm, noHp: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jabatan / Tanggung Jawab</label>
                <input
                  type="text"
                  placeholder="Koordinator / Pengawas Utama Kesantrian"
                  value={pengawasForm.asrama}
                  onChange={(e) => setPengawasForm({ ...pengawasForm, asrama: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl shadow mt-2"
              >
                Simpan & Aktifkan Pengawas
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL HUBUNGKAN SANTRI KE MUSYRIF (DARI TAB MUSYRIF) */}
      {/* ================================================================= */}
      {isAssignModalOpen && selectedMusyrifForAssign && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                  <LinkIcon className="w-4 h-4 text-amber-600" />
                  <span>Hubungkan Santri Binaan</span>
                </div>
                <p className="text-[11px] text-slate-500 font-semibold">{selectedMusyrifForAssign.nama}</p>
              </div>
              <button
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setSelectedMusyrifForAssign(null);
                }}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Pilih santri-santri yang akan menjadi tanggung jawab musyrif ini:
            </p>

            <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
              {santriList.map((santri) => {
                const isAssignedToThis = santri.musyrifId === selectedMusyrifForAssign.id;
                const isAssignedToOther = santri.musyrifId && santri.musyrifId !== selectedMusyrifForAssign.id;

                return (
                  <div
                    key={santri.id}
                    onClick={() => {
                      if (isAssignedToThis) {
                        handleAssignMusyrif(santri.id, '');
                      } else {
                        handleAssignMusyrif(santri.id, selectedMusyrifForAssign.id);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                      isAssignedToThis
                        ? 'bg-amber-50/80 border-amber-400 font-bold text-amber-950 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isAssignedToThis}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 pointer-events-none"
                      />
                      <div>
                        <div className="text-xs">{santri.nama}</div>
                        <div className="text-[10px] text-slate-400">{santri.asrama}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      {isAssignedToThis && (
                        <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                          Dibina
                        </span>
                      )}
                      {isAssignedToOther && (
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded">
                          {santri.musyrifNama?.split(' ')[1] || 'Lainnya'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setSelectedMusyrifForAssign(null);
                  showNotification(`✅ Santri binaan ${selectedMusyrifForAssign.nama} berhasil diperbarui!`);
                }}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow"
              >
                Selesai & Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL TAMBAH KEGIATAN BARU (WAJIB / SUNNAH) */}
      {/* ================================================================= */}
      {isAddKegiatanOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Tambah Kegiatan Baru</span>
              </div>
              <button
                onClick={() => setIsAddKegiatanOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!kegiatanForm.nama) return;

                const finalTargetWaktu = kegiatanForm.isTimeRestricted
                  ? `${kegiatanForm.jamMulai} - ${kegiatanForm.jamSelesai} WIB`
                  : 'Bebas / Kapan Saja';

                addKegiatan({
                  ...kegiatanForm,
                  targetWaktu: finalTargetWaktu,
                });

                setIsAddKegiatanOpen(false);
                setKegiatanForm({
                  nama: '',
                  deskripsi: '',
                  kategori: 'IBADAH',
                  poin: 15,
                  icon: 'Sparkles',
                  isWajib: true,
                  isTimeRestricted: true,
                  jamMulai: '04:30',
                  jamSelesai: '05:45',
                  targetWaktu: '04:30 - 05:45 WIB',
                });
                showNotification(`✅ Kegiatan "${kegiatanForm.nama}" berhasil ditambahkan!`);
              }}
              className="space-y-2.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Kegiatan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sholat Subuh Berjamaah"
                  value={kegiatanForm.nama}
                  onChange={(e) => setKegiatanForm({ ...kegiatanForm, nama: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Petunjuk pelaksanaan kegiatan..."
                  value={kegiatanForm.deskripsi}
                  onChange={(e) => setKegiatanForm({ ...kegiatanForm, deskripsi: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={kegiatanForm.kategori}
                    onChange={(e: any) => setKegiatanForm({ ...kegiatanForm, kategori: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="IBADAH">Ibadah</option>
                    <option value="BELAJAR">Belajar</option>
                    <option value="MANDIRI">Mandiri</option>
                    <option value="SOSIAL">Sosial</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipe Kegiatan</label>
                  <select
                    value={kegiatanForm.isWajib ? 'WAJIB' : 'SUNNAH'}
                    onChange={(e) => setKegiatanForm({ ...kegiatanForm, isWajib: e.target.value === 'WAJIB' })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-teal-900"
                  >
                    <option value="WAJIB">★ Wajib</option>
                    <option value="SUNNAH">☆ Sunnah</option>
                  </select>
                </div>
              </div>

              {/* BATASAN WAKTU: DIBATASI JAM VS BEBAS */}
              <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-800">
                  Batasan Waktu Pelaksanaan:
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setKegiatanForm({ ...kegiatanForm, isTimeRestricted: true })}
                    className={`py-2 px-2 rounded-xl border text-center font-bold text-[11px] transition ${
                      kegiatanForm.isTimeRestricted
                        ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    ⏰ Dibatasi Jam
                  </button>

                  <button
                    type="button"
                    onClick={() => setKegiatanForm({ ...kegiatanForm, isTimeRestricted: false })}
                    className={`py-2 px-2 rounded-xl border text-center font-bold text-[11px] transition ${
                      !kegiatanForm.isTimeRestricted
                        ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    ♾️ Waktu Bebas
                  </button>
                </div>

                {kegiatanForm.isTimeRestricted ? (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Jam Mulai</label>
                      <input
                        type="time"
                        required
                        value={kegiatanForm.jamMulai}
                        onChange={(e) => setKegiatanForm({ ...kegiatanForm, jamMulai: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Jam Selesai</label>
                      <input
                        type="time"
                        required
                        value={kegiatanForm.jamSelesai}
                        onChange={(e) => setKegiatanForm({ ...kegiatanForm, jamSelesai: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    Santri dapat melaporkan kegiatan ini kapan saja sepanjang hari tanpa batasan jam tertentu.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bobot Poin per Laporan</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={kegiatanForm.poin}
                  onChange={(e) => setKegiatanForm({ ...kegiatanForm, poin: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-teal-700"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow mt-2"
              >
                Simpan Kegiatan Baru
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL TAMBAH PERIODE LIBURAN BARU */}
      {/* ================================================================= */}
      {isAddPeriodeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Calendar className="w-5 h-5 text-amber-600" />
                <span>Tambah Periode Liburan Baru</span>
              </div>
              <button
                onClick={() => setIsAddPeriodeOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!periodeForm.nama || !periodeForm.tanggalMulai || !periodeForm.tanggalSelesai) return;
                const dMulai = new Date(periodeForm.tanggalMulai);
                const dSelesai = new Date(periodeForm.tanggalSelesai);
                if (dSelesai < dMulai) {
                  alert('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.');
                  return;
                }
                const formattedRentang = `${periodeForm.tanggalMulai} s/d ${periodeForm.tanggalSelesai}`;

                addPeriode({
                  ...periodeForm,
                  rentangTanggal: formattedRentang,
                });
                setIsAddPeriodeOpen(false);
                setPeriodeForm({
                  nama: '',
                  tanggalMulai: new Date().toISOString().split('T')[0],
                  tanggalSelesai: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  targetPoin: 400,
                  deskripsiReward: '',
                  isActive: false,
                });
                showNotification(`✅ Periode "${periodeForm.nama}" berhasil ditambahkan!`);
              }}
              className="space-y-2.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Periode Liburan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Liburan Ramadhan & Idul Fitri 1447 H"
                  value={periodeForm.nama}
                  onChange={(e) => setPeriodeForm({ ...periodeForm, nama: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* DUAL DATE PICKER: TANGGAL MULAI & TANGGAL SELESAI */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={periodeForm.tanggalMulai}
                    onChange={(e) => setPeriodeForm({ ...periodeForm, tanggalMulai: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    min={periodeForm.tanggalMulai}
                    value={periodeForm.tanggalSelesai}
                    onChange={(e) => setPeriodeForm({ ...periodeForm, tanggalSelesai: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* DURASI HARI & TARGET HARIAN BADGE */}
              {periodeForm.tanggalMulai && periodeForm.tanggalSelesai && (
                <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-amber-900 font-bold block">
                      📅 Total: {Math.max(1, Math.ceil((new Date(periodeForm.tanggalSelesai).getTime() - new Date(periodeForm.tanggalMulai).getTime()) / (1000 * 60 * 60 * 24)) + 1)} Hari Liburan
                    </span>
                    <span className="text-[10px] text-amber-700">
                      Target: ~{Math.ceil(periodeForm.targetPoin / Math.max(1, Math.ceil((new Date(periodeForm.tanggalSelesai).getTime() - new Date(periodeForm.tanggalMulai).getTime()) / (1000 * 60 * 60 * 24)) + 1))} Poin/Hari
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-1 rounded-lg">
                    {periodeForm.tanggalMulai} s/d {periodeForm.tanggalSelesai}
                  </span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Poin Reward</label>
                <input
                  type="number"
                  required
                  min="50"
                  max="5000"
                  value={periodeForm.targetPoin}
                  onChange={(e) => setPeriodeForm({ ...periodeForm, targetPoin: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-teal-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Hadiah / Reward Santri</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: 🎁 Bingkisan Idul Fitri Eksklusif + Uang Saku Pembinaan Santri Teladan."
                  value={periodeForm.deskripsiReward}
                  onChange={(e) => setPeriodeForm({ ...periodeForm, deskripsiReward: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                ></textarea>
              </div>

              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activateNow"
                  checked={periodeForm.isActive}
                  onChange={(e) => setPeriodeForm({ ...periodeForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <label htmlFor="activateNow" className="text-[11px] font-bold text-amber-950 cursor-pointer">
                  Jadikan Sebagai Periode Aktif Sekarang
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow mt-2"
              >
                Simpan Periode Baru
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL EDIT DATA SANTRI */}
      {/* ================================================================= */}
      {isEditSantriOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                <Edit className="w-4 h-4 text-teal-600" />
                <span>Edit Data Santri</span>
              </div>
              <button
                onClick={() => setIsEditSantriOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const chosenKel = kelompokList.find((k) => k.id === editSantriForm.kelompokId);
                const resolvedMusyrifId = chosenKel?.musyrifId || editSantriForm.musyrifId || '';

                updateUser(editSantriForm.id, {
                  nama: editSantriForm.nama.trim(),
                  username: editSantriForm.username.trim(),
                  noHp: editSantriForm.noHp.trim(),
                  password: editSantriForm.password.trim(),
                  asrama: editSantriForm.asrama.trim(),
                  musyrifId: resolvedMusyrifId || undefined,
                  kelompokId: editSantriForm.kelompokId || undefined,
                });
                if (editSantriForm.kelompokId) {
                  assignSantriToKelompok(editSantriForm.id, editSantriForm.kelompokId);
                } else {
                  removeSantriFromKelompok(editSantriForm.id);
                }
                setIsEditSantriOpen(false);
                showNotification(`✅ Data santri ${editSantriForm.nama} berhasil diperbarui!`);
              }}
              className="space-y-2.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Santri</label>
                <input
                  type="text"
                  required
                  value={editSantriForm.nama}
                  onChange={(e) => setEditSantriForm({ ...editSantriForm, nama: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIS / Username</label>
                  <input
                    type="text"
                    required
                    value={editSantriForm.username}
                    onChange={(e) => setEditSantriForm({ ...editSantriForm, username: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password / PIN</label>
                  <input
                    type="text"
                    required
                    value={editSantriForm.password}
                    onChange={(e) => setEditSantriForm({ ...editSantriForm, password: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp Santri / Wali</label>
                <input
                  type="text"
                  required
                  value={editSantriForm.noHp}
                  onChange={(e) => setEditSantriForm({ ...editSantriForm, noHp: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* DROPDOWN KAITKAN KE KELOMPOK */}
              <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-200">
                <label className="block font-bold text-indigo-900 mb-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Kelompok / Halaqah</span>
                </label>
                <select
                  value={editSantriForm.kelompokId || ''}
                  onChange={(e) => {
                    const chosenKelId = e.target.value;
                    const chosenKel = kelompokList.find((k) => k.id === chosenKelId);
                    setEditSantriForm({
                      ...editSantriForm,
                      kelompokId: chosenKelId,
                      musyrifId: chosenKel ? chosenKel.musyrifId : editSantriForm.musyrifId,
                    });
                  }}
                  className="w-full p-2 bg-white border border-indigo-300 rounded-xl text-indigo-950 font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Tanpa Kelompok --</option>
                  {kelompokList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama} (PJ: {k.musyrifNama})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow mt-2"
              >
                Simpan Perubahan Santri
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL EDIT DATA MUSYRIF */}
      {/* ================================================================= */}
      {isEditMusyrifOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Edit className="w-4 h-4 text-amber-600" />
                <span>Edit Data Musyrif / Pengurus</span>
              </div>
              <button
                onClick={() => setIsEditMusyrifOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateUser(editMusyrifForm.id, {
                  nama: editMusyrifForm.nama.trim(),
                  username: editMusyrifForm.username.trim(),
                  noHp: editMusyrifForm.noHp.trim(),
                  password: editMusyrifForm.password.trim(),
                  asrama: 'Musyrif PPTQ Batuan',
                });

                if (editMusyrifForm.kelompokId) {
                  updateKelompok(editMusyrifForm.kelompokId, {
                    musyrifId: editMusyrifForm.id,
                    musyrifNama: editMusyrifForm.nama.trim(),
                  });
                }

                setIsEditMusyrifOpen(false);
                showNotification(`✅ Data musyrif ${editMusyrifForm.nama} berhasil diperbarui!`);
              }}
              className="space-y-2.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={editMusyrifForm.nama}
                  onChange={(e) => setEditMusyrifForm({ ...editMusyrifForm, nama: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username Login</label>
                  <input
                    type="text"
                    required
                    value={editMusyrifForm.username}
                    onChange={(e) => setEditMusyrifForm({ ...editMusyrifForm, username: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password / PIN</label>
                  <input
                    type="text"
                    required
                    value={editMusyrifForm.password}
                    onChange={(e) => setEditMusyrifForm({ ...editMusyrifForm, password: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp Musyrif</label>
                <input
                  type="text"
                  required
                  value={editMusyrifForm.noHp}
                  onChange={(e) => setEditMusyrifForm({ ...editMusyrifForm, noHp: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* DROPDOWN HUBUNGKAN KE KELOMPOK */}
              <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-200">
                <label className="block font-bold text-indigo-900 mb-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-700" />
                  <span>Tugaskan Sebagai PJ Kelompok</span>
                </label>
                <select
                  value={editMusyrifForm.kelompokId || ''}
                  onChange={(e) => setEditMusyrifForm({ ...editMusyrifForm, kelompokId: e.target.value })}
                  className="w-full p-2 bg-white border border-indigo-300 rounded-xl text-indigo-950 font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Belum Ditugaskan ke Kelompok --</option>
                  {kelompokList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama} {k.musyrifNama ? `(PJ: ${k.musyrifNama})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-indigo-700 mt-1">
                  Musyrif akan otomatis menjadi Penanggung Jawab bagi seluruh santri di kelompok yang dipilih.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow mt-2"
              >
                Simpan Perubahan Musyrif
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL EDIT DATA PENGAWAS */}
      {/* ================================================================= */}
      {isEditPengawasOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2 text-sky-900 font-bold text-sm">
                <Edit className="w-4 h-4 text-sky-600" />
                <span>Edit Data Pengawas</span>
              </div>
              <button
                onClick={() => setIsEditPengawasOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateUser(editPengawasForm.id, {
                  nama: editPengawasForm.nama.trim(),
                  username: editPengawasForm.username.trim(),
                  noHp: editPengawasForm.noHp.trim(),
                  password: editPengawasForm.password.trim(),
                  asrama: editPengawasForm.asrama.trim(),
                });
                setIsEditPengawasOpen(false);
                showNotification(`✅ Data pengawas ${editPengawasForm.nama} berhasil diperbarui!`);
              }}
              className="space-y-2.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  value={editPengawasForm.nama}
                  onChange={(e) => setEditPengawasForm({ ...editPengawasForm, nama: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username Login</label>
                  <input
                    type="text"
                    required
                    value={editPengawasForm.username}
                    onChange={(e) => setEditPengawasForm({ ...editPengawasForm, username: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password / PIN</label>
                  <input
                    type="text"
                    required
                    value={editPengawasForm.password}
                    onChange={(e) => setEditPengawasForm({ ...editPengawasForm, password: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp Pengawas</label>
                <input
                  type="text"
                  required
                  value={editPengawasForm.noHp}
                  onChange={(e) => setEditPengawasForm({ ...editPengawasForm, noHp: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jabatan / Deskripsi Tugas</label>
                <input
                  type="text"
                  value={editPengawasForm.asrama}
                  onChange={(e) => setEditPengawasForm({ ...editPengawasForm, asrama: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl shadow mt-2"
              >
                Simpan Perubahan Pengawas
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL EDIT DATA PERIODE LIBURAN */}
      {/* ================================================================= */}
      {isEditPeriodeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <Edit className="w-4 h-4 text-amber-600" />
                <span>Edit Periode Liburan</span>
              </div>
              <button
                onClick={() => setIsEditPeriodeOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const dMulai = new Date(editPeriodeForm.tanggalMulai);
                const dSelesai = new Date(editPeriodeForm.tanggalSelesai);
                if (dSelesai < dMulai) {
                  alert('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.');
                  return;
                }
                const formattedRentang = `${editPeriodeForm.tanggalMulai} s/d ${editPeriodeForm.tanggalSelesai}`;

                updatePeriode(editPeriodeForm.id, {
                  nama: editPeriodeForm.nama.trim(),
                  tanggalMulai: editPeriodeForm.tanggalMulai,
                  tanggalSelesai: editPeriodeForm.tanggalSelesai,
                  rentangTanggal: formattedRentang,
                  targetPoin: Number(editPeriodeForm.targetPoin) || 400,
                  deskripsiReward: editPeriodeForm.deskripsiReward.trim(),
                  isActive: editPeriodeForm.isActive,
                });
                setIsEditPeriodeOpen(false);
                showNotification(`✅ Periode liburan "${editPeriodeForm.nama}" berhasil diperbarui!`);
              }}
              className="space-y-2.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Periode Liburan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Liburan Ramadhan 1447 H"
                  value={editPeriodeForm.nama}
                  onChange={(e) => setEditPeriodeForm({ ...editPeriodeForm, nama: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              {/* DUAL DATE PICKER: TANGGAL MULAI & TANGGAL SELESAI */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={editPeriodeForm.tanggalMulai}
                    onChange={(e) => setEditPeriodeForm({ ...editPeriodeForm, tanggalMulai: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    min={editPeriodeForm.tanggalMulai}
                    value={editPeriodeForm.tanggalSelesai}
                    onChange={(e) => setEditPeriodeForm({ ...editPeriodeForm, tanggalSelesai: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* DURASI HARI & TARGET HARIAN BADGE */}
              {editPeriodeForm.tanggalMulai && editPeriodeForm.tanggalSelesai && (
                <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-amber-900 font-bold block">
                      📅 Total: {Math.max(1, Math.ceil((new Date(editPeriodeForm.tanggalSelesai).getTime() - new Date(editPeriodeForm.tanggalMulai).getTime()) / (1000 * 60 * 60 * 24)) + 1)} Hari Liburan
                    </span>
                    <span className="text-[10px] text-amber-700">
                      Target: ~{Math.ceil(editPeriodeForm.targetPoin / Math.max(1, Math.ceil((new Date(editPeriodeForm.tanggalSelesai).getTime() - new Date(editPeriodeForm.tanggalMulai).getTime()) / (1000 * 60 * 60 * 24)) + 1))} Poin/Hari
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-1 rounded-lg">
                    {editPeriodeForm.tanggalMulai} s/d {editPeriodeForm.tanggalSelesai}
                  </span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Poin Santri Teladan</label>
                <input
                  type="number"
                  min="50"
                  max="5000"
                  required
                  value={editPeriodeForm.targetPoin}
                  onChange={(e) => setEditPeriodeForm({ ...editPeriodeForm, targetPoin: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Hadiah / Reward</label>
                <textarea
                  rows={3}
                  placeholder="Contoh: 🏆 Sertifikat Santri Teladan + Voucher Beasiswa Kitab..."
                  value={editPeriodeForm.deskripsiReward}
                  onChange={(e) => setEditPeriodeForm({ ...editPeriodeForm, deskripsiReward: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                <input
                  type="checkbox"
                  id="editPeriodeIsActive"
                  checked={editPeriodeForm.isActive}
                  onChange={(e) => setEditPeriodeForm({ ...editPeriodeForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="editPeriodeIsActive" className="text-xs font-semibold text-slate-800 cursor-pointer">
                  Jadikan sebagai Periode Aktif Berjalan
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow mt-2"
              >
                Simpan Perubahan Periode
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL TAMBAH KELOMPOK / HALAQAH BARU */}
      {/* ================================================================= */}
      {isAddKelompokOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span>Tambah Kelompok / Halaqah Baru</span>
              </div>
              <button
                onClick={() => setIsAddKelompokOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateKelompok} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Kelompok / Halaqah</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kelompok Ibnu Abbas (Putra)"
                  value={kelompokForm.nama}
                  onChange={(e) => setKelompokForm({ ...kelompokForm, nama: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Gender</label>
                  <select
                    value={kelompokForm.kategoriGender}
                    onChange={(e) =>
                      setKelompokForm({
                        ...kelompokForm,
                        kategoriGender: e.target.value as 'PUTRA' | 'PUTRI' | 'CAMPUR',
                      })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="PUTRA">PUTRA</option>
                    <option value="PUTRI">PUTRI</option>
                    <option value="CAMPUR">CAMPUR</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Musyrif Penanggung Jawab</label>
                  <select
                    required
                    value={kelompokForm.musyrifId}
                    onChange={(e) => setKelompokForm({ ...kelompokForm, musyrifId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="" disabled>Pilih Musyrif PJ</option>
                    {musyrifList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi / Tingkat / Keterangan</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Halaqah Tahfidz & Kedisiplinan Ibadah Kelas 4 TMI"
                  value={kelompokForm.deskripsi}
                  onChange={(e) => setKelompokForm({ ...kelompokForm, deskripsi: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                ></textarea>
              </div>

              {/* Checklist Santri yang langsung dimasukkan */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700">Pilih Santri Anggota Langsung</label>
                  <span className="text-[10px] text-indigo-700 font-bold">
                    {kelompokForm.santriIds.length} santri terpilih
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50 space-y-1">
                  {santriList.map((s) => {
                    const isChecked = kelompokForm.santriIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center justify-between p-1.5 rounded-lg border cursor-pointer transition text-[11px] ${
                          isChecked
                            ? 'bg-indigo-50 border-indigo-200 font-bold text-indigo-950'
                            : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setKelompokForm({
                                  ...kelompokForm,
                                  santriIds: [...kelompokForm.santriIds, s.id],
                                });
                              } else {
                                setKelompokForm({
                                  ...kelompokForm,
                                  santriIds: kelompokForm.santriIds.filter((id) => id !== s.id),
                                });
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="truncate">{s.nama}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 shrink-0">
                          {s.kelompokNama ? `[${s.kelompokNama}]` : '(Belum ada kelompok)'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow mt-2"
              >
                Buat Kelompok Baru
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL EDIT KELOMPOK / HALAQAH */}
      {/* ================================================================= */}
      {isEditKelompokOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <Edit className="w-4 h-4 text-indigo-600" />
                <span>Edit Kelompok / Halaqah</span>
              </div>
              <button
                onClick={() => setIsEditKelompokOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateKelompokSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Kelompok</label>
                <input
                  type="text"
                  required
                  value={editKelompokForm.nama}
                  onChange={(e) => setEditKelompokForm({ ...editKelompokForm, nama: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Gender</label>
                  <select
                    value={editKelompokForm.kategoriGender}
                    onChange={(e) =>
                      setEditKelompokForm({
                        ...editKelompokForm,
                        kategoriGender: e.target.value as 'PUTRA' | 'PUTRI' | 'CAMPUR',
                      })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="PUTRA">PUTRA</option>
                    <option value="PUTRI">PUTRI</option>
                    <option value="CAMPUR">CAMPUR</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Musyrif Penanggung Jawab</label>
                  <select
                    required
                    value={editKelompokForm.musyrifId}
                    onChange={(e) => setEditKelompokForm({ ...editKelompokForm, musyrifId: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {musyrifList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi / Keterangan</label>
                <textarea
                  rows={2}
                  value={editKelompokForm.deskripsi}
                  onChange={(e) => setEditKelompokForm({ ...editKelompokForm, deskripsi: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                ></textarea>
              </div>

              {/* Checklist Kelola Anggota Santri */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700">Daftar Anggota Santri</label>
                  <span className="text-[10px] text-indigo-700 font-bold">
                    {editKelompokForm.santriIds.length} santri dalam kelompok ini
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50 space-y-1">
                  {santriList.map((s) => {
                    const isChecked = editKelompokForm.santriIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center justify-between p-1.5 rounded-lg border cursor-pointer transition text-[11px] ${
                          isChecked
                            ? 'bg-indigo-50 border-indigo-200 font-bold text-indigo-950'
                            : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditKelompokForm({
                                  ...editKelompokForm,
                                  santriIds: [...editKelompokForm.santriIds, s.id],
                                });
                              } else {
                                setEditKelompokForm({
                                  ...editKelompokForm,
                                  santriIds: editKelompokForm.santriIds.filter((id) => id !== s.id),
                                });
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="truncate">{s.nama}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 shrink-0">
                          {s.kelompokId === editKelompokForm.id
                            ? 'Anggota'
                            : s.kelompokNama
                            ? `Kelompok: ${s.kelompokNama}`
                            : 'Tanpa kelompok'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow mt-2"
              >
                Simpan Perubahan Kelompok
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL PINDAH / MASUKKAN SANTRI KE KELOMPOK */}
      {/* ================================================================= */}
      {isMoveSantriModalOpen && targetSantriForMove && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                <span>Pindahkan Santri ke Kelompok</span>
              </div>
              <button
                onClick={() => setIsMoveSantriModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleMoveSantriSubmit} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2.5">
                <img
                  src={
                    targetSantriForMove.avatarUrl ||
                    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={targetSantriForMove.nama}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <span className="font-bold text-slate-900 block text-xs">{targetSantriForMove.nama}</span>
                  <span className="text-[10px] text-slate-500">
                    Saat ini: {targetSantriForMove.kelompokNama ? targetSantriForMove.kelompokNama : 'Belum Ada Kelompok'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Kelompok Tujuan</label>
                <select
                  value={targetKelompokSelected}
                  onChange={(e) => setTargetKelompokSelected(e.target.value)}
                  className="w-full p-2.5 bg-white border border-indigo-300 rounded-xl text-indigo-950 font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="__REMOVE__">-- Keluarkan dari Kelompok (Hapus Anggota) --</option>
                  {kelompokList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama} (PJ: {k.musyrifNama})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow mt-2"
              >
                Simpan Penempatan Kelompok
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
