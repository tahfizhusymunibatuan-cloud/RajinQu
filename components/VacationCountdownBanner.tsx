'use client';

import React from 'react';
import { Calendar, Clock, Award, CheckCircle2, AlertCircle } from 'lucide-react';
import { MockPeriodeLiburan } from '@/lib/mock-data';

interface VacationCountdownBannerProps {
  periode: MockPeriodeLiburan | null | undefined;
  variant?: 'santri' | 'musyrif' | 'pengawas' | 'compact';
  targetPoin?: number;
  currentPoin?: number;
}

export default function VacationCountdownBanner({
  periode,
  variant = 'santri',
  targetPoin,
  currentPoin = 0,
}: VacationCountdownBannerProps) {
  if (!periode) {
    return (
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl p-3.5 border border-teal-700/50 shadow-md">
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-200">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>Periode Liburan PTQA Batuan</span>
        </div>
        <p className="text-[11px] text-teal-300 mt-1">Belum ada periode liburan aktif yang diset oleh Admin.</p>
      </div>
    );
  }

  // Parse Tanggal Mulai dan Selesai
  const startStr = periode.tanggalMulai || (periode.rentangTanggal?.split(' s/d ')[0]) || '2026-08-01';
  const endStr = periode.tanggalSelesai || (periode.rentangTanggal?.split(' s/d ')[1]) || '2026-08-31';

  const startDate = new Date(startStr);
  const endDate = new Date(endStr);
  const now = new Date();

  // Reset clock for date-only comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  const totalDurationMs = endOnly.getTime() - startOnly.getTime();
  const totalDays = Math.max(1, Math.ceil(totalDurationMs / (1000 * 60 * 60 * 24)) + 1);

  const remainingMs = endOnly.getTime() - today.getTime();
  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

  const elapsedDays = Math.max(0, Math.min(totalDays, totalDays - remainingDays));
  const timeProgressPercent = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));

  // Format Tanggal Indonesia
  const formatDateIndo = (dStr: string) => {
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        const months = [
          'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
          'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
        ];
        const day = parseInt(parts[2], 10);
        const month = months[parseInt(parts[1], 10) - 1] || parts[1];
        const year = parts[0];
        return `${day} ${month} ${year}`;
      }
      return dStr;
    } catch {
      return dStr;
    }
  };

  const isFinished = remainingDays < 0;
  const isLastDay = remainingDays === 0;
  const isNotStarted = today.getTime() < startOnly.getTime();

  return (
    <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-3.5 border border-teal-500/30 shadow-lg relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="relative z-10 space-y-2.5">
        {/* Header Title & Sisa Hari Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-teal-300">
                Periode Liburan Santri
              </span>
            </div>
            <h3 className="text-xs font-bold text-white tracking-tight leading-snug">
              {periode.nama}
            </h3>
          </div>

          {/* Sisa Hari Badge Status */}
          {isFinished ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-slate-400" />
              <span>Liburan Selesai</span>
            </span>
          ) : isLastDay ? (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 shrink-0 flex items-center gap-1 animate-pulse">
              <AlertCircle className="w-3 h-3 text-rose-400" />
              <span>Hari Terakhir!</span>
            </span>
          ) : isNotStarted ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 shrink-0 flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" />
              <span>Belum Mulai</span>
            </span>
          ) : (
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 shrink-0 flex items-center gap-1 shadow-2xs">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Sisa {remainingDays} Hari Lagi</span>
            </span>
          )}
        </div>

        {/* Date Range & Progress Countdown */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-2.5 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[11px] text-teal-200">
            <span className="font-medium">
              📅 {formatDateIndo(startStr)} <span className="text-teal-400 font-bold">s/d</span> {formatDateIndo(endStr)}
            </span>
            <span className="text-[10px] font-bold bg-teal-800/60 text-teal-200 px-1.5 py-0.2 rounded border border-teal-700">
              Total {totalDays} Hari
            </span>
          </div>

          {/* Time Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-300 font-medium">
              <span>Waktu Berjalan: {elapsedDays} / {totalDays} Hari</span>
              <span>{timeProgressPercent}% Waktu</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isFinished
                    ? 'bg-slate-500'
                    : isLastDay
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-teal-400 to-amber-400'
                }`}
                style={{ width: `${timeProgressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Reward Target Point Estimation (If provided) */}
        {targetPoin !== undefined && (
          <div className="flex items-center justify-between text-[11px] text-teal-200 pt-0.5 px-0.5">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Target: <b className="text-amber-300 font-bold">{targetPoin} Poin</b></span>
            </span>
            {!isFinished && remainingDays > 0 && (
              <span className="text-[10px] text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20 font-semibold">
                ~{Math.ceil(Math.max(0, targetPoin - currentPoin) / Math.max(1, remainingDays))} Poin/Hari Lagi
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
