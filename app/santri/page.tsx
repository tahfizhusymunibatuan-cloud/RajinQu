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
import { getWIBTimeString, checkWaktuKegiatan } from '@/lib/time-wib';
import { PrayerCountdownWidget } from '@/components/prayer-countdown-widget';
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
  const { user, logout } = useAuth();
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

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

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
      console.warn('Camera permission denied or unavailable:', err);
      setCameraError('Izin kamera belum aktif. Klik "Buka Kamera HP" di bawah.');
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

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      const context = canvas.getContext('2d');
      if (context) {
        if (facingMode === 'user') {
          // Cerminkan foto selfie agar natural dan sesuai tampilan viewfinder
          context.translate(cropWidth, 0);
          context.scale(-1, 1);
        }
        // Draw the cropped video frame onto canvas
        context.drawImage(video, startX, startY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
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
            console.warn('Reverse geocode error', err);
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
          console.warn('GPS Error or blocked', error);
          setGpsLocation({
            lat: -7.0116,
            long: 113.8279,
            name: 'Batuan, Kabupaten Sumenep, Jawa Timur',
          });
          setIsCapturingGps(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
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
    setSelectedKegiatan(kegiatan || kegiatanList[0]);
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
    if (!photoPreview) {
      alert('Harap ambil atau upload foto bukti kegiatan terlebih dahulu.');
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

  // Urutkan leaderboard
  const sortedLeaderboard = [...santriList].sort((a, b) => b.totalPoin - a.totalPoin);

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
                            onClick={() => toggleLike(lap.id, user?.id || 'guest')}
                            className={`flex items-center gap-1.5 text-xs font-semibold transition ${
                              lap.isLikedByUser ? 'text-rose-500' : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${lap.isLikedByUser ? 'fill-rose-500' : ''}`} />
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
                          {lap.comments.map((comm) => (
                            <div key={comm.id} className="text-xs bg-slate-50 p-2 rounded-xl">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 text-[11px]">{comm.nama}</span>
                                <span className="text-[9px] text-slate-400">{comm.waktu}</span>
                              </div>
                              <p className="text-slate-600 text-[11px] mt-0.5">{comm.isi}</p>
                            </div>
                          ))}

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

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Target Harian Santri</h2>
                <p className="text-xs text-slate-500">Selesaikan seluruh target untuk reward maksimal</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                  4 / {kegiatanList.length} Selesai
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {kegiatanList.map((keg, idx) => {
                // Dummy status: 3 kegiatan pertama sudah selesai
                const isCompleted = idx < 3;

                return (
                  <div
                    key={keg.id}
                    className={`bg-white rounded-2xl p-3.5 border transition ${
                      isCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 hover:border-teal-300'
                    } shadow-sm`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                          {renderKegiatanIcon(keg.icon)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
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
                                  </span>
                                );
                              })()
                            ) : (
                              <span className="flex items-center gap-1 px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>♾️ Waktu Fleksibel</span>
                              </span>
                            )}
                            <span className="text-teal-700 font-bold bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">+{keg.poin} Poin</span>
                          </div>
                        </div>
                      </div>

                      {/* Tombol Aksi */}
                      {isCompleted ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-100/60 px-2.5 py-1 rounded-xl shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Selesai</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenUpload(keg)}
                          className="flex items-center gap-1 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 px-3 py-1.5 rounded-xl shadow-sm active:scale-95 shrink-0 transition"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Lapor</span>
                        </button>
                      )}
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
              {/* Juara 2 */}
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200 text-center shadow-sm order-1">
                <div className="relative inline-block mb-1">
                  <img
                    src={sortedLeaderboard[1]?.avatarUrl}
                    alt={sortedLeaderboard[1]?.nama}
                    className="w-12 h-12 rounded-full mx-auto object-cover border-2 border-slate-300"
                  />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-300 text-slate-800 text-[10px] font-bold flex items-center justify-center">
                    2
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-800 truncate">{sortedLeaderboard[1]?.nama}</div>
                <div className="text-[10px] text-amber-600 font-extrabold mt-0.5">{sortedLeaderboard[1]?.totalPoin} Poin</div>
              </div>

              {/* Juara 1 (Paling Tinggi) */}
              <div className="bg-gradient-to-b from-amber-50 to-white p-3 rounded-2xl border-2 border-amber-400 text-center shadow-md order-2 -mt-3">
                <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1">👑 Juara 1</div>
                <div className="relative inline-block mb-1">
                  <img
                    src={sortedLeaderboard[0]?.avatarUrl}
                    alt={sortedLeaderboard[0]?.nama}
                    className="w-14 h-14 rounded-full mx-auto object-cover border-2 border-amber-400"
                  />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold flex items-center justify-center shadow">
                    1
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 truncate">{sortedLeaderboard[0]?.nama}</div>
                <div className="text-xs text-amber-600 font-black mt-0.5">{sortedLeaderboard[0]?.totalPoin} Poin</div>
              </div>

              {/* Juara 3 */}
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200 text-center shadow-sm order-3">
                <div className="relative inline-block mb-1">
                  <img
                    src={sortedLeaderboard[2]?.avatarUrl}
                    alt={sortedLeaderboard[2]?.nama}
                    className="w-12 h-12 rounded-full mx-auto object-cover border-2 border-amber-700/40"
                  />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-700 text-white text-[10px] font-bold flex items-center justify-center">
                    3
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-800 truncate">{sortedLeaderboard[2]?.nama}</div>
                <div className="text-[10px] text-amber-600 font-extrabold mt-0.5">{sortedLeaderboard[2]?.totalPoin} Poin</div>
              </div>
            </div>

            {/* List Peringkat 4 ke bawah */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-3 border-b border-slate-100 text-xs font-bold text-slate-700">
                Daftar Peringkat Santri
              </div>
              <div className="divide-y divide-slate-100">
                {sortedLeaderboard.map((santri, index) => {
                  const isCurrent = santri.id === user?.id || santri.nama === user?.nama;
                  return (
                    <div
                      key={santri.id}
                      className={`p-3 flex items-center justify-between ${
                        isCurrent ? 'bg-amber-50/70 font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center text-xs font-bold text-slate-500">
                          #{index + 1}
                        </span>
                        <img
                          src={santri.avatarUrl}
                          alt={santri.nama}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="text-xs text-slate-800 flex items-center gap-1">
                            <span>{santri.nama}</span>
                            {isCurrent && (
                              <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                                Kamu
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">{santri.asrama || 'Santri Pondok'}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-teal-700">{santri.totalPoin}</span>
                        <span className="text-[10px] text-slate-500 ml-1">Poin</span>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                className={`flex-1 py-1.5 rounded-lg transition ${
                  riwayatFilter === 'ALL' ? 'bg-white text-slate-900 font-bold shadow-sm' : 'text-slate-600'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setRiwayatFilter('APPROVED')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  riwayatFilter === 'APPROVED' ? 'bg-white text-emerald-700 font-bold shadow-sm' : 'text-slate-600'
                }`}
              >
                Disetujui
              </button>
              <button
                onClick={() => setRiwayatFilter('PENDING')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  riwayatFilter === 'PENDING' ? 'bg-white text-amber-700 font-bold shadow-sm' : 'text-slate-600'
                }`}
              >
                Menunggu
              </button>
              <button
                onClick={() => setRiwayatFilter('REJECTED')}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  riwayatFilter === 'REJECTED' ? 'bg-white text-rose-700 font-bold shadow-sm' : 'text-slate-600'
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

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[11px] font-semibold text-slate-500">Total Poin Terkumpul</div>
                <div className="text-xl font-extrabold text-teal-700 mt-1 flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>{santriTotalPoin} Poin</span>
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5">
                  {rewardPercent}% dari target {targetPoinPeriode} Poin
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[11px] font-semibold text-slate-500">Peringkat Saat Ini</div>
                <div className="text-xl font-extrabold text-amber-600 mt-1 flex items-center gap-1.5">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span>#{currentSantriUser?.peringkat || 1}</span>
                </div>
                <div className="text-[10px] text-teal-600 mt-0.5">Dari {santriList.length} Santri Terdaftar</div>
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
                  value={selectedKegiatan?.id}
                  onChange={(e) => {
                    const found = kegiatanList.find((k) => k.id === e.target.value);
                    if (found) setSelectedKegiatan(found);
                  }}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  {kegiatanList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama} (+{k.poin} Poin)
                    </option>
                  ))}
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
                    className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                      facingMode === 'user'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>🤳 Kamera Depan (Selfie)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchFacingMode('environment')}
                    className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                      facingMode === 'environment'
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
                    className={`flex-1 py-1 rounded-lg transition text-center ${
                      cameraRatio === '3/4'
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    📱 3:4 (Potret)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraRatio('1/1')}
                    className={`flex-1 py-1 rounded-lg transition text-center ${
                      cameraRatio === '1/1'
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    🔲 1:1 (Kotak)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraRatio('16/9')}
                    className={`flex-1 py-1 rounded-lg transition text-center ${
                      cameraRatio === '16/9'
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    📺 16:9
                  </button>
                </div>
                
                {photoPreview ? (
                  /* Preview Foto Setelah Dipotret */
                  <div className={`relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner mx-auto w-full ${
                    cameraRatio === '3/4' ? 'aspect-[3/4] max-h-[350px]' : cameraRatio === '1/1' ? 'aspect-square max-h-[310px]' : 'aspect-video'
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
                  <div className={`relative rounded-2xl overflow-hidden border-2 border-teal-500 bg-slate-950 flex flex-col items-center justify-center shadow-md mx-auto w-full transition-all duration-300 ${
                    cameraRatio === '3/4' ? 'aspect-[3/4] max-h-[350px]' : cameraRatio === '1/1' ? 'aspect-square max-h-[310px]' : 'aspect-video'
                  }`}>
                    {/* Live Video Element */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover transition-transform duration-200 ${
                        facingMode === 'user' ? '-scale-x-100' : 'scale-x-100'
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
                      <div className="absolute inset-0 bg-slate-950/90 p-4 flex flex-col items-center justify-center text-center text-white space-y-2 z-20">
                        <Camera className="w-8 h-8 text-amber-400 animate-pulse" />
                        <p className="text-xs font-semibold">{cameraError}</p>
                        <div className="flex gap-2 pt-1">
                          <input
                            type="file"
                            accept="image/*"
                            capture={facingMode === 'user' ? 'user' : 'environment'}
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-xl shadow"
                          >
                            📸 Buka Kamera HP
                          </button>
                          <button
                            type="button"
                            onClick={handleUseDemoSelfie}
                            className="px-2 py-1.5 bg-slate-800 text-amber-300 text-xs font-bold rounded-xl border border-amber-400/40"
                          >
                            ⚡ Demo
                          </button>
                        </div>
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
                    <div className={`p-2 rounded-xl border text-[11px] flex items-start gap-1.5 ${
                      check.statusWaktu === 'TEPAT_WAKTU'
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
          className={`flex flex-col items-center p-1.5 transition ${
            activeTab === 'feed' ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Feed</span>
        </button>

        <button
          onClick={() => setActiveTab('tugas')}
          className={`flex flex-col items-center p-1.5 transition ${
            activeTab === 'tugas' ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
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
          className={`flex flex-col items-center p-1.5 transition ${
            activeTab === 'leaderboard' ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Ranking</span>
        </button>

        <button
          onClick={() => setActiveTab('profil')}
          className={`flex flex-col items-center p-1.5 transition ${
            activeTab === 'profil' ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Profil</span>
        </button>
      </nav>
    </div>
  );
}
