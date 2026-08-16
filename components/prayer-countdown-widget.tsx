'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  Sunrise,
  Sun,
  Sparkles,
  SunMedium,
  CloudSun,
  Sunset,
  Moon,
  Camera,
  ChevronRight,
  Calendar
} from 'lucide-react';
import {
  DEFAULT_PRAYER_SCHEDULE,
  getNextPrayerInfo,
  calculateActivityCountdown,
  getCurrentWIBDate,
  PrayerTimeItem,
} from '@/lib/prayer-times';
import { MockKegiatan } from '@/lib/mock-data';

interface PrayerCountdownWidgetProps {
  kegiatanList?: MockKegiatan[];
  onOpenUpload?: (kegiatan: MockKegiatan) => void;
  compact?: boolean;
}

export function PrayerCountdownWidget({
  kegiatanList = [],
  onOpenUpload,
  compact = false,
}: PrayerCountdownWidgetProps) {
  const [timeStr, setTimeStr] = useState<string>('');
  const [nextPrayerData, setNextPrayerData] = useState<any>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const wib = getCurrentWIBDate();
      const h = wib.getHours().toString().padStart(2, '0');
      const m = wib.getMinutes().toString().padStart(2, '0');
      const s = wib.getSeconds().toString().padStart(2, '0');
      setTimeStr(`${h}:${m}:${s} WIB`);
      setNextPrayerData(getNextPrayerInfo(DEFAULT_PRAYER_SCHEDULE));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const restrictedKegiatans = kegiatanList.filter((k) => k.isTimeRestricted && k.jamMulai && k.jamSelesai);

  useEffect(() => {
    if (restrictedKegiatans.length > 0 && !selectedActivityId) {
      const activeOne = restrictedKegiatans.find((k) => {
        const info = calculateActivityCountdown(k.jamMulai, k.jamSelesai);
        return info.status === 'SEDANG_DIBUKA' || info.status === 'SEGERA_BERAKHIR';
      });
      setSelectedActivityId(activeOne ? activeOne.id : restrictedKegiatans[0].id);
    }
  }, [restrictedKegiatans, selectedActivityId]);

  const activeKegiatan = restrictedKegiatans.find((k) => k.id === selectedActivityId) || restrictedKegiatans[0];
  const activityCountdown = activeKegiatan
    ? calculateActivityCountdown(activeKegiatan.jamMulai, activeKegiatan.jamSelesai)
    : null;

  const renderPrayerIcon = (iconName: string, className = 'w-3.5 h-3.5') => {
    switch (iconName) {
      case 'Sunrise':
        return <Sunrise className={className} />;
      case 'Sun':
        return <Sun className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'SunMedium':
        return <SunMedium className={className} />;
      case 'CloudSun':
        return <CloudSun className={className} />;
      case 'Sunset':
        return <Sunset className={className} />;
      case 'Moon':
        return <Moon className={className} />;
      default:
        return <Clock className={className} />;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs space-y-3">
      {/* Header: Title, Location & Clock */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold border border-teal-200/60 shrink-0">
            🕌
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 leading-tight">Jadwal Sholat & Waktu Lapor</h3>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
              <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
              <span>Sumenep (WIB)</span>
            </div>
          </div>
        </div>

        {/* Real-time WIB Clock */}
        <div className="text-right">
          <span className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
            <Clock className="w-3 h-3 text-teal-600" />
            <span>{timeStr || '00:00:00 WIB'}</span>
          </span>
        </div>
      </div>

      {/* Next Prayer Banner */}
      {nextPrayerData && (
        <div className="flex items-center justify-between bg-teal-50/70 border border-teal-200/80 rounded-xl px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-teal-800 font-medium text-[11px]">
              Menuju <strong>Sholat {nextPrayerData.nextPrayer.name}</strong> ({nextPrayerData.nextPrayer.time} WIB)
            </span>
          </div>
          <span className="font-mono text-[11px] font-extrabold text-teal-900 bg-white px-2 py-0.5 rounded-md border border-teal-200 shadow-2xs">
            -{nextPrayerData.countdownStr}
          </span>
        </div>
      )}

      {/* 5 Prayer Time Grid */}
      <div className="grid grid-cols-5 gap-1.5 text-center">
        {DEFAULT_PRAYER_SCHEDULE.filter((p) => ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'].includes(p.id)).map(
          (item) => {
            const isNext = nextPrayerData?.nextPrayer?.id === item.id;
            return (
              <div
                key={item.id}
                className={`py-2 px-1 rounded-xl transition flex flex-col items-center justify-center gap-0.5 border ${
                  isNext
                    ? 'bg-teal-700 text-white font-bold border-teal-800 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                }`}
              >
                <span className={`text-[10px] ${isNext ? 'text-teal-100' : 'text-slate-500'}`}>{item.name}</span>
                <span className="text-xs font-mono font-bold">{item.time}</span>
              </div>
            );
          }
        )}
      </div>

      {/* Activity Countdown Strip */}
      {restrictedKegiatans.length > 0 && activeKegiatan && activityCountdown && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/80 p-2.5 rounded-xl">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 truncate">
              <span>{activeKegiatan.nama}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
              <span>⏰ {activeKegiatan.jamMulai} - {activeKegiatan.jamSelesai} WIB</span>
              {activityCountdown.status === 'SEDANG_DIBUKA' && (
                <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Buka
                </span>
              )}
              {activityCountdown.status === 'SEGERA_BERAKHIR' && (
                <span className="text-amber-800 font-bold bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300 animate-pulse">
                  Segera Berakhir
                </span>
              )}
              {activityCountdown.status === 'BERAKHIR' && (
                <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                  Lewat Batas
                </span>
              )}
            </div>
          </div>

          {onOpenUpload && (
            <button
              type="button"
              onClick={() => onOpenUpload(activeKegiatan)}
              className="inline-flex items-center gap-1 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition active:scale-95 shrink-0"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Setor</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
