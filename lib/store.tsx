'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  MOCK_LAPORAN,
  MOCK_USERS,
  MOCK_KEGIATAN,
  MOCK_PERIODE_LIST,
  MockLaporan,
  MockUser,
  MockKegiatan,
  MockPeriodeLiburan,
} from './mock-data';
import { notifyMusyrifNewReport, notifySantriReportStatus, sendDailyReminderToSantri } from './whatsapp';
import { getWIBTimeString, checkWaktuKegiatan } from './time-wib';

interface StoreContextType {
  laporanList: MockLaporan[];
  allUsers: MockUser[];
  santriList: MockUser[];
  musyrifList: MockUser[];
  kegiatanList: MockKegiatan[];
  periodeList: MockPeriodeLiburan[];
  activePeriode: MockPeriodeLiburan | undefined;
  addLaporan: (newLaporan: Omit<MockLaporan, 'id' | 'createdAt' | 'likesCount' | 'isLikedByUser' | 'comments' | 'status' | 'statusWaktu' | 'waktuLaporWIB'>) => Promise<MockLaporan>;
  approveLaporan: (laporanId: string, catatanPengurus?: string, reviewerName?: string) => void;
  rejectLaporan: (laporanId: string, catatanPengurus: string, reviewerName?: string) => void;
  toggleLike: (laporanId: string, userId: string) => void;
  addComment: (laporanId: string, user: MockUser, text: string) => void;
  broadcastReminder: (santriId: string) => Promise<{ success: boolean; message: string }>;
  addMusyrif: (data: { nama: string; username: string; noHp: string; password: string; asrama: string }) => void;
  addSantri: (data: { nama: string; username: string; noHp: string; password: string; asrama: string; musyrifId: string }) => void;
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
  resetDemoData: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [laporanList, setLaporanList] = useState<MockLaporan[]>(MOCK_LAPORAN);
  const [allUsers, setAllUsers] = useState<MockUser[]>(MOCK_USERS);
  const [kegiatanList, setKegiatanList] = useState<MockKegiatan[]>(MOCK_KEGIATAN);
  const [periodeList, setPeriodeList] = useState<MockPeriodeLiburan[]>(MOCK_PERIODE_LIST);

  useEffect(() => {
    let currentUsersList = MOCK_USERS;
    const savedUsers = localStorage.getItem('rajinqu_users');
    if (savedUsers) {
      try {
        currentUsersList = JSON.parse(savedUsers);
        setAllUsers(currentUsersList);
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
          if (userObj && userObj.asrama) {
            return {
              ...lap,
              userNama: userObj.nama,
              userAsrama: userObj.asrama,
              userAvatar: userObj.avatarUrl || lap.userAvatar,
            };
          }
          return lap;
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
        setKegiatanList(JSON.parse(savedKegiatan));
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
  const santriList = allUsers.filter((u) => u.role === 'SANTRI');

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

  const addSantri = (data: { nama: string; username: string; noHp: string; password: string; asrama: string; musyrifId: string }) => {
    const selectedMusyrif = allUsers.find((u) => u.id === data.musyrifId);

    const newSantri: MockUser = {
      id: `user-santri-${Date.now()}`,
      username: data.username.trim(),
      noHp: data.noHp.trim(),
      password: data.password.trim(),
      nama: data.nama.trim(),
      role: 'SANTRI',
      avatarUrl: `https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80`,
      pondokNama: 'Pondok Pesantren Al-Hikmah Modern',
      musyrifId: data.musyrifId,
      musyrifNama: selectedMusyrif ? selectedMusyrif.nama : 'Belum Ditugaskan',
      asrama: data.asrama,
      totalPoin: 0,
      peringkat: santriList.length + 1,
      selisihPeringkat: 0,
    };
    saveUsers([...allUsers, newSantri]);
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

    // Evaluasi apakah kegiatan ini dibatasi waktu dan tepat waktu atau terlambat
    const keg = kegiatanList.find((k) => k.id === data.kegiatanId);
    const checkResult = checkWaktuKegiatan(
      keg?.isTimeRestricted ?? false,
      keg?.jamMulai,
      keg?.jamSelesai
    );

    const newEntry: MockLaporan = {
      ...data,
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

    // Cari musyrif penanggung jawab santri
    const santri = allUsers.find((u) => u.id === data.userId || u.nama === data.userNama);
    const targetMusyrif = allUsers.find((u) => u.id === santri?.musyrifId) || allUsers.find((u) => u.role === 'MUSYRIF');

    await notifyMusyrifNewReport({
      musyrifPhone: targetMusyrif?.noHp || '081288880002',
      musyrifName: targetMusyrif?.nama || 'Ustadz Pembimbing',
      santriName: data.userNama,
      kegiatanName: data.kegiatanNama,
      waktu: `${waktuStr} (${checkResult.statusWaktu === 'TEPAT_WAKTU' ? 'Tepat Waktu' : 'Terlambat'})`,
      fotoUrl: data.fotoUrl,
    });

    return newEntry;
  };

  const approveLaporan = (laporanId: string, catatanPengurus?: string) => {
    let targetSantriId = '';
    let poinGained = 0;
    let kegiatanName = '';

    const updated = laporanList.map((lap) => {
      if (lap.id === laporanId) {
        targetSantriId = lap.userId;
        poinGained = lap.poin;
        kegiatanName = lap.kegiatanNama;
        return {
          ...lap,
          status: 'APPROVED' as const,
          catatanPengurus: catatanPengurus || 'Mumtaz! Laporan telah disetujui.',
        };
      }
      return lap;
    });

    saveLaporan(updated);

    if (targetSantriId && poinGained > 0) {
      const updatedUsers = allUsers.map((s) =>
        s.id === targetSantriId ? { ...s, totalPoin: s.totalPoin + poinGained } : s
      );
      saveUsers(updatedUsers);

      const santri = allUsers.find((s) => s.id === targetSantriId);
      if (santri) {
        notifySantriReportStatus({
          santriPhone: santri.noHp,
          santriName: santri.nama,
          kegiatanName: kegiatanName,
          status: 'APPROVED',
          poin: poinGained,
          komentar: catatanPengurus,
        });
      }
    }
  };

  const rejectLaporan = (laporanId: string, catatanPengurus: string) => {
    let targetSantriId = '';
    let kegiatanName = '';

    const updated = laporanList.map((lap) => {
      if (lap.id === laporanId) {
        targetSantriId = lap.userId;
        kegiatanName = lap.kegiatanNama;
        return {
          ...lap,
          status: 'REJECTED' as const,
          catatanPengurus: catatanPengurus || 'Foto kurang jelas / belum memenuhi kriteria kegiatan.',
        };
      }
      return lap;
    });

    saveLaporan(updated);

    if (targetSantriId) {
      const santri = allUsers.find((s) => s.id === targetSantriId);
      if (santri) {
        notifySantriReportStatus({
          santriPhone: santri.noHp,
          santriName: santri.nama,
          kegiatanName: kegiatanName,
          status: 'REJECTED',
          poin: 0,
          komentar: catatanPengurus,
        });
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
    localStorage.removeItem('rajinqu_laporan');
    localStorage.removeItem('rajinqu_users');
    localStorage.removeItem('rajinqu_kegiatan');
    localStorage.removeItem('rajinqu_periode');
  };

  return (
    <StoreContext.Provider
      value={{
        laporanList,
        allUsers,
        santriList,
        musyrifList,
        kegiatanList,
        periodeList,
        activePeriode,
        addLaporan,
        approveLaporan,
        rejectLaporan,
        toggleLike,
        addComment,
        broadcastReminder,
        addMusyrif,
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
