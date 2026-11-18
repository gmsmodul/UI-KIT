import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  QrCode,
  Camera,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  UserCheck,
  AlertCircle,
  Loader2,
  VideoOff,
} from 'lucide-react';
import { useApp, normalizeAttendanceClassKey } from '../../context/AppContext';
import { apiService } from '../../services/api';
import { QrAttendanceCheckInRecord, QrAttendanceSession } from '../../types';
import { PASTEL_THEMES } from '../../constants/theme';
import {
  ACTION_BTN_DARK,
  ACTION_BTN_PRIMARY,
  ACTION_BTN_SECONDARY,
  ACTION_BTN_SOFT_PRIMARY,
} from '../../constants/buttonStyles';

interface BarcodeDetectorResult {
  rawValue?: string;
}

interface BarcodeDetectorInstance {
  detect: (source: ImageBitmapSource) => Promise<BarcodeDetectorResult[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance;
}

function extractQrCredentials(rawInput: string): { sessionId: string; key: string } | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    const sessionId = (parsed.searchParams.get('qrSession') || '').trim();
    const key = (parsed.searchParams.get('k') || '').trim();
    if (sessionId && key) {
      return { sessionId, key };
    }
  } catch {
    const sessionMatch = trimmed.match(/[?&]qrSession=([^&\s]+)/i);
    const keyMatch = trimmed.match(/[?&]k=([^&\s]+)/i);
    if (sessionMatch?.[1] && keyMatch?.[1]) {
      return {
        sessionId: decodeURIComponent(sessionMatch[1]).trim(),
        key: decodeURIComponent(keyMatch[1]).trim(),
      };
    }
  }
  return null;
}

