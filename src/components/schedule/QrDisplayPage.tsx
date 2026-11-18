import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Users, Clock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api';
import { QrAttendanceSession } from '../../types';
import { useApp, normalizeAttendanceClassKey } from '../../context/AppContext';

export const QrDisplayPage: React.FC = () => {
  const { qrCheckIns } = useApp();

  const sessionSpec = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        scheduleId: 'SCH-01',
        classCode: '302',
        subject: 'Mathematics',
        room: 'Room 204',
        dateStr: '',
        startHour: '08:00',
        endHour: '09:30',
        lateToleranceMin: 5,
      };
    }
    const params = new URLSearchParams(window.location.search);
    const parsedTol = Number(params.get('tol'));
    return {
      scheduleId: params.get('scheduleId') || 'SCH-01',
      classCode: params.get('classCode') || '302',
      subject: params.get('subject') || 'Servolution Class',
      room: params.get('room') || 'Main Hall',
      dateStr: params.get('dateStr') || '',
      startHour: params.get('startHour') || '08:00',
      endHour: params.get('endHour') || '09:30',
      lateToleranceMin: Number.isFinite(parsedTol) ? Math.max(0, Math.min(180, parsedTol)) : 5,
    };
  }, []);

  const [session, setSession] = useState<QrAttendanceSession | null>(null);
  const [rotatingKey, setRotatingKey] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Create a live anti-share QR session on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMsg('');

    apiService
      .createQrAttendanceSession(sessionSpec)
      .then((created) => {
        if (cancelled) return;
        setSession(created);
        setRotatingKey(created.rotatingKey || '');
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : 'Gagal membuat sesi QR.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sessionSpec]);

  // Silently rotate the anti-share key every 15 seconds so shared screenshots expire
  useEffect(() => {
    if (!session?.id) return;
    const interval = setInterval(() => {
      apiService
        .rotateQrAttendanceKey(session.id)
        .then((res) => {
          if (res?.key) {
            setRotatingKey(res.key);
          }
        })
        .catch(() => {});
    }, 15_000);

    return () => clearInterval(interval);
  }, [session?.id]);

  // Render crisp QR Code whenever session or rotatingKey updates
  useEffect(() => {
    if (!session?.id || !rotatingKey || typeof window === 'undefined') return;
    let cancelled = false;
    const scanUrl = `${window.location.origin}/?qrSession=${encodeURIComponent(
      session.id
    )}&k=${encodeURIComponent(rotatingKey)}`;

    QRCode.toDataURL(scanUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1C1D21',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [session?.id, rotatingKey]);

  const scannedList = useMemo(() => {
    if (!session?.id) return [];
    return qrCheckIns.filter((item) => item.sessionId === session.id);
  }, [qrCheckIns, session?.id]);

  return (
    <div className="min-h-screen bg-[#F3F4F8] text-[#1C1D21] p-4 sm:p-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-black/[0.08] shadow-[0_16px_48px_-12px_rgba(0,0,0,0.08)] overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left: Scannable Classroom QR Code Only */}
        <div className="md:col-span-6 p-7 sm:p-9 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-black/[0.06] bg-white">
          <div className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#9D113C] bg-[#FEF1F5] px-3 py-1 rounded-full mb-3">
            <QrCode className="w-3.5 h-3.5" />
            <span>{normalizeAttendanceClassKey(sessionSpec.classCode)}</span>
          </div>

          <h1 className="text-[20px] sm:text-[22px] font-bold text-[#1C1D21] tracking-tight">
            {sessionSpec.subject}
          </h1>
          <p className="text-[12.5px] text-[#6E717A] mt-1 tabular-nums">
            Mulai {sessionSpec.startHour} · Batas On Time{' '}
            <strong className="text-[#1C1D21]">
              {session?.cutoffLabel ? session.cutoffLabel.slice(0, 5) : sessionSpec.startHour}
            </strong>
          </p>

          <div className="mt-6 p-4 rounded-3xl border border-black/[0.08] bg-[#FAFBFD]">
            {loading ? (
              <div className="w-[260px] h-[260px] rounded-2xl bg-white flex flex-col items-center justify-center gap-2 text-[#6E717A]">
                <Loader2 className="w-7 h-7 animate-spin text-[#ee2e65]" />
                <span className="text-[12.5px] font-medium">Membuat QR Kelas...</span>
              </div>
            ) : errorMsg ? (
              <div className="w-[260px] h-[260px] rounded-2xl bg-[#FEF1F5] p-5 flex flex-col items-center justify-center gap-2 text-center">
                <AlertCircle className="w-7 h-7 text-[#ee2e65]" />
                <p className="text-[12.5px] font-medium text-[#9D113C]">{errorMsg}</p>
              </div>
            ) : qrDataUrl ? (
              <div className="bg-white p-2.5 rounded-2xl border border-black/[0.05]">
                <img
                  src={qrDataUrl}
                  alt={`QR Absensi ${sessionSpec.subject}`}
                  className="w-[248px] h-[248px] sm:w-[268px] sm:h-[268px] object-contain select-none pointer-events-none"
                />
              </div>
            ) : null}
          </div>

          <p className="text-[11.5px] text-[#8A8D98] mt-4 max-w-[280px]">
            Scan langsung di kelas menggunakan kamera HP. QR diperbarui otomatis tiap 15 detik dan tidak dapat dibagikan.
          </p>
        </div>

        {/* Right: Scanned Crew Names Only */}
        <div className="md:col-span-6 flex flex-col bg-[#FAFBFD]/50">
          <div className="px-6 py-5 bg-white border-b border-black/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Users className="w-4.5 h-4.5 text-[#ee2e65]" />
              <h2 className="text-[15px] font-semibold text-[#1C1D21]">
                Nama yang Berhasil Scan
              </h2>
            </div>
            <span className="min-w-[26px] h-[26px] px-2 rounded-full bg-[#FEF1F5] text-[#9D113C] text-[12px] font-bold flex items-center justify-center tabular-nums">
              {scannedList.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-black/[0.05] max-h-[460px]">
            {scannedList.length === 0 ? (
              <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-8 text-[#8A8D98]">
                <QrCode className="w-8 h-8 mb-2.5 opacity-35" />
                <p className="text-[13px] font-medium text-[#6E717A]">
                  Belum ada crew yang berhasil scan
                </p>
                <p className="text-[11.5px] mt-1">
                  Nama dan waktu kehadiran akan muncul otomatis di sini saat scan dilakukan.
                </p>
              </div>
            ) : (
              scannedList.map((item) => {
                const isLate = item.status === 'Late';
                return (
                  <div
                    key={item.id}
                    className="px-6 py-3.5 bg-white flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                          isLate
                            ? 'bg-[#FDE0E9] text-[#9D113C]'
                            : 'bg-[#C4F0DC] text-[#146C43]'
                        }`}
                      >
                        {item.initials}
                      </span>
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-semibold text-[#1C1D21] truncate">
                          {item.crewName}
                        </div>
                        <div className="text-[11.5px] text-[#8A8D98] tabular-nums">
                          {item.checkInTime}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                        isLate
                          ? 'bg-[#FEF1F5] text-[#9D113C]'
                          : 'bg-[#E6F9F0] text-[#146C43]'
                      }`}
                    >
                      {isLate ? (
                        <Clock className="w-3 h-3" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      <span>{item.status}</span>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
