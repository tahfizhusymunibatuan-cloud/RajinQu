'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import {
  Home,
  CheckSquare,
  Trophy,
  History,
  User as UserIcon,
  Camera,
  MapPin,
  Clock,
  Sparkles,
  Heart,
  MessageCircle,
  Share2,
  Plus,
  CheckCircle2,
  Clock3,
  XCircle,
  TrendingUp,
  Award,
  ChevronRight,
  LogOut,
  Send,
  AlertTriangle,
  UploadCloud,
  RefreshCw,
  Sunrise,
  SunMedium,
  BookOpen,
  HeartHandshake,
  GraduationCap,
  Activity,
  FlipHorizontal,
  Copy,
  ExternalLink,
  Check,
  Layers,
  Lock,
  KeyRound,
  Shield,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { MOCK_STATISTIK_MINGGUAN, MOCK_REWARD_PERIODE, MockKegiatan, MockLaporan } from '@/lib/mock-data';
import { getWIBTimeString, checkWaktuKegiatan, getSantriDailyActivityStatus, getTodayWIBDateString } from '@/lib/time-wib';
import { PrayerCountdownWidget } from '@/components/prayer-countdown-widget';
import VacationCountdownBanner from '@/components/VacationCountdownBanner';
import { calculateActivityCountdown } from '@/lib/prayer-times';
import { uploadImageToStorage, formatDriveImageUrl } from '@/lib/google-drive';
import {
  formatMusyrifReportMessage,
  openWhatsAppDirect,
  copyMessageToClipboard,
  formatPhoneNumber,
  getWhatsAppUrl,
} from '@/lib/whatsapp';

