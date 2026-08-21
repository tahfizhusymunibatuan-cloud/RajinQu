'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  MOCK_LAPORAN,
  MOCK_USERS,
  MOCK_KEGIATAN,
  MOCK_PERIODE_LIST,
  MOCK_KELOMPOK,
  MockLaporan,
  MockUser,
  MockKegiatan,
  MockPeriodeLiburan,
  MockKelompok,
} from './mock-data';
import { notifyMusyrifNewReport, notifySantriReportStatus, sendDailyReminderToSantri } from './whatsapp';
import { getWIBTimeString, checkWaktuKegiatan } from './time-wib';

interface StoreContextType {
  laporanList: MockLaporan[];
  allUsers: MockUser[];
  santriList: MockUser[];
  musyrifList: MockUser[];
  pengawasList: MockUser[];
  kegiatanList: MockKegiatan[];
  periodeList: MockPeriodeLiburan[];
  kelompokList: MockKelompok[];
  activePeriode: MockPeriodeLiburan | undefined;
  isLoadingDb: boolean;
  syncFromDatabase: () => Promise<void>;
  addLaporan: (newLaporan: Omit<MockLaporan, 'id' | 'createdAt' | 'likesCount' | 'isLikedByUser' | 'comments' | 'status' | 'statusWaktu' | 'waktuLaporWIB'>) => Promise<MockLaporan>;
  approveLaporan: (laporanId: string, catatanPengurus?: string, customPoin?: number) => void;
  rejectLaporan: (laporanId: string, catatanPengurus: string, reviewerName?: string) => void;
  toggleLike: (laporanId: string, userId: string) => void;
  addComment: (laporanId: string, user: MockUser, text: string) => void;
  broadcastReminder: (santriId: string) => Promise<{ success: boolean; message: string }>;
  addMusyrif: (data: { nama: string; username: string; noHp: string; password: string; asrama?: string; kelompokId?: string }) => void;
  addPengawas: (data: { nama: string; username: string; noHp: string; password: string; asrama?: string }) => void;
  addSantri: (data: { nama: string; username: string; noHp: string; password: string; asrama?: string; musyrifId?: string; kelompokId?: string }) => void;
  updateSantriMusyrif: (santriId: string, musyrifId: string) => void;
  updateUser: (userId: string, data: Partial<MockUser>) => void;
  deleteUser: (userId: string) => void;
  addKegiatan: (data: Omit<MockKegiatan, 'id'>) => void;
  updateKegiatan: (id: string, data: Partial<MockKegiatan>) => Promise<void>;
  updateKegiatanPoin: (id: string, newPoin: number) => void;
  toggleKegiatanWajib: (id: string) => void;
  updateKegiatanTime: (id: string, isTimeRestricted: boolean, jamMulai?: string, jamSelesai?: string) => void;
  deleteKegiatan: (id: string) => void;
  addPeriode: (data: Omit<MockPeriodeLiburan, 'id'>) => void;
  updatePeriode: (id: string, data: Partial<MockPeriodeLiburan>) => void;
  togglePeriodeActive: (id: string) => void;
  deletePeriode: (id: string) => void;
  addKelompok: (data: { nama: string; deskripsi?: string; musyrifId: string; santriIds?: string[]; kategoriGender?: 'PUTRA' | 'PUTRI' | 'CAMPUR' }) => void;
  updateKelompok: (id: string, data: Partial<MockKelompok>) => void;
  deleteKelompok: (id: string) => void;
  assignSantriToKelompok: (santriId: string, kelompokId: string) => void;
  removeSantriFromKelompok: (santriId: string) => void;
  resetDemoData: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [laporanList, setLaporanList] = useState<MockLaporan[]>(MOCK_LAPORAN);
  const [allUsers, setAllUsers] = useState<MockUser[]>(MOCK_USERS);
  const [kegiatanList, setKegiatanList] = useState<MockKegiatan[]>(MOCK_KEGIATAN);
  const [periodeList, setPeriodeList] = useState<MockPeriodeLiburan[]>(MOCK_PERIODE_LIST);
  const [kelompokList, setKelompokList] = useState<MockKelompok[]>(MOCK_KELOMPOK);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(false);