export const CrewQrCheckInModal: React.FC = () => {
  const {
    isCrewQrScannerOpen,
    setIsCrewQrScannerOpen,
    activeQrCheckInSessionId,
    setActiveQrCheckInSessionId,
    activeQrScanKey,
    setActiveQrScanKey,
    studentsDirectory,
    applyQrCheckInToAttendance,
    setSelectedAttendanceClass,
    setSelectedAttendanceSubject,
    setActivePage,
    triggerToast,
  } = useApp();

  const [session, setSession] = useState<QrAttendanceSession | null>(null);
  const [scanGrant, setScanGrant] = useState<string>('');
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [sessionError, setSessionError] = useState('');

  const [crewName, setCrewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [checkInResult, setCheckInResult] = useState<{
    alreadyCheckedIn: boolean;
    record: QrAttendanceCheckInRecord;
  } | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraMessage, setCameraMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanRafRef = useRef<number | null>(null);

  const stopCamera = () => {
    if (scanRafRef.current !== null) {
      cancelAnimationFrame(scanRafRef.current);
      scanRafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (!isCrewQrScannerOpen) {
      stopCamera();
      setCheckInResult(null);
      setSubmitError('');
      setSessionError('');
      setCameraMessage('');
      setScanGrant('');
      return;
    }
  }, [isCrewQrScannerOpen]);

  useEffect(() => {
    if (!isCrewQrScannerOpen || !activeQrCheckInSessionId) {
      setSession(null);
      setScanGrant('');
      return;
    }

    let cancelled = false;
    setIsLoadingSession(true);
    setSessionError('');
    setCheckInResult(null);
    setSubmitError('');

    apiService
      .getQrAttendanceSession(activeQrCheckInSessionId, activeQrScanKey)
      .then((res) => {
        if (!cancelled) {
          setSession(res.session);
          setScanGrant(res.scanGrant);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setSession(null);
          setScanGrant('');
          setSessionError(
            err instanceof Error
              ? err.message
              : 'QR Code kedaluwarsa atau tidak valid. Silakan scan langsung di layar kelas.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingSession(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isCrewQrScannerOpen, activeQrCheckInSessionId, activeQrScanKey]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const quickPickCrews = useMemo(() => {
    if (!session) return studentsDirectory.slice(0, 6);
    const normalizedTarget = normalizeAttendanceClassKey(session.classCode);
    const matching = studentsDirectory.filter(
      (s) => s.classCode.toLowerCase() === normalizedTarget.toLowerCase()
    );
    return (matching.length > 0 ? matching : studentsDirectory).slice(0, 8);
  }, [studentsDirectory, session]);

  if (!isCrewQrScannerOpen) return null;

  const handleClose = () => {
    stopCamera();
    setIsCrewQrScannerOpen(false);
    setActiveQrCheckInSessionId(null);
    setActiveQrScanKey('');
    if (
      typeof window !== 'undefined' &&
      (window.location.search.includes('qrSession') || window.location.search.includes('&k='))
    ) {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete('qrSession');
      nextUrl.searchParams.delete('k');
      window.history.replaceState(null, '', nextUrl.toString());
    }
  };

  const handleStartCamera = async () => {
    setCameraMessage('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraMessage('Perangkat ini tidak mendukung akses kamera browser. Scan QR langsung menggunakan kamera HP di kelas.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });

      const DetectorClass = (
        window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }
      ).BarcodeDetector;

      if (!DetectorClass) {
        setCameraMessage(
          'Kamera aktif. Gunakan kamera HP untuk memindai QR langsung di layar kelas.'
        );
        return;
      }

      const detector = new DetectorClass({ formats: ['qr_code'] });
      let lastScan = 0;

      const scanLoop = async (ts: number) => {
        if (!streamRef.current || !videoRef.current) return;
        if (ts - lastScan > 350 && videoRef.current.readyState >= 2) {
          lastScan = ts;
          try {
            const barcodes = await detector.detect(videoRef.current);
            const found = barcodes.find((b) => Boolean(b.rawValue));
            if (found?.rawValue) {
              const creds = extractQrCredentials(found.rawValue);
              if (creds) {
                stopCamera();
                setActiveQrScanKey(creds.key);
                setActiveQrCheckInSessionId(creds.sessionId);
                return;
              }
            }
          } catch {
            // continue scanning
          }
        }
        scanRafRef.current = requestAnimationFrame(scanLoop);
      };

      scanRafRef.current = requestAnimationFrame(scanLoop);
    } catch {
      setCameraMessage(
        'Izin kamera ditolak atau kamera tidak tersedia. Pastikan Anda memindai QR langsung di kelas dengan kamera HP.'
      );
      stopCamera();
    }
  };

  const handleConfirmCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !crewName.trim() || !scanGrant) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await apiService.submitQrCheckIn(session.id, crewName.trim(), scanGrant);
      applyQrCheckInToAttendance(res.record);
      setSelectedAttendanceClass(normalizeAttendanceClassKey(res.record.classCode));
      if (res.record.subject) {
        setSelectedAttendanceSubject(res.record.subject);
      }
      setCheckInResult({
        alreadyCheckedIn: res.alreadyCheckedIn,
        record: res.record,
      });
      triggerToast(
        res.record.status === 'On Time' ? 'Absensi Tercatat: On Time' : 'Absensi Tercatat: Late',
        `${res.record.crewName} masuk ke Attendance (${res.record.checkInTime})`,
        res.record.status === 'On Time' ? 'success' : 'warning'
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal mengirim absensi QR.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToAttendance = () => {
    if (session) {
      setSelectedAttendanceClass(normalizeAttendanceClassKey(session.classCode));
      if (session.subject) {
        setSelectedAttendanceSubject(session.subject);
      }
    }
    handleClose();
    setActivePage('attendance');
  };

  const theme = PASTEL_THEMES.periwinkle;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto border border-black/[0.08] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-black/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FEF1F5] text-[#ee2e65] flex items-center justify-center shrink-0">
              <QrCode className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#1C1D21]">
                Absensi QR Servolution Crew
              </h2>
              <p className="text-[11.5px] text-[#6E717A]">
                Scan langsung di kelas · waktu & status On Time / Late dicatat otomatis
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Tutup modal check-in QR"
            className="w-8 h-8 rounded-full border border-black/[0.09] flex items-center justify-center text-[#6E717A] hover:text-[#1C1D21] hover:bg-[#FAFBFD] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Step 1: Camera Scan Only (No shareable code input) */}
          {!activeQrCheckInSessionId && (
            <div className="rounded-2xl border border-black/[0.08] bg-[#FAFBFD] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[13px] font-semibold text-[#1C1D21] flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#ee2e65]" />
                  <span>Scan QR Langsung di Kelas</span>
                </div>
                {cameraActive ? (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className={`${ACTION_BTN_SECONDARY} hover:bg-[#FEF1F5]`}
                  >
                    <VideoOff className="w-4 h-4 shrink-0" />
                    <span>Matikan</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartCamera}
                    className={ACTION_BTN_DARK}
                  >
                    <Camera className="w-4 h-4 shrink-0" />
                    <span>Aktifkan Kamera</span>
                  </button>
                )}
              </div>

              {cameraActive && (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-black/[0.1]">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-40 h-40 rounded-2xl border-2 border-[#ee2e65]/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.32)]" />
                  </div>
                </div>
              )}

              <p className="text-[11.5px] text-[#6E717A] leading-relaxed">
                {cameraMessage ||
                  'Arahkan kamera ke layar QR kelas yang dibuka oleh PIC Servolution. QR bersifat dinamis dan tidak dapat dibagikan melalui tautan.'}
              </p>
            </div>
          )}

          {/* Loading state */}
          {activeQrCheckInSessionId && isLoadingSession && (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-[#6E717A]">
              <Loader2 className="w-6 h-6 animate-spin text-[#ee2e65]" />
              <span className="text-[13px] font-medium">Memverifikasi QR kelas...</span>
            </div>
          )}

          {/* Session Lookup Error */}
          {activeQrCheckInSessionId && !isLoadingSession && sessionError && (
            <div className="rounded-2xl bg-[#FEF1F5] border border-[#FBC2D4] p-5 text-center space-y-3">
              <AlertCircle className="w-7 h-7 text-[#ee2e65] mx-auto" />
              <div>
                <h3 className="text-[14px] font-semibold text-[#9D113C]">QR Tidak Valid / Kedaluwarsa</h3>
                <p className="text-[12px] text-[#9D113C]/85 mt-1">{sessionError}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveQrCheckInSessionId(null);
                  setActiveQrScanKey('');
                  setSessionError('');
                }}
                className={ACTION_BTN_SOFT_PRIMARY}
              >
                <span>Scan Ulang dengan Kamera</span>
              </button>
            </div>
          )}

          {/* Step 2: Session verified -> Name Entry or Result */}
          {session && !isLoadingSession && (
            <>
              {/* Session Card */}
              <div className="rounded-2xl border border-black/[0.07] bg-[#FAFBFD] p-4 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 ${theme.bg} ${theme.text} text-[11px] font-bold px-2.5 py-0.5 rounded-full`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                    {normalizeAttendanceClassKey(session.classCode)}
                  </span>
                  <span className="text-[11.5px] font-medium text-[#6E717A] tabular-nums">
                    Mulai {session.startHour}
                  </span>
                </div>
                <div className="text-[16px] font-semibold text-[#1C1D21]">{session.subject}</div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#6E717A] tabular-nums">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#8A8D98]" />
                    {session.room}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#8A8D98]" />
                    Batas On Time: <strong className="text-[#1C1D21]">{session.cutoffLabel.slice(0, 5)}</strong>
                  </span>
                </div>
              </div>

              {checkInResult ? (
                <div
                  className={`rounded-2xl border p-5 space-y-4 ${
                    checkInResult.record.status === 'Late'
                      ? 'bg-[#FEF1F5] border-[#FBC2D4]'
                      : 'bg-[#E6F9F0] border-[#A7EBC9]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
                        {checkInResult.record.status === 'Late' ? (
                          <Clock className="w-5 h-5 text-[#ee2e65]" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                        )}
                      </div>
                      <div>
                        <div className="text-[14.5px] font-bold text-[#1C1D21]">
                          {checkInResult.alreadyCheckedIn
                            ? 'Sudah Tercatat Sebelumnya'
                            : 'Absensi QR Berhasil Dicatat'}
                        </div>
                        <div className="text-[12.5px] text-[#1C1D21]/80 mt-0.5">
                          {checkInResult.record.crewName} ·{' '}
                          <span className="font-semibold tabular-nums">
                            {checkInResult.record.checkInTime}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[11.5px] font-bold bg-white shrink-0 ${
                        checkInResult.record.status === 'Late'
                          ? 'text-[#9D113C]'
                          : 'text-[#146C43]'
                      }`}
                    >
                      {checkInResult.record.status}
                    </span>
                  </div>

                  <p className="text-[12px] text-[#1C1D21]/75">
                    Data kehadiran otomatis masuk ke halaman Attendance pada kolom{' '}
                    <strong>
                      {checkInResult.record.status === 'Late' ? 'Attendance (Late)' : 'Attendance (On Time)'}
                    </strong>{' '}
                    beserta waktu check-in.
                  </p>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleGoToAttendance}
                      className={ACTION_BTN_DARK}
                    >
                      <span>Lihat di Attendance</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleConfirmCheckIn} className="space-y-4">
                  <div>
                    <label className="block text-[12.5px] font-semibold text-[#1C1D21] mb-1.5">
                      Nama Servolution Crew
                    </label>
                    <input
                      type="text"
                      value={crewName}
                      onChange={(e) => setCrewName(e.target.value)}
                      placeholder="Ketik nama lengkap atau pilih di bawah..."
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.1] bg-white text-[13.5px] text-[#1C1D21] focus:outline-none focus:border-[#ee2e65]"
                    />
                  </div>

                  <div>
                    <div className="text-[11.5px] font-medium text-[#6E717A] mb-2">
                      Pilih Cepat Crew Terdaftar:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {quickPickCrews.map((st) => {
                        const selected = crewName.trim().toLowerCase() === st.name.toLowerCase();
                        return (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setCrewName(st.name)}
                            className={`px-3 py-1.5 rounded-full text-[11.5px] font-medium border transition-colors cursor-pointer ${
                              selected
                                ? 'bg-[#FEF1F5] border-[#ee2e65] text-[#9D113C] font-semibold'
                                : 'bg-white border-black/[0.08] text-[#1C1D21] hover:bg-[#FAFBFD]'
                            }`}
                          >
                            {st.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {submitError && (
                    <div className="rounded-xl bg-[#FEF1F5] border border-[#FBC2D4] px-3.5 py-2.5 text-[12px] text-[#9D113C] font-medium">
                      {submitError}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={!crewName.trim() || isSubmitting || !scanGrant}
                      className={`${ACTION_BTN_PRIMARY} w-full`}
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      ) : (
                        <UserCheck className="w-4 h-4 shrink-0" />
                      )}
                      <span>Konfirmasi Absen Sekarang</span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