export default function SantriPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();
  const {
    laporanList,
    allUsers,
    santriList,
    kegiatanList,
    activePeriode,
    addLaporan,
    toggleLike,
    addComment,
    updateUser,
  } = useStore();

  const currentSantriUser = allUsers.find((u) => u.id === user?.id) || user;
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'feed' | 'tugas' | 'leaderboard' | 'riwayat' | 'profil'>('feed');
  const [commentInput, setCommentInput] = useState<{ [key: string]: string }>({});
  const [showCommentBox, setShowCommentBox] = useState<{ [key: string]: boolean }>({});

  // State Modal Upload
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedKegiatan, setSelectedKegiatan] = useState<MockKegiatan | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [catatanSantri, setCatatanSantri] = useState('');
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; long: number; name: string } | null>(null);
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadSuccessAlert, setUploadSuccessAlert] = useState(false);

  // State Ganti Password / PIN Santri
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // State Modal Konfirmasi WhatsApp Manual ke Musyrif
  const [waConfirmModal, setWaConfirmModal] = useState<{
    isOpen: boolean;
    laporan: MockLaporan | null;
    musyrifNama: string;
    musyrifPhone: string;
    musyrifAsrama: string;
    message: string;
    copied: boolean;
  }>({
    isOpen: false,
    laporan: null,
    musyrifNama: '',
    musyrifPhone: '',
    musyrifAsrama: '',
    message: '',
    copied: false,
  });

  // Riwayat Filter
  const [riwayatFilter, setRiwayatFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');

  // Camera Live Stream Refs & State & Aspect Ratio (Default: Potret 3:4)
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraRatio, setCameraRatio] = useState<'3/4' | '1/1' | '16/9'>('3/4');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, mounted, router]);

  // Start Live Camera
  const startLiveCamera = async (targetFacing?: 'user' | 'environment') => {
    setCameraError(null);
    const mode = targetFacing || facingMode;
    try {
      // Hentikan stream yang sedang berjalan terlebih dahulu agar tidak konflik kamera di HP
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1080 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsCameraActive(true);
        }
      } else {
        setCameraError('Browser tidak mendukung akses kamera langsung.');
      }
    } catch (err: any) {
      setCameraError('Izin kamera belum aktif. Silakan klik tombol "Aktifkan Kamera Live" di bawah.');
      setIsCameraActive(false);
    }
  };

  // Toggle Mode Kamera (Selfie Depan <-> Kamera Belakang)
  const switchFacingMode = async (targetMode: 'user' | 'environment') => {
    if (facingMode === targetMode && isCameraActive) return;
    setFacingMode(targetMode);
    await startLiveCamera(targetMode);
  };

  const toggleFacingMode = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    await startLiveCamera(nextMode);
  };

  // Stop Camera Stream
  const stopLiveCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Shutter Snap dengan Cropping Sesuai Rasio Pilihan (Potret 3:4 / Kotak / Lanskap)
  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const vWidth = video.videoWidth || 640;
      const vHeight = video.videoHeight || 480;

      let cropWidth = vWidth;
      let cropHeight = vHeight;
      let startX = 0;
      let startY = 0;

      if (cameraRatio === '3/4') {
        // Potret Rasio 3:4
        const targetRatio = 3 / 4;
        if (vWidth / vHeight > targetRatio) {
          cropWidth = vHeight * targetRatio;
          startX = (vWidth - cropWidth) / 2;
        } else {
          cropHeight = vWidth / targetRatio;
          startY = (vHeight - cropHeight) / 2;
        }
      } else if (cameraRatio === '1/1') {
        // Kotak 1:1
        const minDim = Math.min(vWidth, vHeight);
        cropWidth = minDim;
        cropHeight = minDim;
        startX = (vWidth - minDim) / 2;
        startY = (vHeight - minDim) / 2;
      } else {
        // Lanskap 16:9
        const targetRatio = 16 / 9;
        if (vWidth / vHeight > targetRatio) {
          cropWidth = vHeight * targetRatio;
          startX = (vWidth - cropWidth) / 2;
        } else {
          cropHeight = vWidth / targetRatio;
          startY = (vHeight - cropHeight) / 2;
        }
      }

      // Kompresi resolusi optimal (max width 1080px) untuk kecepatan upload maksimal
      const maxDim = 1080;
      let targetW = cropWidth;
      let targetH = cropHeight;
      if (cropWidth > maxDim) {
        const scale = maxDim / cropWidth;
        targetW = maxDim;
        targetH = Math.round(cropHeight * scale);
      }

      canvas.width = targetW;
      canvas.height = targetH;

      const context = canvas.getContext('2d');
      if (context) {
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        if (facingMode === 'user') {
          // Cerminkan foto selfie agar natural dan sesuai tampilan viewfinder
          context.translate(targetW, 0);
          context.scale(-1, 1);
        }
        // Draw the cropped video frame onto canvas with optimal scaling
        context.drawImage(video, startX, startY, cropWidth, cropHeight, 0, 0, targetW, targetH);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setPhotoPreview(dataUrl);
        stopLiveCamera();
      }
    }
  };

  // Ambil Geolocation GPS & Konversi ke Nama Alamat Asli (Reverse Geocoding)
  const captureGPS = () => {
    setIsCapturingGps(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          // Set awal sementara
          setGpsLocation({
            lat,
            long: lon,
            name: `Mencari nama alamat (${lat.toFixed(4)}, ${lon.toFixed(4)})...`,
          });

          try {
            // Reverse Geocoding ke OpenStreetMap Nominatim
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
              {
                headers: {
                  'Accept-Language': 'id',
                },
              }
            );

            if (res.ok) {
              const data = await res.json();
              const addr = data.address;
              let readableName = '';

              if (addr) {
                const place = addr.amenity || addr.building || addr.road || addr.village || addr.suburb || addr.neighbourhood || '';
                const district = addr.city_district || addr.county || addr.city || addr.town || addr.municipality || '';
                const state = addr.state || '';

                const parts = [place, district, state].filter(Boolean);
                readableName = parts.length > 0 ? parts.join(', ') : data.display_name.split(',').slice(0, 3).join(', ');
              } else if (data.display_name) {
                readableName = data.display_name.split(',').slice(0, 3).join(', ');
              }

              setGpsLocation({
                lat,
                long: lon,
                name: readableName || `Lokasi Terdeteksi (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
              });
            } else {
              setGpsLocation({
                lat,
                long: lon,
                name: `Lokasi Santri (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
              });
            }
          } catch (err) {
            setGpsLocation({
              lat,
              long: lon,
              name: `Lokasi Santri (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
            });
          } finally {
            setIsCapturingGps(false);
          }
        },
        (error) => {
          setGpsLocation({
            lat: -7.0116,
            long: 113.8279,
            name: 'Batuan, Kabupaten Sumenep, Jawa Timur',
          });
          setIsCapturingGps(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } else {
      setGpsLocation({
        lat: -7.0116,
        long: 113.8279,
        name: 'Batuan, Kabupaten Sumenep, Jawa Timur',
      });
      setIsCapturingGps(false);
    }
  };

  const handleOpenUpload = (kegiatan?: MockKegiatan) => {
    let targetKeg = kegiatan;

    // Jika kegiatan ditentukan secara spesifik
    if (targetKeg) {
      const dailyStatus = getSantriDailyActivityStatus(laporanList, user?.id, user?.nama, targetKeg.id);
      if (dailyStatus.isApproved) {
        alert(`✅ Laporan kegiatan "${targetKeg.nama}" hari ini sudah selesai dan disetujui oleh Musyrif.`);
        return;
      }
      if (dailyStatus.isPending) {
        alert(`⏳ Laporan kegiatan "${targetKeg.nama}" hari ini sedang dalam proses peninjauan oleh Musyrif.`);
        return;
      }
    } else {
      // Jika dipicu dari tombol umum "Upload Kegiatan Baru", cari kegiatan yang belum selesai berdasarkan urutan paling urgent/mendatang
      const availableKeg = sortedKegiatanList.find((k) => {
        const s = getSantriDailyActivityStatus(laporanList, user?.id, user?.nama, k.id);
        return s.canSubmit;
      });
      targetKeg = availableKeg || sortedKegiatanList[0] || kegiatanList[0];
    }

    setSelectedKegiatan(targetKeg);
    setPhotoPreview(null);
    setCatatanSantri('');
    setGpsLocation(null);
    captureGPS(); // Selalu auto refresh GPS saat membuka modal kamera
    setIsUploadModalOpen(true);
    setTimeout(() => {
      startLiveCamera();
    }, 200);
  };

  const handleCloseUploadModal = () => {
    stopLiveCamera();
    setIsUploadModalOpen(false);
    setPhotoPreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        stopLiveCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseDemoSelfie = () => {
    setPhotoPreview('https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80');
    stopLiveCamera();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Url = reader.result as string;
        if (currentSantriUser?.id) {
          const uploadRes = await uploadImageToStorage({
            imageBase64: base64Url,
            fileName: `AVATAR_${currentSantriUser.username || 'santri'}`,
            santriName: currentSantriUser.nama,
          });
          updateUser(currentSantriUser.id, { avatarUrl: uploadRes.fileUrl });
          alert('✅ Foto profil santri berhasil diperbarui!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenWAConfirmation = (lap: MockLaporan) => {
    const assignedMusyrif =
      allUsers.find((u) => u.id === currentSantriUser?.musyrifId || u.nama === currentSantriUser?.musyrifNama) ||
      allUsers.find((u) => u.role === 'MUSYRIF');

    const musyrifNama = assignedMusyrif?.nama || currentSantriUser?.musyrifNama || 'Ustadz Pembimbing';
    const musyrifPhone = assignedMusyrif?.noHp || '081288880002';
    const musyrifAsrama = assignedMusyrif?.asrama || 'Halaqoh Pondok';

    const msg = formatMusyrifReportMessage({
      musyrifName: musyrifNama,
      santriName: lap.userNama || currentSantriUser?.nama || 'Santri',
      asrama: lap.userAsrama || currentSantriUser?.asrama,
      kegiatanName: lap.kegiatanNama,
      poin: lap.poin,
      waktu: lap.waktuLaporWIB || lap.createdAt,
      statusWaktu: lap.statusWaktu,
      lokasiName: lap.lokasiName,
      catatanSantri: lap.catatanSantri,
      fotoUrl: formatDriveImageUrl(lap.fotoUrl),
    });

    setWaConfirmModal({
      isOpen: true,
      laporan: lap,
      musyrifNama,
      musyrifPhone,
      musyrifAsrama,
      message: msg,
      copied: false,
    });
  };

  const handleSubmitLaporan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKegiatan) return;

    const dailyStatus = getSantriDailyActivityStatus(laporanList, user?.id, user?.nama, selectedKegiatan.id);
    if (dailyStatus.isApproved) {
      alert(`✅ Laporan untuk kegiatan "${selectedKegiatan.nama}" hari ini sudah disetujui. Tidak dapat lapor ganda.`);
      setIsUploadModalOpen(false);
      return;
    }
    if (dailyStatus.isPending) {
      alert(`⏳ Laporan untuk kegiatan "${selectedKegiatan.nama}" hari ini sedang menunggu validasi musyrif.`);
      setIsUploadModalOpen(false);
      return;
    }

    if (!photoPreview) {
      alert('Harap ambil foto live kegiatan terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Unggah foto ke Google Drive via GAS jika URL dikonfigurasi di .env
      const uploadRes = await uploadImageToStorage({
        imageBase64: photoPreview,
        fileName: `LAPORAN_${(currentSantriUser?.nama || 'santri').replace(/\s+/g, '_')}_${selectedKegiatan.id}`,
        santriName: currentSantriUser?.nama,
        kegiatanName: selectedKegiatan.nama,
      });

      const finalFotoUrl = uploadRes.fileUrl || photoPreview;

      const newEntry = await addLaporan({
        userId: currentSantriUser?.id || 'user-santri-1',
        userNama: currentSantriUser?.nama || 'Muhammad Faiz Ar-Rasyid',
        userAvatar: currentSantriUser?.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
        userAsrama: currentSantriUser?.asrama || 'Kelas 3 TMI',
        kegiatanId: selectedKegiatan.id,
        kegiatanNama: selectedKegiatan.nama,
        kategori: selectedKegiatan.kategori,
        poin: selectedKegiatan.poin,
        fotoUrl: finalFotoUrl,
        lat: gpsLocation?.lat || -6.2088,
        long: gpsLocation?.long || 106.8456,
        lokasiName: gpsLocation?.name || 'Lokasi Santri Terdeteksi',
        catatanSantri: catatanSantri || `Melaksanakan ${selectedKegiatan.nama} dengan tertib.`,
      });

      setIsUploadModalOpen(false);
      setUploadSuccessAlert(true);
      setTimeout(() => setUploadSuccessAlert(false), 4000);
      setActiveTab('riwayat');

      // Cari Musyrif Pembina dan susun pesan konfirmasi
      const assignedMusyrif =
        allUsers.find((u) => u.id === currentSantriUser?.musyrifId || u.nama === currentSantriUser?.musyrifNama) ||
        allUsers.find((u) => u.role === 'MUSYRIF');

      const musyrifNama = assignedMusyrif?.nama || currentSantriUser?.musyrifNama || 'Ustadz Pembimbing';
      const musyrifPhone = assignedMusyrif?.noHp || '081288880002';
      const musyrifAsrama = assignedMusyrif?.asrama || 'Musyrif PPTQ Batuan';

      const msg = formatMusyrifReportMessage({
        musyrifName: musyrifNama,
        santriName: newEntry.userNama || currentSantriUser?.nama || 'Santri',
        asrama: newEntry.userAsrama || currentSantriUser?.asrama,
        kegiatanName: newEntry.kegiatanNama,
        poin: newEntry.poin,
        waktu: newEntry.waktuLaporWIB || newEntry.createdAt,
        statusWaktu: newEntry.statusWaktu,
        lokasiName: newEntry.lokasiName,
        catatanSantri: newEntry.catatanSantri,
        fotoUrl: formatDriveImageUrl(newEntry.fotoUrl),
      });

      const waUrl = getWhatsAppUrl(musyrifPhone, msg);

      // Langsung navigasi ke WhatsApp Pembina tanpa memunculkan modal di layar
      if (typeof window !== 'undefined') {
        window.location.href = waUrl;
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim laporan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendComment = (laporanId: string) => {
    const text = commentInput[laporanId];
    if (text && user) {
      addComment(laporanId, user, text);
      setCommentInput({ ...commentInput, [laporanId]: '' });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    const { newPassword, confirmPassword } = passwordForm;
    if (!newPassword.trim()) {
      setPasswordMsg({ type: 'error', text: 'Password / PIN baru tidak boleh kosong.' });
      return;
    }

    if (newPassword.trim().length < 3) {
      setPasswordMsg({ type: 'error', text: 'Password / PIN minimal 3 karakter.' });
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setPasswordMsg({ type: 'error', text: 'Konfirmasi Password / PIN tidak cocok.' });
      return;
    }

    if (!currentSantriUser?.id) return;

    setIsUpdatingPassword(true);
    try {
      await updateUser(currentSantriUser.id, {
        password: newPassword.trim(),
      });
      setPasswordMsg({ type: 'success', text: '✅ Password / PIN berhasil diperbarui!' });
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordMsg(null), 4000);
    } catch (err) {
      setPasswordMsg({ type: 'error', text: 'Gagal memperbarui password.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Helper Icon Kegiatan
  const renderKegiatanIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sunrise': return <Sunrise className="w-5 h-5 text-amber-500" />;
      case 'SunMedium': return <SunMedium className="w-5 h-5 text-amber-500" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-teal-600" />;
      case 'HeartHandshake': return <HeartHandshake className="w-5 h-5 text-rose-500" />;
      case 'GraduationCap': return <GraduationCap className="w-5 h-5 text-emerald-600" />;
      case 'Activity': return <Activity className="w-5 h-5 text-sky-500" />;
      default: return <Sparkles className="w-5 h-5 text-teal-600" />;
    }
  };

  // Filter riwayat santri yang login
  const riwayatSantri = laporanList.filter((lap) => {
    const isMine = lap.userId === user?.id || lap.userNama === user?.nama;
    if (!isMine) return false;
    if (riwayatFilter === 'ALL') return true;
    return lap.status === riwayatFilter;
  });

  // Laporan yang sudah disetujui (APPROVED) milik santri ini
  const approvedMine = laporanList.filter(
    (lap) => (lap.userId === user?.id || lap.userNama === user?.nama) && lap.status === 'APPROVED'
  );

  // Rincian Poin per Kategori (Ibadah, Belajar, Mandiri, Sosial)
  const ibadahPoin = approvedMine.filter((l) => l.kategori === 'IBADAH').reduce((acc, l) => acc + (l.poin || 0), 0);
  const belajarPoin = approvedMine.filter((l) => l.kategori === 'BELAJAR').reduce((acc, l) => acc + (l.poin || 0), 0);
  const mandiriPoin = approvedMine.filter((l) => l.kategori === 'MANDIRI').reduce((acc, l) => acc + (l.poin || 0), 0);
  const sosialPoin = approvedMine.filter((l) => l.kategori === 'SOSIAL').reduce((acc, l) => acc + (l.poin || 0), 0);

  const santriTotalPoin = currentSantriUser?.totalPoin || 0;
  const targetPoinPeriode = activePeriode?.targetPoin || 400;
  const rewardPercent = Math.min(100, Math.round((santriTotalPoin / targetPoinPeriode) * 100));

  // Filter Feed: seluruh laporan santri yang sudah disetujui (APPROVED) oleh pembimbing
  const approvedFeedList = laporanList.filter((lap) => lap.status === 'APPROVED');

  // Helper Informasi Peringkat & Badge
  const getRankBadgeInfo = (rank?: number) => {
    if (!rank) return { title: 'Santri Pondok', badge: 'Santri' };
    if (rank === 1) return { title: '👑 Pemimpin Klasemen (Juara 1)', badge: '👑 Juara 1' };
    if (rank === 2) return { title: '🥈 Runner-Up Klasemen', badge: '🥈 Rank #2' };
    if (rank === 3) return { title: '🥉 Podium Utama', badge: '🥉 Rank #3' };
    if (rank <= 5) return { title: '⭐ Top 5 Santri Terajin', badge: '⭐ Top 5' };
    if (rank <= 10) return { title: '🌟 Top 10 Santri Terajin', badge: '🌟 Top 10' };
    return { title: `🏅 Peringkat #${rank} Santri`, badge: `Rank #${rank}` };
  };

  // Urutkan leaderboard
  const sortedLeaderboard = [...santriList].sort((a, b) => (b.totalPoin || 0) - (a.totalPoin || 0));

  // Pengurutan Cerdas Kronologis Kegiatan (Sedang Buka/Urgent -> Fleksibel -> Mendatang -> Selesai)
  const sortedKegiatanList = React.useMemo(() => {
    return [...kegiatanList].sort((a, b) => {
      const statusA = getSantriDailyActivityStatus(laporanList, user?.id, user?.nama, a.id);
      const statusB = getSantriDailyActivityStatus(laporanList, user?.id, user?.nama, b.id);

      const cdA = a.isTimeRestricted ? calculateActivityCountdown(a.jamMulai, a.jamSelesai) : null;
      const cdB = b.isTimeRestricted ? calculateActivityCountdown(b.jamMulai, b.jamSelesai) : null;

      // Tier Score: 0 = paling atas/urgent, 4 = paling bawah/selesai
      const getTier = (
        k: MockKegiatan,
        s: ReturnType<typeof getSantriDailyActivityStatus>,
        cd: ReturnType<typeof calculateActivityCountdown> | null
      ) => {
        if (s.isApproved || s.isPending) return 4; // Sudah dikirim/selesai hari ini
        if (s.isRejected) return 0; // Memerlukan lapor ulang segera

        if (k.isTimeRestricted && cd) {
          if (cd.status === 'SEGERA_BERAKHIR') return 0.1; // Segera berakhir (<= 20 min)
          if (cd.status === 'SEDANG_DIBUKA') return 0.2; // Sedang buka sekarang
          if (cd.status === 'BELUM_DIBUKA') return 2; // Mendatang
          if (cd.status === 'BERAKHIR') return 3; // Lewat jam hari ini
        }
        return 1; // Waktu fleksibel / bebas
      };

      const tierA = getTier(a, statusA, cdA);
      const tierB = getTier(b, statusB, cdB);

      if (tierA !== tierB) return tierA - tierB;

      // Jika sama-sama Mendatang (Tier 2), urutkan berdasarkan Jam Mulai paling awal
      if (tierA === 2 && a.jamMulai && b.jamMulai) {
        return a.jamMulai.localeCompare(b.jamMulai);
      }

      // Tie-breaker: Kegiatan Wajib dahulu, lalu Poin terbesar
      if (a.isWajib !== b.isWajib) return a.isWajib ? -1 : 1;
      return (b.poin || 0) - (a.poin || 0);
    });
  }, [kegiatanList, laporanList, user]);

  if (!mounted || isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="app-mobile-container bg-slate-50 min-h-screen pb-24 shadow-xl border-x border-slate-200">

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-900 text-white px-4 py-3.5 shadow-md">
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
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded-full font-semibold border border-amber-400/30">Santri</span>
              </div>
              <p className="text-[11px] text-teal-200 font-medium truncate max-w-[190px]">
                PTQA AL-USYMUNI BATUAN
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Poin Badge Live */}
            <div className="flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/40 text-amber-300 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentSantriUser?.totalPoin || 0} Poin</span>
            </div>

            {/* Logout button */}
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

      {/* Alert Notifikasi Sukses Kirim */}
      {uploadSuccessAlert && (
        <div className="m-3 p-3 bg-emerald-500 text-white rounded-2xl shadow-lg flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-300 text-xs font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <div className="font-bold">Alhamdulillah, Laporan Terkirim!</div>
            <div className="text-[11px] text-emerald-100">Musyrif akan segera memvalidasi dan menambahkan poinmu.</div>
          </div>
        </div>
      )}

      {/* MAIN TAB CONTENT */}
      <main className="p-3.5 space-y-4">

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: FEED KEGIATAN */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'feed' && (
          <div className="space-y-4">
            {/* Quick Upload Banner */}
            <div className="bg-gradient-to-br from-teal-600 to-emerald-700 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
              <div className="absolute right-[-15px] bottom-[-15px] opacity-15">
                <Camera className="w-28 h-28" />
              </div>
              <div className="relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  Rutinitas Hari Ini
                </span>
                <h3 className="text-base font-bold mt-1">Sudah setor kegiatan hari ini?</h3>
                <p className="text-xs text-teal-100 mt-0.5 max-w-[240px]">
                  Ambil foto selfie + GPS sekarang & kumpulkan poin kebaikanmu!
                </p>
                <button
                  onClick={() => handleOpenUpload()}
                  className="mt-3 inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs px-3.5 py-2 rounded-xl shadow-md transition active:scale-95"
                >
                  <Camera className="w-4 h-4 text-slate-900" />
                  <span>Upload Kegiatan Baru</span>
                </button>
              </div>
            </div>

            {/* BANNER PERHITUNGAN MASA LIBURAN & SISA HARI */}
            <VacationCountdownBanner
              periode={activePeriode}
              variant="santri"
              targetPoin={targetPoinPeriode}
              currentPoin={santriTotalPoin}
            />

            {/* JADWAL SHOLAT WIB & COUNTDOWN REAL-TIME */}
            <PrayerCountdownWidget kegiatanList={kegiatanList} onOpenUpload={handleOpenUpload} />

            {/* Feed List */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Feed Kegiatan Santri
                </h2>
                <span className="text-[11px] text-slate-400">Terbaru dari teman-teman</span>
              </div>

              {approvedFeedList.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
                  <Sparkles className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold text-slate-700">Belum ada kegiatan yang disetujui.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hanya kegiatan yang telah disetujui oleh pembimbing yang akan tampil di feed kegiatan.
                  </p>
                </div>
              ) : (
                approvedFeedList.map((lap) => {
                  const authorInfo = allUsers.find((u) => u.id === lap.userId) || santriList.find((u) => u.nama === lap.userNama);
                  const authorNama = authorInfo?.nama || lap.userNama;
                  const authorKelompok = authorInfo?.kelompokNama;
                  const authorAvatar = authorInfo?.avatarUrl || lap.userAvatar;

                  return (
                    <div
                      key={lap.id}
                      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
                    >
                      {/* Header Card */}
                      <div className="p-3 flex items-center justify-between border-b border-slate-100">
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

                              {/* Badge Status Waktu WIB */}
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
                            <div className="text-[10px] text-slate-500 mt-0.5">{lap.createdAt}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                            +{lap.poin} Poin
                          </span>
                        </div>
                      </div>

                      {/* Foto Bukti (Rasio Potret 3:4) */}
                      <div className="relative bg-slate-900 aspect-[3/4] w-full overflow-hidden">
                        <img
                          src={formatDriveImageUrl(lap.fotoUrl)}
                          alt={lap.kegiatanNama}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-slate-950/70 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>{lap.kegiatanNama}</span>
                        </div>

                        <div className="absolute bottom-2 left-2 right-2 bg-slate-950/75 backdrop-blur-md text-white text-[10px] p-1.5 rounded-lg flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="truncate">{lap.lokasiName}</span>
                        </div>
                      </div>

                      {/* Body & Caption */}
                      <div className="p-3">
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {lap.catatanSantri}
                        </p>

                        {/* Musyrif Approval Note jika ada */}
                        {lap.catatanPengurus && (
                          <div className="mt-2 p-2 bg-teal-50/80 rounded-xl border border-teal-200/60 text-[11px] text-teal-800 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold">Catatan Musyrif: </span>
                              <span>{lap.catatanPengurus}</span>
                            </div>
                          </div>
                        )}

                        {/* Action Bar (Like, Komentar) */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => toggleLike(lap.id, user?.id)}
                              className={`flex items-center gap-1.5 text-xs font-semibold transition ${
                                (lap.isLikedByUser || (lap.likedUserIds && user && lap.likedUserIds.includes(user.id)))
                                  ? 'text-rose-500 font-bold'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              <Heart
                                className={`w-4 h-4 ${
                                  (lap.isLikedByUser || (lap.likedUserIds && user && lap.likedUserIds.includes(user.id)))
                                    ? 'fill-rose-500 text-rose-500'
                                    : ''
                                }`}
                              />
                              <span>{lap.likesCount}</span>
                            </button>

                            <button
                              onClick={() =>
                                setShowCommentBox({
                                  ...showCommentBox,
                                  [lap.id]: !showCommentBox[lap.id],
                                })
                              }
                              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>{lap.comments.length} Komentar</span>
                            </button>
                          </div>

                          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                            {lap.status === 'APPROVED' ? '✓ Terverifikasi' : '⏳ Sedang Ditinjau'}
                          </span>
                        </div>

                        {/* Komentar Section */}
                        {showCommentBox[lap.id] && (
                          <div className="mt-3 pt-2 border-t border-slate-100 space-y-2">
                            {/* List Comments */}
                            {lap.comments.map((comm) => {
                              const isPengawas = comm.role === 'PENGAWAS' || comm.role === 'SUPER_ADMIN' || comm.isi.includes('[Catatan Pengawas]');
                              const isMusyrif = comm.role === 'MUSYRIF';

                              return (
                                <div
                                  key={comm.id}
                                  className={`text-xs p-2.5 rounded-xl border transition ${
                                    isPengawas
                                      ? 'bg-gradient-to-r from-amber-50/90 to-amber-100/50 border-amber-300 text-amber-950 shadow-2xs'
                                      : isMusyrif
                                      ? 'bg-teal-50/80 border-teal-200 text-teal-950'
                                      : 'bg-slate-50 border-slate-200 text-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1 mb-0.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {comm.avatar && (
                                        <img
                                          src={comm.avatar}
                                          alt={comm.nama}
                                          className="w-4 h-4 rounded-full object-cover border border-slate-300"
                                        />
                                      )}
                                      <span className="font-extrabold text-[11px]">{comm.nama}</span>

                                      {isPengawas && (
                                        <span className="text-[8px] bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded-full font-black border border-amber-500 shadow-2xs">
                                          🛡️ Pengawas Kesantrian
                                        </span>
                                      )}
                                      {isMusyrif && (
                                        <span className="text-[8px] bg-teal-200 text-teal-950 px-1.5 py-0.2 rounded-full font-bold border border-teal-300">
                                          ☪️ Pembimbing
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[9px] text-slate-400 shrink-0">{comm.waktu}</span>
                                  </div>
                                  <p className="text-[11px] leading-relaxed font-medium pl-0.5 mt-0.5">
                                    {comm.isi.replace('[Catatan Pengawas] ', '')}
                                  </p>
                                </div>
                              );
                            })}

                            {/* Add Comment Input */}
                            <div className="flex items-center gap-1.5 pt-1">
                              <input
                                type="text"
                                value={commentInput[lap.id] || ''}
                                onChange={(e) =>
                                  setCommentInput({ ...commentInput, [lap.id]: e.target.value })
                                }
                                placeholder="Tulis komentar penyemangat..."
                                className="flex-1 text-xs bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSendComment(lap.id);
                                }}
                              />
                              <button
                                onClick={() => handleSendComment(lap.id)}
                                className="p-1.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: TUGAS HARI INI */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'tugas' && (
          <div className="space-y-3.5">
            {/* Widget Jadwal Sholat & Countdown Singkat */}
            <PrayerCountdownWidget compact kegiatanList={kegiatanList} onOpenUpload={handleOpenUpload} />

            {/* Real Counter Status Target Harian */}
            {(() => {
              const approvedCountToday = kegiatanList.filter((k) => {
                const s = getSantriDailyActivityStatus(laporanList, user?.id, user?.nama, k.id);
                return s.isApproved;
              }).length;

              return (
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Target Harian Santri</h2>
                    <p className="text-xs text-slate-500">Selesaikan seluruh target untuk reward maksimal</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                      {approvedCountToday} / {kegiatanList.length} Selesai
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-2.5">
              {sortedKegiatanList.map((keg) => {
                const dailyStatus = getSantriDailyActivityStatus(laporanList, user?.id, user?.nama, keg.id);
                const isApproved = dailyStatus.isApproved;
                const isPending = dailyStatus.isPending;
                const isRejected = dailyStatus.isRejected;
                const lapRef = dailyStatus.laporan;

                return (
                  <div
                    key={keg.id}
                    className={`bg-white rounded-2xl p-3.5 border transition shadow-sm ${
                      isApproved
                        ? 'border-emerald-300 bg-emerald-50/25 opacity-75'
                        : isPending
                        ? 'border-amber-300 bg-amber-50/25 opacity-80'
                        : isRejected
                        ? 'border-rose-300 bg-rose-50/30'
                        : 'border-slate-200 hover:border-teal-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isApproved
                              ? 'bg-emerald-100 border-emerald-300'
                              : isPending
                              ? 'bg-amber-100 border-amber-300'
                              : isRejected
                              ? 'bg-rose-100 border-rose-300'
                              : 'bg-slate-100 border-slate-200'
                          }`}
                        >
                          {renderKegiatanIcon(keg.icon)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-800">{keg.nama}</span>
                            {keg.isWajib && (
                              <span className="text-[9px] bg-rose-50 text-rose-600 font-bold px-1.5 py-0.2 rounded border border-rose-200">
                                Wajib
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] font-medium">
                            {keg.isTimeRestricted ? (
                              (() => {
                                const cd = calculateActivityCountdown(keg.jamMulai, keg.jamSelesai);
                                return (
                                  <span
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[9px] border ${
                                      cd.status === 'SEDANG_DIBUKA'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                        : cd.status === 'SEGERA_BERAKHIR'
                                        ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                                        : cd.status === 'BERAKHIR'
                                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    <Clock className="w-3 h-3 text-slate-500" />
                                    <span>{keg.targetWaktu}</span>
                                    {cd.status === 'SEGERA_BERAKHIR' && <span>🔥 Segera Berakhir!</span>}
                                    {cd.status === 'SEDANG_DIBUKA' && <span>🟢 Dibuka Now</span>}
                                  </span>
                                );
                              })()
                            ) : (
                              <span className="flex items-center gap-1 px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>♾️ Waktu Fleksibel</span>
                              </span>
                            )}
                            <span className="text-teal-700 font-bold bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                              +{keg.poin} Poin
                            </span>
                          </div>

                          {/* Catatan penolakan jika REJECTED */}
                          {isRejected && lapRef?.catatanPengurus && (
                            <div className="mt-1.5 p-1.5 bg-rose-100/70 border border-rose-200 text-rose-900 rounded-lg text-[10px]">
                              <b>Catatan Musyrif:</b> {lapRef.catatanPengurus}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tombol Aksi Sesuai Status */}
                      <div className="shrink-0">
                        {isApproved ? (
                          <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1.5 rounded-xl shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>✓ Selesai</span>
                          </div>
                        ) : isPending ? (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1.5 rounded-xl shadow-2xs">
                            <Clock3 className="w-3.5 h-3.5 text-amber-700" />
                            <span>⏳ Menunggu</span>
                          </div>
                        ) : isRejected ? (
                          <button
                            type="button"
                            onClick={() => handleOpenUpload(keg)}
                            className="flex items-center gap-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-xl shadow-sm active:scale-95 transition"
                            title="Lapor ulang / perbaiki laporan"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Lapor Ulang</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenUpload(keg)}
                            className="flex items-center gap-1 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 px-3 py-1.5 rounded-xl shadow-sm active:scale-95 transition"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Lapor</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: LEADERBOARD TOP 10 */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            {/* Header Leaderboard */}
            <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-teal-800 rounded-2xl p-4 text-white shadow-md text-center relative overflow-hidden">
              <Trophy className="w-12 h-12 text-amber-200 mx-auto mb-1 animate-bounce" />
              <h2 className="text-base font-bold">Klasemen Poin Liburan</h2>
              <p className="text-xs text-amber-100 mt-0.5">
                {activePeriode?.nama || 'Liburan Santri'}
              </p>
              <div className="text-[10px] text-teal-200 mt-0.5 font-medium">
                📅 {activePeriode?.rentangTanggal || 'Periode Aktif'}
              </div>
            </div>

            {/* Podium Top 3 */}
            <div className="grid grid-cols-3 gap-2 pt-4 items-end">
              {/* Juara 2 (Runner-Up) */}
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200 text-center shadow-sm order-1 relative">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">🥈 Juara 2</div>
                <div className="relative inline-block mb-1">
                  <img
                    src={sortedLeaderboard[1]?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={sortedLeaderboard[1]?.nama || 'Belum ada'}
                    className="w-12 h-12 rounded-full mx-auto object-cover border-2 border-slate-300 shadow-2xs"
                  />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-300 text-slate-800 text-[10px] font-bold flex items-center justify-center shadow-xs">
                    2
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-800 truncate">
                  {sortedLeaderboard[1]?.nama || 'Belum Ada'}
                </div>
                <div className="text-[10px] text-amber-600 font-extrabold mt-0.5">
                  {sortedLeaderboard[1] ? `${sortedLeaderboard[1].totalPoin} Poin` : '0 Poin'}
                </div>
              </div>

              {/* Juara 1 (Puncak Leaderboard) */}
              <div className="bg-gradient-to-b from-amber-50 to-white p-3 rounded-2xl border-2 border-amber-400 text-center shadow-md order-2 -mt-3 relative">
                <div className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                  <span>👑 Juara 1</span>
                </div>
                <div className="relative inline-block mb-1">
                  <img
                    src={sortedLeaderboard[0]?.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'}
                    alt={sortedLeaderboard[0]?.nama || 'Belum ada'}
                    className="w-14 h-14 rounded-full mx-auto object-cover border-2 border-amber-400 shadow-sm"
                  />
                  <span className="absolute -bottom-1 -right-1 w-5.5 h-5.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center shadow-sm">
                    1
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 truncate">
                  {sortedLeaderboard[0]?.nama || 'Belum Ada'}
                </div>
                <div className="text-xs text-amber-600 font-black mt-0.5">
                  {sortedLeaderboard[0] ? `${sortedLeaderboard[0].totalPoin} Poin` : '0 Poin'}
                </div>
              </div>

              {/* Juara 3 */}
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200 text-center shadow-sm order-3 relative">
                <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">🥉 Juara 3</div>
                <div className="relative inline-block mb-1">
                  <img
                    src={sortedLeaderboard[2]?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                    alt={sortedLeaderboard[2]?.nama || 'Belum ada'}
                    className="w-12 h-12 rounded-full mx-auto object-cover border-2 border-amber-700/40 shadow-2xs"
                  />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-700 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    3
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-800 truncate">
                  {sortedLeaderboard[2]?.nama || 'Belum Ada'}
                </div>
                <div className="text-[10px] text-amber-600 font-extrabold mt-0.5">
                  {sortedLeaderboard[2] ? `${sortedLeaderboard[2].totalPoin} Poin` : '0 Poin'}
                </div>
              </div>
            </div>

            {/* List Peringkat Santri Lengkap */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Daftar Peringkat Real Santri
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Total {santriList.length} Santri
                </span>
              </div>

              {sortedLeaderboard.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Belum ada santri terdaftar dalam klasemen.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {sortedLeaderboard.map((santri, index) => {
                    const isCurrent = santri.id === user?.id || santri.nama === user?.nama;
                    const rankNum = santri.peringkat || (index + 1);

                    return (
                      <div
                        key={santri.id || index}
                        className={`p-3 flex items-center justify-between transition ${
                          isCurrent
                            ? 'bg-amber-50/90 font-semibold border-l-4 border-amber-400'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-full text-center text-[11px] font-extrabold flex items-center justify-center shrink-0 ${
                              rankNum === 1
                                ? 'bg-amber-400 text-amber-950 shadow-xs'
                                : rankNum === 2
                                ? 'bg-slate-200 text-slate-800'
                                : rankNum === 3
                                ? 'bg-amber-800 text-amber-50'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            #{rankNum}
                          </span>
                          <img
                            src={santri.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'}
                            alt={santri.nama}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs text-slate-900 flex items-center gap-1.5 truncate">
                              <span className="truncate">{santri.nama}</span>
                              {isCurrent && (
                                <span className="text-[9px] bg-amber-300 text-amber-950 px-1.5 py-0.2 rounded-full font-extrabold shrink-0 border border-amber-400">
                                  Kamu ⭐
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {santri.asrama || santri.kelompokNama || 'Santri Pondok'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-2">
                          <div className="text-xs font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                            {santri.totalPoin || 0} Poin
                          </div>
                          {rankNum > 1 && santri.selisihPeringkat !== undefined && (
                            <div className="text-[9px] text-amber-700 font-semibold mt-0.5">
                              {santri.selisihPeringkat > 0
                                ? `-${santri.selisihPeringkat} poin ke #${rankNum - 1}`
                                : 'Poin Sama'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: RIWAYAT LAPORAN */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'riwayat' && (
          <div className="space-y-3.5">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl text-xs font-medium">
              <button
                onClick={() => setRiwayatFilter('ALL')}
                className={`flex-1 py-1.5 rounded-lg transition ${riwayatFilter === 'ALL' ? 'bg-white text-slate-900 font-bold shadow-sm' : 'text-slate-600'
                  }`}
              >
                Semua
              </button>
              <button
                onClick={() => setRiwayatFilter('APPROVED')}
                className={`flex-1 py-1.5 rounded-lg transition ${riwayatFilter === 'APPROVED' ? 'bg-white text-emerald-700 font-bold shadow-sm' : 'text-slate-600'
                  }`}
              >
                Disetujui
              </button>
              <button
                onClick={() => setRiwayatFilter('PENDING')}
                className={`flex-1 py-1.5 rounded-lg transition ${riwayatFilter === 'PENDING' ? 'bg-white text-amber-700 font-bold shadow-sm' : 'text-slate-600'
                  }`}
              >
                Menunggu
              </button>
              <button
                onClick={() => setRiwayatFilter('REJECTED')}
                className={`flex-1 py-1.5 rounded-lg transition ${riwayatFilter === 'REJECTED' ? 'bg-white text-rose-700 font-bold shadow-sm' : 'text-slate-600'
                  }`}
              >
                Ditolak
              </button>
            </div>

            {/* List Riwayat */}
            {riwayatSantri.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
                <History className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-xs">Belum ada laporan dengan filter ini.</p>
              </div>
            ) : (
              riwayatSantri.map((lap) => (
                <div key={lap.id} className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{lap.kegiatanNama}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{lap.createdAt}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {lap.status === 'APPROVED' && (
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>+{lap.poin} Poin</span>
                      </span>
                    )}
                    {lap.status === 'PENDING' && (
                      <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock3 className="w-3 h-3 text-amber-600" />
                        <span>Menunggu Validasi</span>
                      </span>
                    )}
                    {lap.status === 'REJECTED' && (
                      <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        <span>Ditolak</span>
                      </span>
                    )}
                  </div>

                  {/* Thumbnail & Lokasi */}
                  <div className="flex gap-3 items-center bg-slate-50 p-2 rounded-xl">
                    <img
                      src={formatDriveImageUrl(lap.fotoUrl)}
                      alt={lap.kegiatanNama}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div className="text-[11px] text-slate-600 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="truncate">{lap.lokasiName}</span>
                      </div>
                      <p className="line-clamp-2 text-[11px] text-slate-700">{lap.catatanSantri}</p>
                    </div>
                  </div>

                  {/* Feedback Musyrif */}
                  {lap.catatanPengurus && (
                    <div className="p-2 rounded-xl bg-slate-100 text-[11px] text-slate-700 border-l-2 border-teal-600">
                      <span className="font-semibold">Evaluasi Pengurus: </span>
                      <span>{lap.catatanPengurus}</span>
                    </div>
                  )}

                  {/* Action Konfirmasi WhatsApp Manual ke Musyrif */}
                  <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {lap.waktuLaporWIB || lap.createdAt}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenWAConfirmation(lap)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition active:scale-95 shadow-2xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{lap.status === 'PENDING' ? 'Konfirmasi WA ke Musyrif' : 'Kirim Ulang WA'}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: PROFIL & GRAFIK STATISTIK */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'profil' && (
          <div className="space-y-4">
            {/* Profil Card */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3.5">
              <div className="relative group shrink-0">
                <img
                  src={currentSantriUser?.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'}
                  alt={currentSantriUser?.nama || 'Santri'}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-500 shadow-xs"
                />
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center shadow-md border-2 border-white transition active:scale-95"
                  title="Ganti Foto Profil"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{currentSantriUser?.nama}</h3>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="text-[10px] font-bold text-teal-700 hover:text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200 transition"
                  >
                    Ganti Foto
                  </button>
                </div>
                <p className="text-xs text-slate-500 font-medium">NIS: {currentSantriUser?.username}</p>
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  {currentSantriUser?.kelompokNama && (
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-md border border-indigo-200 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-600" />
                      <span>{currentSantriUser.kelompokNama}</span>
                    </span>
                  )}
                  <span className="text-[10px] font-bold bg-teal-50 text-teal-800 px-2 py-0.5 rounded-md border border-teal-200">
                    Musyrif PJ: {currentSantriUser?.musyrifNama || 'Ust. Abdullah'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics & Real-Time Peringkat */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500">Total Poin Terkumpul</div>
                  <div className="text-xl font-extrabold text-teal-700 mt-1 flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                    <span>{santriTotalPoin} Poin</span>
                  </div>
                </div>
                <div className="text-[10px] text-emerald-600 mt-1.5 font-medium">
                  {rewardPercent}% dari target {targetPoinPeriode} Poin
                </div>
              </div>

              <div
                onClick={() => setActiveTab('leaderboard')}
                className="bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 p-3.5 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-amber-300 transition"
              >
                <div>
                  <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                    <span>Peringkat Saat Ini</span>
                    <span className="text-[9px] bg-amber-200/80 text-amber-900 font-bold px-1.5 py-0.5 rounded-full">
                      {getRankBadgeInfo(currentSantriUser?.peringkat).badge}
                    </span>
                  </div>
                  <div className="text-xl font-extrabold text-amber-600 mt-1 flex items-center gap-1.5">
                    <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
                    <span>#{currentSantriUser?.peringkat || 1}</span>
                  </div>
                </div>
                <div className="text-[10px] text-teal-700 font-semibold mt-1.5 flex items-center justify-between">
                  <span>Dari {santriList.length} Santri</span>
                  <span className="text-amber-700 font-bold hover:underline flex items-center gap-0.5">
                    Detail <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>

            {/* Banner Insight Peringkat Dinamis & Selisih Poin */}
            <div className="bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-emerald-500/10 p-3 rounded-2xl border border-amber-200/80 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                  <Award className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {getRankBadgeInfo(currentSantriUser?.peringkat).title}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">
                    {currentSantriUser?.peringkat === 1 ? (
                      <span className="text-amber-800 font-semibold">
                        🔥 Unggul +{santriTotalPoin - (sortedLeaderboard[1]?.totalPoin || 0)} poin dari Runner-Up!
                      </span>
                    ) : (
                      <span className="text-teal-800 font-semibold">
                        ⚡ Butuh +{currentSantriUser?.selisihPeringkat || 10} poin lagi untuk mengejar Peringkat #{(currentSantriUser?.peringkat || 2) - 1}!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Target Reward Progress Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  Target Reward Periode Ini
                </span>
                <span className="font-bold text-teal-700">{santriTotalPoin} / {targetPoinPeriode} Poin ({rewardPercent}%)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="bg-gradient-to-r from-teal-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${rewardPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Rincian Poin per Kategori (4 Pilar) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Rincian Poin per Pilar Ibadah & Kegiatan</span>
                <span className="text-[10px] text-slate-400 font-normal">{approvedMine.length} Laporan Valid</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-teal-950 text-[11px]">
                    <span>🕌 Ibadah</span>
                  </div>
                  <span className="font-extrabold text-teal-800 text-xs">+{ibadahPoin}</span>
                </div>

                <div className="p-2.5 bg-sky-50/70 border border-sky-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-sky-950 text-[11px]">
                    <span>📖 Belajar</span>
                  </div>
                  <span className="font-extrabold text-sky-800 text-xs">+{belajarPoin}</span>
                </div>

                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950 text-[11px]">
                    <span>🏡 Mandiri</span>
                  </div>
                  <span className="font-extrabold text-amber-800 text-xs">+{mandiriPoin}</span>
                </div>

                <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-rose-950 text-[11px]">
                    <span>🤝 Sosial</span>
                  </div>
                  <span className="font-extrabold text-rose-800 text-xs">+{sosialPoin}</span>
                </div>
              </div>
            </div>

            {/* Info Reward Periode */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/80 p-3.5 rounded-2xl border border-amber-200/80 shadow-sm text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center justify-between text-amber-950">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Target & Reward: {activePeriode?.nama}</span>
                </div>
                <span className="text-[10px] font-black bg-amber-200 text-amber-950 px-2 py-0.5 rounded">
                  Target: {targetPoinPeriode} Poin
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800 pt-0.5">
                {activePeriode?.deskripsiReward || 'Sertifikat penghargaan & beasiswa santri berprestasi.'}
              </p>
            </div>

            {/* Informasi Identitas Akun Terkunci (Read-Only) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                  <Shield className="w-4 h-4 text-teal-700" />
                  <span>Informasi Akun Terdaftar</span>
                </div>
                <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Dikelola Super Admin</span>
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Nama Lengkap</span>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 flex items-center justify-between">
                    <span>{currentSantriUser?.nama}</span>
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">NIS / Username</span>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 flex items-center justify-between">
                      <span>{currentSantriUser?.username}</span>
                      <Lock className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block">No. WhatsApp Wali</span>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 flex items-center justify-between">
                      <span>{currentSantriUser?.noHp}</span>
                      <Lock className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  * Nama, NIS, dan Nomor WhatsApp hanya dapat diperbarui melalui Super Admin pondok.
                </p>
              </div>
            </div>

            {/* Formulir Ganti Password / PIN Mandiri */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 border-b border-slate-100 pb-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>Ganti Password / PIN Login Santri</span>
              </div>

              {passwordMsg && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-semibold ${
                    passwordMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {passwordMsg.text}
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Password / PIN Baru
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Masukkan password atau PIN baru..."
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Ulangi Password / PIN Baru
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Ketik ulang password baru..."
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 mt-2"
                >
                  {isUpdatingPassword ? 'Menyimpan...' : 'Simpan Password Baru'}
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
              <span>Keluar dari Akun Santri</span>
            </button>
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODAL UPLOAD KEGIATAN DENGAN KAMERA + GPS */}
      {/* ------------------------------------------------------------- */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">

            {/* Header Modal */}
            <div className="bg-gradient-to-r from-teal-700 to-emerald-800 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Kamera Laporan Santri</h3>
                <p className="text-[11px] text-teal-200">Kamera Selfie / Belakang + Validasi GPS</p>
              </div>
              <button
                type="button"
                onClick={handleCloseUploadModal}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {/* Form Scrollable Content */}
            <form onSubmit={handleSubmitLaporan} className="p-4 overflow-y-auto space-y-3.5 flex-1">

              {/* Hidden Canvas untuk Capture Snapshot */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Pilih Kegiatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Kegiatan
                </label>
                <select
                  value={selectedKegiatan?.id || ''}
                  onChange={(e) => {
                    const found = sortedKegiatanList.find((k) => k.id === e.target.value);
                    if (found) {
                      const dailyStatus = getSantriDailyActivityStatus(laporanList, user?.id, user?.nama, found.id);
                      if (dailyStatus.isApproved) {
                        alert(`✅ Kegiatan "${found.nama}" sudah disetujui untuk hari ini.`);
                        return;
                      }
                      if (dailyStatus.isPending) {
                        alert(`⏳ Kegiatan "${found.nama}" sedang menunggu validasi Musyrif.`);
                        return;
                      }
                      setSelectedKegiatan(found);
                    }
                  }}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  {sortedKegiatanList.map((k) => {
                    const statusObj = getSantriDailyActivityStatus(laporanList, user?.id, user?.nama, k.id);
                    const isDone = statusObj.isApproved;
                    const isPending = statusObj.isPending;
                    const isRejected = statusObj.isRejected;

                    return (
                      <option
                        key={k.id}
                        value={k.id}
                        disabled={isDone || isPending}
                        className={isDone ? 'text-slate-400 bg-slate-100' : isRejected ? 'text-rose-700 font-bold' : ''}
                      >
                        {k.nama} (+{k.poin} Poin){isDone ? ' — ✓ Selesai (Terkunci)' : isPending ? ' — ⏳ Sedang Ditinjau' : isRejected ? ' — ❌ Perlu Lapor Ulang' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Box Ambil Foto Live Kamera dengan Rasio Potret */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Ambil Foto (Selfie / Belakang)
                  </label>
                  <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                    🚫 Dilarang Galeri
                  </span>
                </div>

                {/* Switcher Mode Kamera: Depan (Selfie) vs Kamera Belakang */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => switchFacingMode('user')}
                    className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${facingMode === 'user'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <span>🤳 Kamera Depan (Selfie)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchFacingMode('environment')}
                    className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${facingMode === 'environment'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                      }`}
                  >
                    <span>📷 Kamera Belakang</span>
                  </button>
                </div>

                {/* Switcher Rasio Kamera: Potret (3:4), Kotak (1:1), Lanskap (16:9) */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-[10px] font-semibold text-slate-600">
                  <span className="text-[10px] text-slate-400 pl-1 font-bold">Rasio:</span>
                  <button
                    type="button"
                    onClick={() => setCameraRatio('3/4')}
                    className={`flex-1 py-1 rounded-lg transition text-center ${cameraRatio === '3/4'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'hover:text-slate-900'
                      }`}
                  >
                    📱 3:4 (Potret)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraRatio('1/1')}
                    className={`flex-1 py-1 rounded-lg transition text-center ${cameraRatio === '1/1'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'hover:text-slate-900'
                      }`}
                  >
                    🔲 1:1 (Kotak)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraRatio('16/9')}
                    className={`flex-1 py-1 rounded-lg transition text-center ${cameraRatio === '16/9'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'hover:text-slate-900'
                      }`}
                  >
                    📺 16:9
                  </button>
                </div>

                {photoPreview ? (
                  /* Preview Foto Setelah Dipotret */
                  <div className={`relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner mx-auto w-full ${cameraRatio === '3/4' ? 'aspect-[3/4] max-h-[350px]' : cameraRatio === '1/1' ? 'aspect-square max-h-[310px]' : 'aspect-video'
                    }`}>
                    <img
                      src={photoPreview}
                      alt="Hasil Foto"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-sm shadow">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Foto Berhasil Diambil</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        startLiveCamera();
                      }}
                      className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl border border-white/20 shadow-md flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3 text-amber-400" />
                      <span>Foto Ulang</span>
                    </button>
                  </div>
                ) : (
                  /* Viewfinder Live Kamera */
                  <div className={`relative rounded-2xl overflow-hidden border-2 border-teal-500 bg-slate-950 flex flex-col items-center justify-center shadow-md mx-auto w-full transition-all duration-300 ${cameraRatio === '3/4' ? 'aspect-[3/4] max-h-[350px]' : cameraRatio === '1/1' ? 'aspect-square max-h-[310px]' : 'aspect-video'
                    }`}>
                    {/* Live Video Element */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover transition-transform duration-200 ${facingMode === 'user' ? '-scale-x-100' : 'scale-x-100'
                        }`}
                    />

                    {/* Top Status & Quick Flip Button */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
                      <div className="bg-slate-950/70 text-white text-[9px] font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm border border-white/10 pointer-events-auto flex items-center gap-1">
                        <span>{facingMode === 'user' ? '🤳 Depan (Selfie)' : '📷 Kamera Belakang'}</span>
                      </div>

                      <button
                        type="button"
                        onClick={toggleFacingMode}
                        className="bg-slate-950/80 hover:bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl border border-white/20 backdrop-blur-md shadow-md pointer-events-auto flex items-center gap-1 active:scale-95 transition"
                      >
                        <FlipHorizontal className="w-3 h-3 text-amber-400" />
                        <span>Putar</span>
                      </button>
                    </div>

                    {/* Overlay Frame Guide Potret */}
                    {cameraRatio === '3/4' && (
                      <div className="absolute inset-3 border border-white/20 rounded-xl pointer-events-none flex items-center justify-center">
                        <span className="text-[9px] text-white/40 uppercase tracking-widest font-mono">
                          {facingMode === 'user' ? 'Area Foto Selfie Santri' : 'Area Foto Bukti Kegiatan'}
                        </span>
                      </div>
                    )}

                    {/* Shutter Button Overlay saat kamera aktif */}
                    <div className="absolute inset-x-0 bottom-3 px-3 flex items-center justify-between z-10">
                      <div className="bg-slate-950/70 text-white text-[9px] px-2 py-1 rounded-lg backdrop-blur-sm border border-white/10 font-mono">
                        🔴 Live {cameraRatio === '3/4' ? '3:4' : cameraRatio === '1/1' ? '1:1' : '16:9'}
                      </div>

                      <button
                        type="button"
                        onClick={takeSnapshot}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-full shadow-xl border-2 border-white flex items-center gap-1.5 active:scale-90 transition-transform"
                      >
                        <Camera className="w-4 h-4 text-slate-950" />
                        <span>Jepret Foto</span>
                      </button>
                    </div>

                    {/* Fallback jika izin kamera di browser belum diaktifkan */}
                    {cameraError && (
                      <div className="absolute inset-0 bg-slate-950/95 p-4 flex flex-col items-center justify-center text-center text-white space-y-2.5 z-20">
                        <Camera className="w-9 h-9 text-amber-400 animate-pulse" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-amber-300">Wajib Menggunakan Kamera Langsung</p>
                          <p className="text-[10px] text-slate-300 max-w-[240px] leading-relaxed">
                            {cameraError}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => startLiveCamera(facingMode)}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 active:scale-95 transition"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Aktifkan Kamera Live</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Status GPS Otomatis & Status Waktu WIB */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    Deteksi Lokasi GPS
                  </span>
                  {isCapturingGps ? (
                    <span className="text-[10px] text-teal-600 animate-pulse">Mencari GPS...</span>
                  ) : (
                    <button
                      type="button"
                      onClick={captureGPS}
                      className="text-[10px] text-teal-700 hover:underline flex items-center gap-0.5 font-semibold"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Refresh
                    </button>
                  )}
                </div>
                <div className="pt-1">
                  <input
                    type="text"
                    value={gpsLocation ? gpsLocation.name : ''}
                    onChange={(e) => {
                      if (gpsLocation) {
                        setGpsLocation({ ...gpsLocation, name: e.target.value });
                      }
                    }}
                    placeholder="Mengambil nama lokasi GPS..."
                    className="w-full text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-teal-500 shadow-2xs"
                  />
                  {gpsLocation && (
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      📍 Koordinat: {gpsLocation.lat.toFixed(5)}, {gpsLocation.long.toFixed(5)}
                    </div>
                  )}
                </div>

                {/* Validasi Waktu WIB Live */}
                {(() => {
                  const check = checkWaktuKegiatan(
                    selectedKegiatan?.isTimeRestricted ?? false,
                    selectedKegiatan?.jamMulai,
                    selectedKegiatan?.jamSelesai
                  );

                  return (
                    <div className={`p-2 rounded-xl border text-[11px] flex items-start gap-1.5 ${check.statusWaktu === 'TEPAT_WAKTU'
                      ? 'bg-emerald-50/80 text-emerald-900 border-emerald-200'
                      : 'bg-amber-50 text-amber-900 border-amber-200'
                      }`}>
                      <Clock className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${check.statusWaktu === 'TEPAT_WAKTU' ? 'text-emerald-600' : 'text-amber-600'}`} />
                      <div>
                        <div className="font-bold flex items-center gap-1">
                          <span>Waktu WIB: {getWIBTimeString()}</span>
                          <span>•</span>
                          <span>{check.statusWaktu === 'TEPAT_WAKTU' ? '✓ Tepat Waktu' : '⏳ Terlambat / Di Luar Jam'}</span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-0.5">{check.keterangan}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Input Catatan Santri */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  value={catatanSantri}
                  onChange={(e) => setCatatanSantri(e.target.value)}
                  placeholder="Contoh: Sholat subuh di masjid Al-Ikhlas bersama ayah..."
                  rows={2}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                ></textarea>
              </div>

              {/* Tombol Kirim */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 text-emerald-200" />
                      <span>Kirim Laporan & Buka WhatsApp Pembina</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL KONFIRMASI WHATSAPP MANUAL KE MUSYRIF */}
      {/* ============================================================= */}
      {waConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3.5 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800">Konfirmasi WhatsApp</h3>
                  <p className="text-[10px] text-slate-400">Kirim laporan ke Musyrif Pembimbing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1 text-xs">
              {/* Alert Info */}
              <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 text-[11px] leading-relaxed flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Alhamdulillah! Laporan tersimpan di sistem.</strong>
                  <p className="text-[10px] text-emerald-800 mt-0.5">
                    Silakan klik tombol di bawah untuk membuka WhatsApp & mengirimkan pesan konfirmasi langsung ke Ustadz Pembimbing.
                  </p>
                </div>
              </div>

              {/* Target Musyrif Card */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Tujuan Pengiriman (Musyrif):
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{waConfirmModal.musyrifNama}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      📱 {waConfirmModal.musyrifPhone}
                    </div>
                  </div>
                  <span className="text-[9px] bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full font-bold">
                    {waConfirmModal.musyrifAsrama}
                  </span>
                </div>
              </div>

              {/* Preview & Edit Draft Pesan WA */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Draft Pesan WhatsApp:
                  </label>
                  <span className="text-[9px] text-slate-400">Otomatis diformat</span>
                </div>
                <textarea
                  rows={8}
                  value={waConfirmModal.message}
                  onChange={(e) =>
                    setWaConfirmModal((prev) => ({ ...prev, message: e.target.value }))
                  }
                  className="w-full text-[11px] p-2.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 leading-relaxed shadow-2xs"
                ></textarea>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={() => {
                  openWhatsAppDirect(waConfirmModal.musyrifPhone, waConfirmModal.message);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka WhatsApp & Kirim Pesan</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const success = await copyMessageToClipboard(waConfirmModal.message);
                    if (success) {
                      setWaConfirmModal((prev) => ({ ...prev, copied: true }));
                      setTimeout(() => {
                        setWaConfirmModal((prev) => ({ ...prev, copied: false }));
                      }, 2500);
                    }
                  }}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{waConfirmModal.copied ? '✓ Tersalin!' : 'Salin Pesan'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWaConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM NAVIGATION BAR (MOBILE FIRST) */}
      {/* ------------------------------------------------------------- */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 z-40 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center p-1.5 transition ${activeTab === 'feed' ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Feed</span>
        </button>

        <button
          onClick={() => setActiveTab('tugas')}
          className={`flex flex-col items-center p-1.5 transition ${activeTab === 'tugas' ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Tugas</span>
        </button>

        {/* Center Floating Upload Button */}
        <button
          onClick={() => handleOpenUpload()}
          className="flex flex-col items-center -mt-5 bg-gradient-to-r from-teal-600 to-emerald-700 text-white p-3 rounded-full shadow-lg shadow-teal-700/30 hover:scale-105 active:scale-95 transition"
        >
          <Camera className="w-5 h-5 text-amber-300" />
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center p-1.5 transition ${activeTab === 'leaderboard' ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Ranking</span>
        </button>

        <button
          onClick={() => setActiveTab('profil')}
          className={`flex flex-col items-center p-1.5 transition ${activeTab === 'profil' ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Profil</span>
        </button>
      </nav>
    </div>
  );
}
