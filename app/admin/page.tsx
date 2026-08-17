'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { MOCK_REWARD_PERIODE, MockKegiatan } from '@/lib/mock-data';

export default function AdminPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const {
    kegiatanList,
    allUsers,
    santriList,
    musyrifList,
    pengawasList,
    laporanList,
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
  } = useStore();

  const [activeTab, setActiveTab] = useState<'kegiatan' | 'musyrif' | 'santri' | 'periode'>('santri');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'SANTRI' | 'MUSYRIF' | 'PENGAWAS' | 'SUPER_ADMIN'>('ALL');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [editableKegiatan, setEditableKegiatan] = useState<MockKegiatan[]>(kegiatanList);
  const [targetPoinReward, setTargetPoinReward] = useState(MOCK_REWARD_PERIODE.targetPoin);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Modal Tambah Musyrif
  const [isAddMusyrifOpen, setIsAddMusyrifOpen] = useState(false);
  const [musyrifForm, setMusyrifForm] = useState({
    nama: '',
    username: '',
    noHp: '',
    password: '123',
    asrama: 'Musyrif Halaqoh Abu Bakar',
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
    asrama: 'Kelas 4 TMI / Halaqoh Abu Bakar',
    musyrifId: musyrifList[0]?.id || 'user-musyrif-1',
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
    rentangTanggal: '',
    targetPoin: 450,
    deskripsiReward: '',
    isActive: false,
  });

  // Modal Edit Periode
  const [isEditPeriodeOpen, setIsEditPeriodeOpen] = useState(false);
  const [editPeriodeForm, setEditPeriodeForm] = useState({
    id: '',
    nama: '',
    rentangTanggal: '',
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
  });

  // Modal Edit Musyrif
  const [isEditMusyrifOpen, setIsEditMusyrifOpen] = useState(false);
  const [editMusyrifForm, setEditMusyrifForm] = useState({
    id: '',
    nama: '',
    username: '',
    noHp: '',
    password: '',
    asrama: '',
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

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

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
      alert('Harap isi semua kolom.');
      return;
    }
    addMusyrif(musyrifForm);
    setIsAddMusyrifOpen(false);
    setMusyrifForm({
      nama: '',
      username: '',
      noHp: '',
      password: '123',
      asrama: 'Musyrif Asrama Abu Bakar',
    });
    showNotification('✅ Akun Musyrif baru berhasil dibuat & siap bertugas!');
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
    addSantri(santriForm);
    setIsAddSantriOpen(false);
    setSantriForm({
      nama: '',
      username: '',
      noHp: '',
      password: '123',
      asrama: 'Kelas 4 TMI / Asrama Abu Bakar',
      musyrifId: musyrifList[0]?.id || 'user-musyrif-1',
    });
    showNotification('✅ Akun Santri berhasil didaftarkan & disambungkan ke Musyrif!');
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
                {user?.nama || 'Ustadz H. Ahmad Fauzi, Lc.'}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            title="Keluar"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-teal-200 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
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
              {allUsers
                .filter((u) => {
                  const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
                  const matchQuery =
                    userSearchQuery === '' ||
                    u.nama.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                    u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                    u.noHp.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                    (u.asrama && u.asrama.toLowerCase().includes(userSearchQuery.toLowerCase()));
                  return matchRole && matchQuery;
                })
                .map((u) => {
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
                            <div className="text-[10px] text-slate-500 truncate">{u.asrama || u.pondokNama}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {u.role === 'SANTRI' && (
                            <span className="text-xs font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
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
                                });
                                setIsEditSantriOpen(true);
                              } else if (u.role === 'MUSYRIF') {
                                setEditMusyrifForm({
                                  id: u.id,
                                  nama: u.nama,
                                  username: u.username,
                                  noHp: u.noHp,
                                  password: u.password,
                                  asrama: u.asrama || '',
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

                      {/* Khusus Santri: Selector Musyrif Pembimbing */}
                      {u.role === 'SANTRI' && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                            <LinkIcon className="w-3.5 h-3.5 text-teal-600" />
                            <span>Musyrif Pembimbing:</span>
                          </div>

                          <select
                            value={u.musyrifId || ''}
                            onChange={(e) => handleAssignMusyrif(u.id, e.target.value)}
                            className="text-xs py-1 px-2 bg-white border border-teal-300 rounded-lg text-teal-900 font-bold focus:ring-1 focus:ring-teal-500 shadow-xs"
                          >
                            <option value="" disabled>Pilih Musyrif</option>
                            {musyrifList.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.nama} ({m.asrama ? m.asrama.split(' ')[1] || 'Musyrif' : 'Musyrif'})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: DATA MUSYRIF / PENGURUS & SANTRI BINAAN */}
        {/* ================================================================= */}
        {activeTab === 'musyrif' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Daftar Musyrif / Pengurus ({musyrifList.length})
                </h3>
                <p className="text-[10px] text-slate-500">Penanggung jawab validasi & reminder santri</p>
              </div>
              <button
                onClick={() => setIsAddMusyrifOpen(true)}
                className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Musyrif</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {musyrifList.map((musyrif) => {
                const binaan = santriList.filter((s) => s.musyrifId === musyrif.id || s.musyrifNama === musyrif.nama);

                return (
                  <div
                    key={musyrif.id}
                    className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={musyrif.avatarUrl}
                          alt={musyrif.nama}
                          className="w-10 h-10 rounded-full object-cover border border-amber-400 shrink-0"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-800">{musyrif.nama}</div>
                          <div className="text-[10px] text-slate-400">
                            Username: <span className="font-mono font-bold text-slate-600">{musyrif.username}</span> • PIN: <span className="font-mono font-bold text-slate-600">{musyrif.password}</span>
                          </div>
                          <div className="text-[10px] text-amber-700 font-semibold">{musyrif.asrama}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                          {binaan.length} Santri Binaan
                        </span>

                        {/* Tombol Edit Musyrif */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditMusyrifForm({
                              id: musyrif.id,
                              nama: musyrif.nama,
                              username: musyrif.username,
                              noHp: musyrif.noHp,
                              password: musyrif.password,
                              asrama: musyrif.asrama || '',
                            });
                            setIsEditMusyrifOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-800 transition"
                          title="Edit Data Musyrif"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Tombol Hapus Musyrif */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Hapus data akun musyrif "${musyrif.nama}"?`)) {
                              deleteUser(musyrif.id);
                              showNotification(`🗑️ Akun musyrif ${musyrif.nama} berhasil dihapus.`);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                          title="Hapus Musyrif"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* List Santri Binaan yang diasuh */}
                    <div className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                          Santri yang Dipertanggungjawabkan:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMusyrifForAssign(musyrif);
                            setIsAssignModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/80 hover:bg-amber-200 px-2 py-0.5 rounded-lg border border-amber-300 transition"
                        >
                          <LinkIcon className="w-3 h-3 text-amber-700" />
                          <span>+ Hubungkan Santri</span>
                        </button>
                      </div>

                      {binaan.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic py-1">Belum ada santri yang ditugaskan ke Musyrif ini. Klik tombol "+ Hubungkan Santri" di atas.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {binaan.map((b) => (
                            <span
                              key={b.id}
                              className="text-[10px] bg-white border border-slate-200 text-slate-700 pl-2 pr-1 py-0.5 rounded-lg shadow-2xs font-medium flex items-center gap-1.5"
                            >
                              <span>👤 {b.nama}</span>
                              <button
                                type="button"
                                onClick={() => handleAssignMusyrif(b.id, '')}
                                title="Lepas santri dari musyrif ini"
                                className="w-3.5 h-3.5 rounded-full hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center text-[9px] font-bold"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: MANAJEMEN KEGIATAN (WAJIB / SUNNAH & ATUR POIN) */}
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
              {kegiatanList
                .filter((keg) => {
                  if (kegiatanFilter === 'WAJIB') return keg.isWajib;
                  if (kegiatanFilter === 'SUNNAH') return !keg.isWajib;
                  return true;
                })
                .map((keg) => (
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
                            {keg.isWajib ? '★ Wajib' : '☆ Sunnah'}
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
                            showNotification('🗑️ Kegiatan berhasil dihapus.');
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
                          <span className="text-teal-600 font-bold">s/d</span>
                          <input
                            type="time"
                            defaultValue={keg.jamSelesai || '06:00'}
                            onChange={(e) => {
                              const selesai = e.target.value;
                              updateKegiatanTime(keg.id, true, keg.jamMulai || '04:30', selesai);
                            }}
                            className="bg-white border border-teal-300 rounded px-1.5 py-0.5 text-xs font-bold text-teal-950"
                          />
                          <span className="text-[10px] font-bold text-teal-700">WIB</span>
                        </div>
                      </div>
                    )}

                    {/* Live Edit Poin Langsung */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between bg-slate-50 p-2 rounded-xl">
                      <span className="text-[11px] font-semibold text-slate-600">
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
                ))}
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
                            rentangTanggal: periode.rentangTanggal,
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
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-3 py-2">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1 text-center">
          <button
            type="button"
            onClick={() => setActiveTab('santri')}
            className={`py-1.5 px-1 rounded-2xl transition flex flex-col items-center gap-0.5 ${
              activeTab === 'santri'
                ? 'bg-teal-50 text-teal-800 font-extrabold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === 'santri' ? 'text-teal-700 stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">Data Santri</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('musyrif')}
            className={`py-1.5 px-1 rounded-2xl transition flex flex-col items-center gap-0.5 ${
              activeTab === 'musyrif'
                ? 'bg-teal-50 text-teal-800 font-extrabold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className={`w-4 h-4 ${activeTab === 'musyrif' ? 'text-teal-700 stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">Data Musyrif</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kegiatan')}
            className={`py-1.5 px-1 rounded-2xl transition flex flex-col items-center gap-0.5 ${
              activeTab === 'kegiatan'
                ? 'bg-teal-50 text-teal-800 font-extrabold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${activeTab === 'kegiatan' ? 'text-teal-700 stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">Bobot Poin</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('periode')}
            className={`py-1.5 px-1 rounded-2xl transition flex flex-col items-center gap-0.5 ${
              activeTab === 'periode'
                ? 'bg-teal-50 text-teal-800 font-extrabold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className={`w-4 h-4 ${activeTab === 'periode' ? 'text-teal-700 stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">Periode Reward</span>
          </button>
        </div>
      </nav>

      {/* ================================================================= */}
      {/* MODAL TAMBAH SANTRI & SAMBUNGKAN KE MUSYRIF */}
      {/* ================================================================= */}
      {isAddSantriOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200">
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
                <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp Santri / Wali</label>
                <input
                  type="text"
                  required
                  placeholder="0812XXXXXXXX"
                  value={santriForm.noHp}
                  onChange={(e) => setSantriForm({ ...santriForm, noHp: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kelas & Halaqoh</label>
                <input
                  type="text"
                  placeholder="Kelas 3 TMI / Halaqoh Abu Bakar"
                  value={santriForm.asrama}
                  onChange={(e) => setSantriForm({ ...santriForm, asrama: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* DROPDOWN KAITKAN KE MUSYRIF */}
              <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-200">
                <label className="block font-bold text-teal-900 mb-1 flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5 text-teal-700" />
                  <span>Kaitkan ke Musyrif Penanggung Jawab</span>
                </label>
                <select
                  value={santriForm.musyrifId}
                  onChange={(e) => setSantriForm({ ...santriForm, musyrifId: e.target.value })}
                  className="w-full p-2 bg-white border border-teal-300 rounded-xl text-teal-950 font-bold focus:ring-2 focus:ring-teal-500"
                >
                  {musyrifList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama} ({m.asrama || 'Musyrif'})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow mt-2"
              >
                Simpan & Sambungkan Santri
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL TAMBAH MUSYRIF */}
      {/* ================================================================= */}
      {isAddMusyrifOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <UserCheck className="w-5 h-5 text-amber-600" />
                <span>Buat Akun Musyrif Baru</span>
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
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username Login</label>
                  <input
                    type="text"
                    required
                    placeholder="musyrif.zulfikar"
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tugas / Halaqoh Binaan</label>
                <input
                  type="text"
                  placeholder="Musyrif Halaqoh Usman Bin Affan"
                  value={musyrifForm.asrama}
                  onChange={(e) => setMusyrifForm({ ...musyrifForm, asrama: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
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
                if (!periodeForm.nama || !periodeForm.rentangTanggal) return;
                addPeriode(periodeForm);
                setIsAddPeriodeOpen(false);
                setPeriodeForm({
                  nama: '',
                  rentangTanggal: '',
                  targetPoin: 450,
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rentang Tanggal Pelaksanaan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 15 Maret - 08 April 2026"
                  value={periodeForm.rentangTanggal}
                  onChange={(e) => setPeriodeForm({ ...periodeForm, rentangTanggal: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

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
                updateUser(editSantriForm.id, {
                  nama: editSantriForm.nama.trim(),
                  username: editSantriForm.username.trim(),
                  noHp: editSantriForm.noHp.trim(),
                  password: editSantriForm.password.trim(),
                  asrama: editSantriForm.asrama.trim(),
                  musyrifId: editSantriForm.musyrifId,
                });
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kelas & Halaqoh</label>
                <input
                  type="text"
                  value={editSantriForm.asrama}
                  onChange={(e) => setEditSantriForm({ ...editSantriForm, asrama: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* DROPDOWN KAITKAN KE MUSYRIF */}
              <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-200">
                <label className="block font-bold text-teal-900 mb-1 flex items-center gap-1">
                  <LinkIcon className="w-3.5 h-3.5 text-teal-700" />
                  <span>Musyrif Penanggung Jawab</span>
                </label>
                <select
                  value={editSantriForm.musyrifId}
                  onChange={(e) => setEditSantriForm({ ...editSantriForm, musyrifId: e.target.value })}
                  className="w-full p-2 bg-white border border-teal-300 rounded-xl text-teal-950 font-bold focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Belum Ditugaskan --</option>
                  {musyrifList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama} ({m.asrama || 'Musyrif'})
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
                  asrama: editMusyrifForm.asrama.trim(),
                });
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tugas / Halaqoh Binaan</label>
                <input
                  type="text"
                  value={editMusyrifForm.asrama}
                  onChange={(e) => setEditMusyrifForm({ ...editMusyrifForm, asrama: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
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
                updatePeriode(editPeriodeForm.id, {
                  nama: editPeriodeForm.nama.trim(),
                  rentangTanggal: editPeriodeForm.rentangTanggal.trim(),
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rentang Tanggal</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 01 Maret - 25 Maret 2026"
                  value={editPeriodeForm.rentangTanggal}
                  onChange={(e) => setEditPeriodeForm({ ...editPeriodeForm, rentangTanggal: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

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
    </div>
  );
}