  // Helper Save & Sync ke LocalStorage
  const saveUsers = (list: MockUser[]) => {
    setAllUsers(list);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rajinqu_users', JSON.stringify(list));
    }
  };

  const saveLaporan = (list: MockLaporan[]) => {
    setLaporanList(list);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rajinqu_laporan', JSON.stringify(list));
    }
  };

  const saveKegiatan = (list: MockKegiatan[]) => {
    setKegiatanList(list);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rajinqu_kegiatan', JSON.stringify(list));
    }
  };

  const saveKelompok = (list: MockKelompok[]) => {
    setKelompokList(list);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rajinqu_kelompok', JSON.stringify(list));
    }
  };

  const savePeriode = (list: MockPeriodeLiburan[]) => {
    setPeriodeList(list);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rajinqu_periode', JSON.stringify(list));
    }
  };

  // Fungsi Sinkronisasi Data Riil Super Cepat dari PostgreSQL Neon DB via Batch API (/api/sync)
  const syncFromDatabase = useCallback(async () => {
    try {
      setIsLoadingDb(true);
      const res = await fetch('/api/sync');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const { users, kegiatan, kelompok, periode, laporan } = json.data;
          if (Array.isArray(users) && users.length > 0) saveUsers(users);
          if (Array.isArray(kegiatan)) saveKegiatan(kegiatan);
          if (Array.isArray(kelompok)) saveKelompok(kelompok);
          if (Array.isArray(periode)) savePeriode(periode);
          if (Array.isArray(laporan)) saveLaporan(laporan);
        }
      }
    } catch (err) {
      console.warn('Sync from DB fallback to local cache:', err);
    } finally {
      setIsLoadingDb(false);
    }
  }, []);

  useEffect(() => {
    // 1. Muat dari LocalStorage terlebih dahulu agar UI instan
    if (typeof window !== 'undefined') {
      const savedUsers = localStorage.getItem('rajinqu_users');
      if (savedUsers) {
        try {
          setAllUsers(JSON.parse(savedUsers));
        } catch (e) {}
      }

      const savedKelompok = localStorage.getItem('rajinqu_kelompok');
      if (savedKelompok) {
        try {
          setKelompokList(JSON.parse(savedKelompok));
        } catch (e) {}
      }

      const savedLaporan = localStorage.getItem('rajinqu_laporan');
      if (savedLaporan) {
        try {
          setLaporanList(JSON.parse(savedLaporan));
        } catch (e) {}
      }

      const savedKegiatan = localStorage.getItem('rajinqu_kegiatan');
      if (savedKegiatan) {
        try {
          setKegiatanList(JSON.parse(savedKegiatan));
        } catch (e) {}
      }

      const savedPeriode = localStorage.getItem('rajinqu_periode');
      if (savedPeriode) {
        try {
          setPeriodeList(JSON.parse(savedPeriode));
        } catch (e) {}
      }
    }

    // 2. Jalankan sinkronisasi database Neon PostgreSQL di background
    syncFromDatabase();
  }, [syncFromDatabase]);

  // Kalkulasi Dynamic Real-Time Ranking & Selisih Poin untuk Seluruh Santri
  const enrichedAllUsers = React.useMemo(() => {
    const santriOnly = allUsers.filter((u) => u.role === 'SANTRI');

    // Count approved reports per santri for tie-breaker
    const approvedCountMap = new Map<string, number>();
    laporanList.forEach((lap) => {
      if (lap.status === 'APPROVED') {
        if (lap.userId) {
          approvedCountMap.set(lap.userId, (approvedCountMap.get(lap.userId) || 0) + 1);
        }
        if (lap.userNama) {
          approvedCountMap.set(lap.userNama, (approvedCountMap.get(lap.userNama) || 0) + 1);
        }
      }
    });

    // Sort santri by totalPoin descending -> approvedCount -> name
    const sortedSantri = [...santriOnly].sort((a, b) => {
      const poinA = a.totalPoin || 0;
      const poinB = b.totalPoin || 0;
      if (poinB !== poinA) return poinB - poinA;

      const appA = approvedCountMap.get(a.id) || approvedCountMap.get(a.nama) || 0;
      const appB = approvedCountMap.get(b.id) || approvedCountMap.get(b.nama) || 0;
      if (appB !== appA) return appB - appA;

      return a.nama.localeCompare(b.nama);
    });

    // Map rank info
    const rankMap = new Map<string, { peringkat: number; selisihPeringkat: number }>();
    sortedSantri.forEach((santri, index) => {
      const peringkat = index + 1;
      const prevSantri = index > 0 ? sortedSantri[index - 1] : null;
      const prevPoin = prevSantri ? (prevSantri.totalPoin || 0) : (santri.totalPoin || 0);
      const selisihPeringkat = prevPoin - (santri.totalPoin || 0);

      rankMap.set(santri.id, { peringkat, selisihPeringkat });
      if (santri.nama) {
        rankMap.set(santri.nama, { peringkat, selisihPeringkat });
      }
    });

    return allUsers.map((u) => {
      if (u.role === 'SANTRI') {
        const info = rankMap.get(u.id) || rankMap.get(u.nama);
        return {
          ...u,
          peringkat: info ? info.peringkat : (u.peringkat || 1),
          selisihPeringkat: info ? info.selisihPeringkat : 0,
        };
      }
      return u;
    });
  }, [allUsers, laporanList]);

  const santriList = React.useMemo(() => {
    return enrichedAllUsers.filter((u) => u.role === 'SANTRI');
  }, [enrichedAllUsers]);

  const musyrifList = enrichedAllUsers.filter((u) => u.role === 'MUSYRIF');
  const pengawasList = enrichedAllUsers.filter((u) => u.role === 'PENGAWAS');
  const activePeriode = periodeList.find((p) => p.isActive) || periodeList[0];

  // ==========================================
  // AKSI USER / PENGGUNA (POSTGRESQL NEON DB)
  // ==========================================

  const addMusyrif = async (data: {
    nama: string;
    username: string;
    noHp: string;
    password: string;
    asrama?: string;
    kelompokId?: string;
  }) => {
    const newMusyrifId = `user-musyrif-${Date.now()}`;
    const newMusyrif: MockUser = {
      id: newMusyrifId,
      username: data.username.trim().toLowerCase(),
      noHp: data.noHp.trim(),
      password: data.password.trim(),
      nama: data.nama.trim(),
      role: 'MUSYRIF',
      avatarUrl: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80`,
      pondokNama: 'PTQA BATUAN',
      asrama: 'Musyrif PPTQ Batuan',
      totalPoin: 0,
    };

    let updatedUsers = [...allUsers, newMusyrif];

    if (data.kelompokId) {
      const updatedKelompok = kelompokList.map((k) => {
        if (k.id === data.kelompokId) {
          return {
            ...k,
            musyrifId: newMusyrifId,
            musyrifNama: data.nama.trim(),
          };
        }
        return k;
      });
      saveKelompok(updatedKelompok);

      updatedUsers = updatedUsers.map((u) => {
        if (u.kelompokId === data.kelompokId) {
          return {
            ...u,
            musyrifId: newMusyrifId,
            musyrifNama: data.nama.trim(),
          };
        }
        return u;
      });
    }

    saveUsers(updatedUsers);

    // Kirim ke database PostgreSQL Neon
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newMusyrifId,
          username: newMusyrif.username,
          noHp: newMusyrif.noHp,
          password: newMusyrif.password,
          nama: newMusyrif.nama,
          role: 'MUSYRIF',
          kelompokId: data.kelompokId || null,
        }),
      });

      if (data.kelompokId) {
        await fetch('/api/kelompok', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: data.kelompokId,
            musyrifId: newMusyrifId,
          }),
        });
      }
    } catch (e) {
      console.error('Failed to sync new musyrif to DB:', e);
    }
  };

  const addPengawas = async (data: {
    nama: string;
    username: string;
    noHp: string;
    password: string;
    asrama?: string;
  }) => {
    const newPengawasId = `user-pengawas-${Date.now()}`;
    const newPengawas: MockUser = {
      id: newPengawasId,
      username: data.username.trim().toLowerCase(),
      noHp: data.noHp.trim(),
      password: data.password.trim(),
      nama: data.nama.trim(),
      role: 'PENGAWAS',
      avatarUrl: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80`,
      pondokNama: 'PTQA BATUAN',
      asrama: 'Pengawas Kesantrian',
      totalPoin: 0,
    };
    saveUsers([...allUsers, newPengawas]);

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newPengawasId,
          username: newPengawas.username,
          noHp: newPengawas.noHp,
          password: newPengawas.password,
          nama: newPengawas.nama,
          role: 'PENGAWAS',
        }),
      });
    } catch (e) {
      console.error('Failed to sync new pengawas to DB:', e);
    }
  };

  const addSantri = async (data: {
    nama: string;
    username: string;
    noHp: string;
    password: string;
    asrama?: string;
    musyrifId?: string;
    kelompokId?: string;
  }) => {
    let finalMusyrifId = data.musyrifId || '';
    let finalMusyrifNama = 'Belum Ditugaskan';
    let finalKelompokId = data.kelompokId || undefined;
    let finalKelompokNama: string | undefined = undefined;

    if (data.kelompokId) {
      const kel = kelompokList.find((k) => k.id === data.kelompokId);
      if (kel) {
        finalKelompokNama = kel.nama;
        finalMusyrifId = kel.musyrifId;
        finalMusyrifNama = kel.musyrifNama;
      }
    } else if (data.musyrifId) {
      const selectedMusyrif = allUsers.find((u) => u.id === data.musyrifId);
      if (selectedMusyrif) {
        finalMusyrifNama = selectedMusyrif.nama;
      }
    }

    const newSantriId = `user-santri-${Date.now()}`;
    const newSantri: MockUser = {
      id: newSantriId,
      username: data.username.trim(),
      noHp: data.noHp.trim(),
      password: data.password.trim(),
      nama: data.nama.trim(),
      role: 'SANTRI',
      avatarUrl: `https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80`,
      pondokNama: 'PTQA BATUAN',
      musyrifId: finalMusyrifId,
      musyrifNama: finalMusyrifNama,
      kelompokId: finalKelompokId,
      kelompokNama: finalKelompokNama,
      asrama: data.asrama,
      totalPoin: 0,
      peringkat: santriList.length + 1,
      selisihPeringkat: 0,
    };

    saveUsers([...allUsers, newSantri]);

    if (finalKelompokId) {
      const updatedKelompokList = kelompokList.map((k) => {
        if (k.id === finalKelompokId) {
          return {
            ...k,
            santriIds: Array.from(new Set([...k.santriIds, newSantriId])),
          };
        }
        return k;
      });
      saveKelompok(updatedKelompokList);
    }

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newSantriId,
          username: newSantri.username,
          noHp: newSantri.noHp,
          password: newSantri.password,
          nama: newSantri.nama,
          role: 'SANTRI',
          musyrifId: finalMusyrifId || null,
          kelompokId: finalKelompokId || null,
        }),
      });
    } catch (e) {
      console.error('Failed to sync new santri to DB:', e);
    }
  };

  const updateSantriMusyrif = async (santriId: string, musyrifId: string) => {
    const targetMusyrif = allUsers.find((u) => u.id === musyrifId);
    const updated = allUsers.map((u) => {
      if (u.id === santriId) {
        return {
          ...u,
          musyrifId: musyrifId,
          musyrifNama: targetMusyrif ? targetMusyrif.nama : 'Belum Ditugaskan',
        };
      }
      return u;
    });
    saveUsers(updated);

    try {
      await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: santriId, musyrifId }),
      });
    } catch (e) {
      console.error('Failed to update santri musyrif in DB:', e);
    }
  };

  const updateUser = async (userId: string, data: Partial<MockUser>) => {
    const existingUser = allUsers.find((u) => u.id === userId);
    let targetMusyrifNama: string | undefined = undefined;

    let resolvedMusyrifId = data.musyrifId !== undefined ? data.musyrifId : existingUser?.musyrifId;
    let resolvedKelompokId = data.kelompokId !== undefined ? data.kelompokId : existingUser?.kelompokId;

    // Jika kelompokId diisi/diubah namun musyrifId belum ditentukan, ambil musyrif penanggung jawab dari kelompok tsb
    if (resolvedKelompokId && !data.musyrifId) {
      const targetKel = kelompokList.find((k) => k.id === resolvedKelompokId);
      if (targetKel?.musyrifId) {
        resolvedMusyrifId = targetKel.musyrifId;
      }
    }

    if (resolvedMusyrifId) {
      const targetMusyrif = allUsers.find((u) => u.id === resolvedMusyrifId);
      targetMusyrifNama = targetMusyrif ? targetMusyrif.nama : 'Belum Ditugaskan';
    }

    let updatedUserObj: MockUser | null = null;
    const updatedUsers = allUsers.map((u) => {
      if (u.id === userId) {
        let newKelompokNama = u.kelompokNama;
        if (resolvedKelompokId !== undefined) {
          const kObj = kelompokList.find((k) => k.id === resolvedKelompokId);
          newKelompokNama = kObj ? kObj.nama : undefined;
        }

        updatedUserObj = {
          ...u,
          ...data,
          musyrifId: resolvedMusyrifId,
          musyrifNama: targetMusyrifNama !== undefined ? targetMusyrifNama : u.musyrifNama,
          kelompokId: resolvedKelompokId,
          kelompokNama: newKelompokNama,
        };
        return updatedUserObj;
      }

      // Jika Musyrif yang di-update namanya, perbarui musyrifNama pada santri binaannya
      if (existingUser?.role === 'MUSYRIF' && data.nama && u.musyrifId === userId) {
        return {
          ...u,
          musyrifNama: data.nama.trim(),
        };
      }

      return u;
    });

    saveUsers(updatedUsers);

    // Sinkronkan ke kelompokList secara otomatis (dua arah)
    if (data.kelompokId !== undefined || (existingUser?.role === 'MUSYRIF' && data.nama)) {
      const updatedKelompokList = kelompokList.map((k) => {
        let item = { ...k };
        // Jika nama musyrif berubah
        if (item.musyrifId === userId && data.nama) {
          item.musyrifNama = data.nama.trim();
        }
        // Sinkronkan keanggotaan santriIds
        if (resolvedKelompokId && item.id === resolvedKelompokId) {
          item.santriIds = Array.from(new Set([...item.santriIds, userId]));
        } else {
          item.santriIds = item.santriIds.filter((sid) => sid !== userId);
        }
        return item;
      });
      saveKelompok(updatedKelompokList);
    }

    if (typeof window !== 'undefined' && updatedUserObj) {
      const currentAuth = localStorage.getItem('rajinqu_auth_user');
      if (currentAuth) {
        try {
          const parsed = JSON.parse(currentAuth);
          if (parsed.id === userId) {
            localStorage.setItem('rajinqu_auth_user', JSON.stringify(updatedUserObj));
            localStorage.setItem('rajinqu_session', JSON.stringify(updatedUserObj));
          }
        } catch (e) {}
      }
    }

    try {
      await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          ...data,
          musyrifId: resolvedMusyrifId || null,
          kelompokId: resolvedKelompokId || null,
        }),
      });
    } catch (e) {
      console.error('Failed to update user in DB:', e);
    }
  };

  const deleteUser = async (userId: string) => {
    const updated = allUsers.filter((u) => u.id !== userId);
    saveUsers(updated);

    try {
      await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error('Failed to delete user in DB:', e);
    }
  };

  // ==========================================
  // AKSI KELOMPOK (POSTGRESQL NEON DB)
  // ==========================================

  const addKelompok = async (data: {
    nama: string;
    deskripsi?: string;
    musyrifId: string;
    santriIds?: string[];
    kategoriGender?: 'PUTRA' | 'PUTRI' | 'CAMPUR';
  }) => {
    const newId = `kelompok-${Date.now()}`;
    const pjMusyrif = allUsers.find((u) => u.id === data.musyrifId);
    const musyrifNama = pjMusyrif ? pjMusyrif.nama : 'Belum Ditentukan';
    const santriIds = data.santriIds || [];

    const newKelompok: MockKelompok = {
      id: newId,
      nama: data.nama.trim(),
      deskripsi: data.deskripsi?.trim() || '',
      musyrifId: data.musyrifId,
      musyrifNama: musyrifNama,
      santriIds: santriIds,
      kategoriGender: data.kategoriGender || 'CAMPUR',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updatedKelompokList = [...kelompokList, newKelompok];
    saveKelompok(updatedKelompokList);

    if (santriIds.length > 0) {
      const updatedUsers = allUsers.map((u) => {
        if (santriIds.includes(u.id)) {
          return {
            ...u,
            kelompokId: newId,
            kelompokNama: newKelompok.nama,
            musyrifId: data.musyrifId,
            musyrifNama: musyrifNama,
          };
        }
        return u;
      });
      saveUsers(updatedUsers);
    }

    try {
      await fetch('/api/kelompok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId,
          nama: data.nama,
          deskripsi: data.deskripsi,
          musyrifId: data.musyrifId,
          santriIds: santriIds,
        }),
      });
    } catch (e) {
      console.error('Failed to create kelompok in DB:', e);
    }
  };

  const updateKelompok = async (id: string, data: Partial<MockKelompok>) => {
    const currentKel = kelompokList.find((k) => k.id === id);
    if (!currentKel) return;

    let newMusyrifNama = currentKel.musyrifNama;
    if (data.musyrifId && data.musyrifId !== currentKel.musyrifId) {
      const targetM = allUsers.find((u) => u.id === data.musyrifId);
      newMusyrifNama = targetM ? targetM.nama : currentKel.musyrifNama;
    }

    const updatedKelompok: MockKelompok = {
      ...currentKel,
      ...data,
      musyrifNama: newMusyrifNama,
    };

    const finalSantriIds = data.santriIds !== undefined ? data.santriIds : currentKel.santriIds;
    const finalMusyrifId = data.musyrifId !== undefined ? data.musyrifId : currentKel.musyrifId;

    // Bersihkan santri yang baru dimasukkan ke kelompok ini dari kelompok-kelompok lainnya
    const updatedList = kelompokList.map((k) => {
      if (k.id === id) {
        return {
          ...updatedKelompok,
          santriIds: finalSantriIds,
        };
      } else if (data.santriIds !== undefined) {
        return {
          ...k,
          santriIds: k.santriIds.filter((sid) => !finalSantriIds.includes(sid)),
        };
      }
      return k;
    });
    saveKelompok(updatedList);

    const updatedUsers = allUsers.map((u) => {
      if (finalSantriIds.includes(u.id)) {
        return {
          ...u,
          kelompokId: id,
          kelompokNama: updatedKelompok.nama,
          musyrifId: finalMusyrifId,
          musyrifNama: newMusyrifNama,
        };
      }
      if (u.kelompokId === id && !finalSantriIds.includes(u.id)) {
        return {
          ...u,
          kelompokId: undefined,
          kelompokNama: undefined,
        };
      }
      return u;
    });
    saveUsers(updatedUsers);

    try {
      await fetch('/api/kelompok', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          nama: data.nama,
          deskripsi: data.deskripsi,
          musyrifId: finalMusyrifId,
          santriIds: finalSantriIds,
        }),
      });
    } catch (e) {
      console.error('Failed to update kelompok in DB:', e);
    }
  };

  const deleteKelompok = async (id: string) => {
    const updatedList = kelompokList.filter((k) => k.id !== id);
    saveKelompok(updatedList);

    const updatedUsers = allUsers.map((u) => {
      if (u.kelompokId === id) {
        return {
          ...u,
          kelompokId: undefined,
          kelompokNama: undefined,
        };
      }
      return u;
    });
    saveUsers(updatedUsers);

    try {
      await fetch(`/api/kelompok?id=${id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error('Failed to delete kelompok in DB:', e);
    }
  };

  const assignSantriToKelompok = (santriId: string, kelompokId: string) => {
    const targetKel = kelompokList.find((k) => k.id === kelompokId);
    if (!targetKel) return;

    const newSantriIds = Array.from(new Set([...targetKel.santriIds, santriId]));
    updateKelompok(kelompokId, { santriIds: newSantriIds });
  };

  const removeSantriFromKelompok = (santriId: string) => {
    const updatedList = kelompokList.map((k) => ({
      ...k,
      santriIds: k.santriIds.filter((sid) => sid !== santriId),
    }));
    saveKelompok(updatedList);

    const updatedUsers = allUsers.map((u) => {
      if (u.id === santriId) {
        return {
          ...u,
          kelompokId: undefined,
          kelompokNama: undefined,
        };
      }
      return u;
    });
    saveUsers(updatedUsers);

    try {
      fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: santriId,
          kelompokId: null,
        }),
      });
    } catch (e) {
      console.error('Failed to remove santri from kelompok in DB:', e);
    }
  };

  // ==========================================
  // AKSI KEGIATAN (POSTGRESQL NEON DB)
  // ==========================================

  const addKegiatan = async (data: Omit<MockKegiatan, 'id'>) => {
    const newId = `keg-${Date.now()}`;
    const newKeg: MockKegiatan = {
      ...data,
      id: newId,
    };
    saveKegiatan([...kegiatanList, newKeg]);

    try {
      await fetch('/api/kegiatan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId,
          ...data,
        }),
      });
    } catch (e) {
      console.error('Failed to create kegiatan in DB:', e);
    }
  };

  const updateKegiatan = async (id: string, data: Partial<MockKegiatan>) => {
    const updated = kegiatanList.map((k) => (k.id === id ? { ...k, ...data } : k));
    saveKegiatan(updated);

    try {
      await fetch('/api/kegiatan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
    } catch (e) {
      console.error('Failed to update kegiatan in DB:', e);
    }
  };

  const updateKegiatanPoin = async (id: string, newPoin: number) => {
    const updated = kegiatanList.map((k) => (k.id === id ? { ...k, poin: newPoin } : k));
    saveKegiatan(updated);

    try {
      await fetch('/api/kegiatan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, poin: newPoin }),
      });
    } catch (e) {
      console.error('Failed to update kegiatan poin in DB:', e);
    }
  };

  const toggleKegiatanWajib = async (id: string) => {
    const targetKeg = kegiatanList.find((k) => k.id === id);
    if (!targetKeg) return;
    const newStatus = !targetKeg.isWajib;

    const updated = kegiatanList.map((k) => (k.id === id ? { ...k, isWajib: newStatus } : k));
    saveKegiatan(updated);

    try {
      await fetch('/api/kegiatan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isWajib: newStatus }),
      });
    } catch (e) {
      console.error('Failed to toggle kegiatan wajib in DB:', e);
    }
  };

  const updateKegiatanTime = async (id: string, isTimeRestricted: boolean, jamMulai?: string, jamSelesai?: string) => {
    const updated = kegiatanList.map((k) => {
      if (k.id === id) {
        return {
          ...k,
          isTimeRestricted,
          jamMulai,
          jamSelesai,
          targetWaktu: isTimeRestricted && jamMulai && jamSelesai ? `${jamMulai} - ${jamSelesai} WIB` : 'Bebas / Kapan Saja',
        };
      }
      return k;
    });
    saveKegiatan(updated);

    try {
      await fetch('/api/kegiatan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          isTimeRestricted,
          jamMulai: jamMulai || null,
          jamSelesai: jamSelesai || null,
          targetWaktu: isTimeRestricted && jamMulai && jamSelesai ? `${jamMulai} - ${jamSelesai} WIB` : 'Bebas / Kapan Saja',
        }),
      });
    } catch (e) {
      console.error('Failed to update kegiatan time in DB:', e);
    }
  };

  const deleteKegiatan = async (id: string) => {
    const updated = kegiatanList.filter((k) => k.id !== id);
    saveKegiatan(updated);

    try {
      await fetch(`/api/kegiatan?id=${id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error('Failed to delete kegiatan in DB:', e);
    }
  };

  // ==========================================
  // AKSI PERIODE (POSTGRESQL NEON DB)
  // ==========================================

  const addPeriode = async (data: Omit<MockPeriodeLiburan, 'id'>) => {
    const newId = `per-${Date.now()}`;
    const newPer: MockPeriodeLiburan = {
      ...data,
      id: newId,
    };
    if (newPer.isActive) {
      const deact = periodeList.map((p) => ({ ...p, isActive: false }));
      savePeriode([...deact, newPer]);
    } else {
      savePeriode([...periodeList, newPer]);
    }

    try {
      await fetch('/api/periode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newId, ...data }),
      });
    } catch (e) {
      console.error('Failed to create periode in DB:', e);
    }
  };

  const updatePeriode = async (id: string, data: Partial<MockPeriodeLiburan>) => {
    let updated = periodeList.map((p) => (p.id === id ? { ...p, ...data } : p));
    if (data.isActive) {
      updated = updated.map((p) => ({
        ...p,
        isActive: p.id === id,
      }));
    }
    savePeriode(updated);

    try {
      await fetch('/api/periode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
    } catch (e) {
      console.error('Failed to update periode in DB:', e);
    }
  };

  const togglePeriodeActive = async (id: string) => {
    const updated = periodeList.map((p) => ({
      ...p,
      isActive: p.id === id,
    }));
    savePeriode(updated);

    try {
      await fetch('/api/periode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: true }),
      });
    } catch (e) {
      console.error('Failed to toggle active periode in DB:', e);
    }
  };

  const deletePeriode = async (id: string) => {
    const updated = periodeList.filter((p) => p.id !== id);
    savePeriode(updated);

    try {
      await fetch(`/api/periode?id=${id}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.error('Failed to delete periode in DB:', e);
    }
  };

  // ==========================================
  // AKSI LAPORAN (POSTGRESQL NEON DB)
  // ==========================================

  const addLaporan = async (data: Omit<MockLaporan, 'id' | 'createdAt' | 'likesCount' | 'isLikedByUser' | 'comments' | 'status' | 'statusWaktu' | 'waktuLaporWIB'>): Promise<MockLaporan> => {
    const waktuStr = getWIBTimeString();
    const newId = `lap-${Date.now()}`;

    const keg = kegiatanList.find((k) => k.id === data.kegiatanId);
    const officialPoin = keg ? keg.poin : (data.poin || 20);

    const checkResult = checkWaktuKegiatan(
      keg?.isTimeRestricted ?? false,
      keg?.jamMulai,
      keg?.jamSelesai
    );

    const newEntry: MockLaporan = {
      ...data,
      poin: officialPoin,
      id: newId,
      status: 'PENDING',
      statusWaktu: checkResult.statusWaktu,
      waktuLaporWIB: waktuStr,
      createdAt: new Date().toISOString(),
      likesCount: 0,
      isLikedByUser: false,
      comments: [],
    };

    const updatedList = [newEntry, ...laporanList];
    saveLaporan(updatedList);

    try {
      await fetch('/api/laporan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId,
          userId: data.userId,
          kegiatanId: data.kegiatanId,
          poin: officialPoin,
          fotoUrl: data.fotoUrl,
          lat: data.lat,
          long: data.long,
          lokasiName: data.lokasiName,
          catatanSantri: data.catatanSantri,
          statusWaktu: checkResult.statusWaktu,
          waktuLaporWIB: waktuStr,
        }),
      });
    } catch (e) {
      console.error('Failed to save report in DB:', e);
    }

    return newEntry;
  };

  const approveLaporan = async (laporanId: string, catatanPengurus?: string, customPoin?: number) => {
    let targetSantriId = '';
    let targetSantriNama = '';
    let poinGained = 0;

    const updatedLaporans = laporanList.map((lap) => {
      if (lap.id === laporanId) {
        targetSantriId = lap.userId;
        targetSantriNama = lap.userNama;

        const officialKeg = kegiatanList.find((k) => k.id === lap.kegiatanId);
        const finalPoin = customPoin !== undefined ? customPoin : (officialKeg ? officialKeg.poin : lap.poin);
        poinGained = finalPoin;

        return {
          ...lap,
          poin: finalPoin,
          status: 'APPROVED' as const,
          catatanPengurus: catatanPengurus || 'Mumtaz! Laporan telah disetujui.',
        };
      }
      return lap;
    });

    saveLaporan(updatedLaporans);

    if (targetSantriId && poinGained > 0) {
      const updatedUsersRaw = allUsers.map((s) =>
        s.id === targetSantriId || s.nama === targetSantriNama
          ? { ...s, totalPoin: s.totalPoin + poinGained }
          : s
      );
      saveUsers(updatedUsersRaw);
    }

    try {
      await fetch('/api/laporan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: laporanId,
          status: 'APPROVED',
          catatanReview: catatanPengurus || 'Mumtaz! Laporan telah disetujui.',
          customPoin,
        }),
      });
    } catch (e) {
      console.error('Failed to approve report in DB:', e);
    }
  };

  const rejectLaporan = async (laporanId: string, catatanPengurus: string) => {
    let targetSantriId = '';
    let targetSantriNama = '';
    let deductedPoin = 0;
    let wasApproved = false;

    const updatedLaporans = laporanList.map((lap) => {
      if (lap.id === laporanId) {
        targetSantriId = lap.userId;
        targetSantriNama = lap.userNama;
        wasApproved = lap.status === 'APPROVED';
        deductedPoin = lap.poin;

        return {
          ...lap,
          status: 'REJECTED' as const,
          catatanPengurus: catatanPengurus || 'Foto kurang jelas / belum memenuhi kriteria kegiatan.',
        };
      }
      return lap;
    });

    saveLaporan(updatedLaporans);

    if (wasApproved && targetSantriId && deductedPoin > 0) {
      const updatedUsersRaw = allUsers.map((s) =>
        s.id === targetSantriId || s.nama === targetSantriNama
          ? { ...s, totalPoin: Math.max(0, s.totalPoin - deductedPoin) }
          : s
      );
      saveUsers(updatedUsersRaw);
    }

    try {
      await fetch('/api/laporan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: laporanId,
          status: 'REJECTED',
          catatanReview: catatanPengurus || 'Foto kurang jelas / belum memenuhi kriteria kegiatan.',
        }),
      });
    } catch (e) {
      console.error('Failed to reject report in DB:', e);
    }
  };

  const toggleLike = async (laporanId: string, userId?: string) => {
    const targetUserId = userId || 'user-admin';
    const updated = laporanList.map((lap) => {
      if (lap.id === laporanId) {
        const isLiked = lap.isLikedByUser || (lap.likedUserIds && lap.likedUserIds.includes(targetUserId));
        const currentLikedUsers = lap.likedUserIds || [];
        const newLikedUsers = isLiked
          ? currentLikedUsers.filter((uid) => uid !== targetUserId)
          : [...currentLikedUsers, targetUserId];

        return {
          ...lap,
          isLikedByUser: !isLiked,
          likesCount: isLiked ? Math.max(0, lap.likesCount - 1) : lap.likesCount + 1,
          likedUserIds: newLikedUsers,
        };
      }
      return lap;
    });
    saveLaporan(updated);

    try {
      await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          laporanId,
          userId: targetUserId,
        }),
      });
    } catch (e) {
      console.error('Failed to persist like in DB:', e);
    }
  };

  const addComment = async (laporanId: string, user: MockUser, text: string) => {
    if (!text.trim()) return;
    const now = new Date();
    const waktuStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} WIB`;
    const newCommentId = `c-${Date.now()}`;

    const newCommentObj = {
      id: newCommentId,
      nama: user.nama,
      avatar: user.avatarUrl,
      role: user.role,
      isi: text.trim(),
      waktu: waktuStr,
    };

    const updated = laporanList.map((lap) => {
      if (lap.id === laporanId) {
        return {
          ...lap,
          comments: [...(lap.comments || []), newCommentObj],
        };
      }
      return lap;
    });
    saveLaporan(updated);

    try {
      await fetch('/api/komentar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newCommentId,
          laporanId,
          userId: user.id,
          isi: text.trim(),
        }),
      });
    } catch (e) {
      console.error('Failed to persist comment in DB:', e);
    }
  };

  const broadcastReminder = async (santriId: string) => {
    const santri = allUsers.find((s) => s.id === santriId);
    if (!santri) return { success: false, message: 'Santri tidak ditemukan' };

    const res = await sendDailyReminderToSantri({
      santriPhone: santri.noHp,
      santriName: santri.nama,
      kegiatanBelumSelesai: ['Muroja\'ah Al-Qur\'an', 'Sholat Rawatib & Dhuha', 'Khidmah Orang Tua'],
    });

    return {
      success: res.status,
      message: `Pesan pengingat WA berhasil dikirim ke ${santri.nama} (${santri.noHp})`,
    };
  };

  const resetDemoData = () => {
    setLaporanList(MOCK_LAPORAN);
    setAllUsers(MOCK_USERS);
    setKegiatanList(MOCK_KEGIATAN);
    setPeriodeList(MOCK_PERIODE_LIST);
    setKelompokList(MOCK_KELOMPOK);
    localStorage.removeItem('rajinqu_laporan');
    localStorage.removeItem('rajinqu_users');
    localStorage.removeItem('rajinqu_kegiatan');
    localStorage.removeItem('rajinqu_periode');
    localStorage.removeItem('rajinqu_kelompok');
  };

  return (
    <StoreContext.Provider
      value={{
        laporanList,
        allUsers: enrichedAllUsers,
        santriList,
        musyrifList,
        pengawasList,
        kegiatanList,
        periodeList,
        kelompokList,
        activePeriode,
        isLoadingDb,
        syncFromDatabase,
        addLaporan,
        approveLaporan,
        rejectLaporan,
        toggleLike,
        addComment,
        broadcastReminder,
        addMusyrif,
        addPengawas,
        addSantri,
        updateSantriMusyrif,
        updateUser,
        deleteUser,
        addKegiatan,
        updateKegiatan,
        updateKegiatanPoin,
        toggleKegiatanWajib,
        updateKegiatanTime,
        deleteKegiatan,
        addPeriode,
        updatePeriode,
        togglePeriodeActive,
        deletePeriode,
        addKelompok,
        updateKelompok,
        deleteKelompok,
        assignSantriToKelompok,
        removeSantriFromKelompok,
        resetDemoData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
