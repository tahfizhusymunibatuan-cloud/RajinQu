'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  addLaporan: (newLaporan: Omit<MockLaporan, 'id' | 'createdAt' | 'likesCount' | 'isLikedByUser' | 'comments' | 'status' | 'statusWaktu' | 'waktuLaporWIB'>) => Promise<MockLaporan>;
  approveLaporan: (laporanId: string, catatanPengurus?: string, customPoin?: number) => void;
  rejectLaporan: (laporanId: string, catatanPengurus: string, reviewerName?: string) => void;
  toggleLike: (laporanId: string, userId: string) => void;
  addComment: (laporanId: string, user: MockUser, text: string) => void;
  broadcastReminder: (santriId: string) => Promise<{ success: boolean; message: string }>;
  addMusyrif: (data: { nama: string; username: string; noHp: string; password: string; asrama: string }) => void;
  addPengawas: (data: { nama: string; username: string; noHp: string; password: string; asrama?: string }) => void;
  addSantri: (data: { nama: string; username: string; noHp: string; password: string; asrama: string; musyrifId?: string; kelompokId?: string }) => void;
  updateSantriMusyrif: (santriId: string, musyrifId: string) => void;
  updateUser: (userId: string, data: Partial<MockUser>) => void;
  deleteUser: (userId: string) => void;
  addKegiatan: (data: Omit<MockKegiatan, 'id'>) => void;
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

  useEffect(() => {
    // Reset/Wipe old demo data once for production transition
    const isCleanV1 = localStorage.getItem('rajinqu_clean_v1');
    if (!isCleanV1) {
      localStorage.removeItem('rajinqu_users');
      localStorage.removeItem('rajinqu_laporan');
      localStorage.removeItem('rajinqu_kelompok');
      localStorage.removeItem('rajinqu_session');
      localStorage.setItem('rajinqu_clean_v1', 'true');
      setAllUsers(MOCK_USERS);
      setKelompokList(MOCK_KELOMPOK);
      setLaporanList(MOCK_LAPORAN);
      setKegiatanList(MOCK_KEGIATAN);
      setPeriodeList(MOCK_PERIODE_LIST);
      return;
    }

    let currentUsersList = MOCK_USERS;
    const savedUsers = localStorage.getItem('rajinqu_users');
    if (savedUsers) {
      try {
        const parsedUsers: MockUser[] = JSON.parse(savedUsers);
        currentUsersList = parsedUsers.map((u) => ({
          ...u,
          asrama: u.role === 'SANTRI' ? '' : (u.asrama ? u.asrama.replace(/\s*\/\s*Halaqoh.*/i, '').replace(/Musyrif.*Halaqoh.*/i, 'Musyrif PPTQ Batuan').trim() : u.asrama),
        }));
        setAllUsers(currentUsersList);
        localStorage.setItem('rajinqu_users', JSON.stringify(currentUsersList));
      } catch (e) {
        console.error(e);
      }
    }

    const savedKelompok = localStorage.getItem('rajinqu_kelompok');
    if (savedKelompok) {
      try {
        setKelompokList(JSON.parse(savedKelompok));
      } catch (e) {
        console.error(e);
      }
    }

    const savedLaporan = localStorage.getItem('rajinqu_laporan');
    if (savedLaporan) {
      try {
        const rawLaporans: MockLaporan[] = JSON.parse(savedLaporan);
        // Sinkronisasi userAsrama & userNama laporan dengan data user terbaru
        const syncedLaporans = rawLaporans.map((lap) => {
          const userObj = currentUsersList.find((u) => u.id === lap.userId || u.nama === lap.userNama);
          return {
            ...lap,
            userNama: userObj?.nama || lap.userNama,
            userAsrama: '',
            userAvatar: userObj?.avatarUrl || lap.userAvatar,
          };
        });
        setLaporanList(syncedLaporans);
        localStorage.setItem('rajinqu_laporan', JSON.stringify(syncedLaporans));
      } catch (e) {
        console.error(e);
      }
    }

    const savedKegiatan = localStorage.getItem('rajinqu_kegiatan');
    if (savedKegiatan) {
      try {
        const parsed: MockKegiatan[] = JSON.parse(savedKegiatan);
        const merged = parsed.map((k) => {
          const defaultK = MOCK_KEGIATAN.find((def) => def.id === k.id);
          return {
            ...defaultK,
            ...k,
          };
        });
        setKegiatanList(merged);
      } catch (e) {
        console.error(e);
      }
    }

    const savedPeriode = localStorage.getItem('rajinqu_periode');
    if (savedPeriode) {
      try {
        setPeriodeList(JSON.parse(savedPeriode));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveKelompok = (list: MockKelompok[]) => {
    setKelompokList(list);
    localStorage.setItem('rajinqu_kelompok', JSON.stringify(list));
  };

  const savePeriode = (list: MockPeriodeLiburan[]) => {
    setPeriodeList(list);
    localStorage.setItem('rajinqu_periode', JSON.stringify(list));
  };

  const activePeriode = periodeList.find((p) => p.isActive) || periodeList[0];

  const saveKegiatan = (list: MockKegiatan[]) => {
    setKegiatanList(list);
    localStorage.setItem('rajinqu_kegiatan', JSON.stringify(list));
  };

  const saveLaporan = (list: MockLaporan[]) => {
    setLaporanList(list);
    localStorage.setItem('rajinqu_laporan', JSON.stringify(list));
  };

  const saveUsers = (list: MockUser[]) => {
    setAllUsers(list);
    localStorage.setItem('rajinqu_users', JSON.stringify(list));
  };

  const musyrifList = allUsers.filter((u) => u.role === 'MUSYRIF');
  const pengawasList = allUsers.filter((u) => u.role === 'PENGAWAS');
  const santriList = allUsers.filter((u) => u.role === 'SANTRI');

  const addPengawas = (data: { nama: string; username: string; noHp: string; password: string; asrama?: string }) => {
    const newPengawas: MockUser = {
      id: `user-pengawas-${Date.now()}`,
      username: data.username.trim().toLowerCase(),
      noHp: data.noHp.trim(),
      password: data.password.trim(),
      nama: data.nama.trim(),
      role: 'PENGAWAS',
      avatarUrl: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80`,
      pondokNama: 'PTQA BATUAN',
      asrama: data.asrama || 'Koordinator / Pengawas Kesantrian',
      totalPoin: 0,
    };
    saveUsers([...allUsers, newPengawas]);
  };

  const addMusyrif = (data: { nama: string; username: string; noHp: string; password: string; asrama: string }) => {
    const newMusyrif: MockUser = {
      id: `user-musyrif-${Date.now()}`,
      username: data.username.trim().toLowerCase(),
      noHp: data.noHp.trim(),
      password: data.password.trim(),
      nama: data.nama.trim(),
      role: 'MUSYRIF',
      avatarUrl: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80`,
      pondokNama: 'PTQA BATUAN',
      asrama: data.asrama,
      totalPoin: 0,
    };
    saveUsers([...allUsers, newMusyrif]);
  };

  const addSantri = (data: {
    nama: string;
    username: string;
    noHp: string;
    password: string;
    asrama: string;
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
  };

  const updateSantriMusyrif = (santriId: string, musyrifId: string) => {
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
  };

  const addKelompok = (data: {
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

    // Sinkronisasi data santri yang terpilih
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
  };

  const updateKelompok = (id: string, data: Partial<MockKelompok>) => {
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

    const updatedList = kelompokList.map((k) => (k.id === id ? updatedKelompok : k));
    saveKelompok(updatedList);

    const finalSantriIds = data.santriIds !== undefined ? data.santriIds : currentKel.santriIds;
    const finalMusyrifId = data.musyrifId !== undefined ? data.musyrifId : currentKel.musyrifId;

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
  };

  const deleteKelompok = (id: string) => {
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
  };

  const assignSantriToKelompok = (santriId: string, kelompokId: string) => {
    const targetKel = kelompokList.find((k) => k.id === kelompokId);
    if (!targetKel) return;

    const updatedKelompokList = kelompokList.map((k) => {
      if (k.id === kelompokId) {
        const existingIds = k.santriIds.filter((sid) => sid !== santriId);
        return { ...k, santriIds: [...existingIds, santriId] };
      } else {
        return { ...k, santriIds: k.santriIds.filter((sid) => sid !== santriId) };
      }
    });
    saveKelompok(updatedKelompokList);

    const pjMusyrif = allUsers.find((u) => u.id === targetKel.musyrifId);
    const updatedUsers = allUsers.map((u) => {
      if (u.id === santriId) {
        return {
          ...u,
          kelompokId: targetKel.id,
          kelompokNama: targetKel.nama,
          musyrifId: targetKel.musyrifId,
          musyrifNama: pjMusyrif ? pjMusyrif.nama : u.musyrifNama,
        };
      }
      return u;
    });
    saveUsers(updatedUsers);
  };

  const removeSantriFromKelompok = (santriId: string) => {
    const updatedKelompokList = kelompokList.map((k) => ({
      ...k,
      santriIds: k.santriIds.filter((sid) => sid !== santriId),
    }));
    saveKelompok(updatedKelompokList);

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
  };

  const updateUser = (userId: string, data: Partial<MockUser>) => {
    let targetMusyrifNama: string | undefined = undefined;
    if (data.musyrifId !== undefined) {
      const targetMusyrif = allUsers.find((u) => u.id === data.musyrifId);
      targetMusyrifNama = targetMusyrif ? targetMusyrif.nama : 'Belum Ditugaskan';
    }

    let updatedUserObj: MockUser | null = null;
    const updatedUsers = allUsers.map((u) => {
      if (u.id === userId) {
        updatedUserObj = {
          ...u,
          ...data,
          musyrifNama: targetMusyrifNama !== undefined ? targetMusyrifNama : u.musyrifNama,
        };
        return updatedUserObj;
      }
      return u;
    });

    saveUsers(updatedUsers);

    // Sinkronisasi pembaruan ke seluruh laporan santri terkait
    if (updatedUserObj) {
      const targetUser = updatedUserObj as MockUser;
      const updatedLaporans = laporanList.map((lap) => {
        if (lap.userId === userId || lap.userNama === targetUser.nama) {
          return {
            ...lap,
            userNama: targetUser.nama,
            userAsrama: targetUser.asrama || lap.userAsrama,
            userAvatar: targetUser.avatarUrl || lap.userAvatar,
          };
        }
        return lap;
      });
      saveLaporan(updatedLaporans);

      // Perbarui session yang aktif di localStorage jika user ini sedang login
      try {
        const currentSession = localStorage.getItem('rajinqu_session');
        if (currentSession) {
          const parsed = JSON.parse(currentSession);
          if (parsed.id === userId) {
            localStorage.setItem('rajinqu_session', JSON.stringify({ ...parsed, ...targetUser }));
          }
        }
      } catch (e) {
        console.error('Failed to sync session', e);
      }
    }
  };

  const deleteUser = (userId: string) => {
    const updated = allUsers.filter((u) => u.id !== userId);
    saveUsers(updated);
  };

  const addLaporan = async (data: Omit<MockLaporan, 'id' | 'createdAt' | 'likesCount' | 'isLikedByUser' | 'comments' | 'status' | 'statusWaktu' | 'waktuLaporWIB'>): Promise<MockLaporan> => {
    const waktuStr = getWIBTimeString();

    // Selalu ambil bobot poin resmi dari kegiatan yang diatur oleh Super Admin
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
      id: `lap-${Date.now()}`,
      status: 'PENDING',
      statusWaktu: checkResult.statusWaktu,
      waktuLaporWIB: waktuStr,
      createdAt: `Hari ini, ${waktuStr}`,
      likesCount: 0,
      isLikedByUser: false,
      comments: [],
    };

    const updatedList = [newEntry, ...laporanList];
    saveLaporan(updatedList);

    return newEntry;
  };

  const approveLaporan = (laporanId: string, catatanPengurus?: string, customPoin?: number) => {
    let targetSantriId = '';
    let targetSantriNama = '';
    let poinGained = 0;
    let kegiatanName = '';

    const updatedLaporans = laporanList.map((lap) => {
      if (lap.id === laporanId) {
        targetSantriId = lap.userId;
        targetSantriNama = lap.userNama;

        // Ambil poin resmi dari Super Admin (kegiatanList) atau custom poin jika ditentukan musyrif
        const officialKeg = kegiatanList.find((k) => k.id === lap.kegiatanId);
        const finalPoin = customPoin !== undefined ? customPoin : (officialKeg ? officialKeg.poin : lap.poin);

        poinGained = finalPoin;
        kegiatanName = lap.kegiatanNama;

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

      // Hitung ulang peringkat ranking semua santri berdasarkan totalPoin tertinggi
      const santriSorted = updatedUsersRaw
        .filter((u) => u.role === 'SANTRI')
        .sort((a, b) => b.totalPoin - a.totalPoin);

      const rankedUsers = updatedUsersRaw.map((u) => {
        if (u.role === 'SANTRI') {
          const rankIdx = santriSorted.findIndex((s) => s.id === u.id);
          return {
            ...u,
            peringkat: rankIdx !== -1 ? rankIdx + 1 : u.peringkat,
          };
        }
        return u;
      });

      saveUsers(rankedUsers);

      // Sinkronisasi session aktif di localStorage jika user ini sedang login
      try {
        const currentSession = localStorage.getItem('rajinqu_session');
        if (currentSession) {
          const parsed = JSON.parse(currentSession);
          if (parsed.id === targetSantriId || parsed.nama === targetSantriNama) {
            const updatedSantriObj = rankedUsers.find((u) => u.id === targetSantriId || u.nama === targetSantriNama);
            if (updatedSantriObj) {
              localStorage.setItem('rajinqu_session', JSON.stringify({ ...parsed, ...updatedSantriObj }));
            }
          }
        }
      } catch (e) {
        console.error('Failed to sync session points', e);
      }
    }
  };

  const rejectLaporan = (laporanId: string, catatanPengurus: string) => {
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

    // Jika sebelumnya sudah APPROVED dan dibatalkan/ditolak, kurangi poin santri
    if (wasApproved && targetSantriId && deductedPoin > 0) {
      const updatedUsersRaw = allUsers.map((s) =>
        s.id === targetSantriId || s.nama === targetSantriNama
          ? { ...s, totalPoin: Math.max(0, s.totalPoin - deductedPoin) }
          : s
      );

      const santriSorted = updatedUsersRaw
        .filter((u) => u.role === 'SANTRI')
        .sort((a, b) => b.totalPoin - a.totalPoin);

      const rankedUsers = updatedUsersRaw.map((u) => {
        if (u.role === 'SANTRI') {
          const rankIdx = santriSorted.findIndex((s) => s.id === u.id);
          return {
            ...u,
            peringkat: rankIdx !== -1 ? rankIdx + 1 : u.peringkat,
          };
        }
        return u;
      });

      saveUsers(rankedUsers);

      // Sinkronisasi session aktif
      try {
        const currentSession = localStorage.getItem('rajinqu_session');
        if (currentSession) {
          const parsed = JSON.parse(currentSession);
          if (parsed.id === targetSantriId || parsed.nama === targetSantriNama) {
            const updatedSantriObj = rankedUsers.find((u) => u.id === targetSantriId || u.nama === targetSantriNama);
            if (updatedSantriObj) {
              localStorage.setItem('rajinqu_session', JSON.stringify({ ...parsed, ...updatedSantriObj }));
            }
          }
        }
      } catch (e) {
        console.error('Failed to sync session points', e);
      }
    }
  };

  const toggleLike = (laporanId: string) => {
    const updated = laporanList.map((lap) => {
      if (lap.id === laporanId) {
        const isLiked = lap.isLikedByUser;
        return {
          ...lap,
          isLikedByUser: !isLiked,
          likesCount: isLiked ? lap.likesCount - 1 : lap.likesCount + 1,
        };
      }
      return lap;
    });
    saveLaporan(updated);
  };

  const addComment = (laporanId: string, user: MockUser, text: string) => {
    if (!text.trim()) return;
    const now = new Date();
    const waktuStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} WIB`;

    const updated = laporanList.map((lap) => {
      if (lap.id === laporanId) {
        return {
          ...lap,
          comments: [
            ...lap.comments,
            {
              id: `c-${Date.now()}`,
              nama: user.nama,
              avatar: user.avatarUrl,
              role: user.role,
              isi: text.trim(),
              waktu: waktuStr,
            },
          ],
        };
      }
      return lap;
    });
    saveLaporan(updated);
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

  const addKegiatan = (data: Omit<MockKegiatan, 'id'>) => {
    const newKeg: MockKegiatan = {
      ...data,
      id: `keg-${Date.now()}`,
    };
    saveKegiatan([...kegiatanList, newKeg]);
  };

  const updateKegiatanPoin = (id: string, newPoin: number) => {
    const updated = kegiatanList.map((k) => (k.id === id ? { ...k, poin: newPoin } : k));
    saveKegiatan(updated);
  };

  const toggleKegiatanWajib = (id: string) => {
    const updated = kegiatanList.map((k) => (k.id === id ? { ...k, isWajib: !k.isWajib } : k));
    saveKegiatan(updated);
  };

  const updateKegiatanTime = (id: string, isTimeRestricted: boolean, jamMulai?: string, jamSelesai?: string) => {
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
  };

  const deleteKegiatan = (id: string) => {
    const updated = kegiatanList.filter((k) => k.id !== id);
    saveKegiatan(updated);
  };

  const addPeriode = (data: Omit<MockPeriodeLiburan, 'id'>) => {
    const newPer: MockPeriodeLiburan = {
      ...data,
      id: `per-${Date.now()}`,
    };
    // Jika periode baru diset aktif, nonaktifkan periode yang lain
    if (newPer.isActive) {
      const deact = periodeList.map((p) => ({ ...p, isActive: false }));
      savePeriode([...deact, newPer]);
    } else {
      savePeriode([...periodeList, newPer]);
    }
  };

  const updatePeriode = (id: string, data: Partial<MockPeriodeLiburan>) => {
    let updated = periodeList.map((p) => (p.id === id ? { ...p, ...data } : p));
    if (data.isActive) {
      updated = updated.map((p) => ({
        ...p,
        isActive: p.id === id,
      }));
    }
    savePeriode(updated);
  };

  const togglePeriodeActive = (id: string) => {
    const updated = periodeList.map((p) => ({
      ...p,
      isActive: p.id === id, // Mengaktifkan periode yang dipilih & menonaktifkan yang lain
    }));
    savePeriode(updated);
  };

  const deletePeriode = (id: string) => {
    const updated = periodeList.filter((p) => p.id !== id);
    savePeriode(updated);
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
        allUsers,
        santriList,
        musyrifList,
        pengawasList,
        kegiatanList,
        periodeList,
        kelompokList,
        activePeriode,
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
