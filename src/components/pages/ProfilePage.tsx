import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Mail,
  Briefcase,
  MapPin,
  Clock,
  ShieldCheck,
  Monitor,
  Smartphone,
  Sun,
  Moon,
  PanelLeft,
  Bell,
  KeyRound,
  Check,
  RotateCcw,
  Minus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProfileCard } from '../ui/ProfileCard';

interface ActiveSession {
  id: string;
  device: string;
  platform: string;
  location: string;
  lastActive: string;
  current: boolean;
  type: 'desktop' | 'mobile';
}

const INITIAL_SESSIONS: ActiveSession[] = [
  {
    id: 'sess-current',
    device: 'Chrome on Desktop',
    platform: 'Web Workspace',
    location: 'Jakarta, ID',
    lastActive: 'Aktif sekarang',
    current: true,
    type: 'desktop',
  },
  {
    id: 'sess-mobile',
    device: 'Mobile Safari',
    platform: 'iOS 18',
    location: 'Jakarta, ID',
    lastActive: '2 jam lalu',
    current: false,
    type: 'mobile',
  },
];

export const ProfilePage: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    resetUserProfile,
    setActivePage,
    theme,
    setTheme,
    sidebarOpen,
    setSidebarOpen,
    triggerToast,
  } = useApp();

  const [name, setName] = useState(userProfile.name);
  const [role, setRole] = useState(userProfile.role);
  const [email, setEmail] = useState(userProfile.email);
  const [department, setDepartment] = useState(userProfile.department);
  const [location, setLocation] = useState(userProfile.location);
  const [timezone, setTimezone] = useState(userProfile.timezone);
  const [bio, setBio] = useState(userProfile.bio);
  const [verified, setVerified] = useState(userProfile.verified);
  const [cardBezel, setCardBezel] = useState<'dark' | 'light'>('dark');

  // Preferences & Security states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [uiUpdatesNotify, setUiUpdatesNotify] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [sessions, setSessions] = useState<ActiveSession[]>(INITIAL_SESSIONS);

  // Password form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    setName(userProfile.name);
    setRole(userProfile.role);
    setEmail(userProfile.email);
    setDepartment(userProfile.department);
    setLocation(userProfile.location);
    setTimezone(userProfile.timezone);
    setBio(userProfile.bio);
    setVerified(userProfile.verified);
  }, [userProfile]);

  const hasChanges =
    name.trim() !== userProfile.name ||
    role.trim() !== userProfile.role ||
    email.trim() !== userProfile.email ||
    department.trim() !== userProfile.department ||
    location.trim() !== userProfile.location ||
    timezone.trim() !== userProfile.timezone ||
    bio.trim() !== userProfile.bio ||
    verified !== userProfile.verified;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: name.trim() || 'User',
      role: role.trim() || 'Role',
      email: email.trim() || userProfile.email,
      department: department.trim() || userProfile.department,
      location: location.trim() || userProfile.location,
      timezone: timezone.trim() || userProfile.timezone,
      bio: bio.trim(),
      verified,
    });
    triggerToast('Profil Disimpan', 'Perubahan informasi akun dan kartu profil diperbarui.', 'success');
  };

  const handleResetProfile = () => {
    resetUserProfile();
    triggerToast('Profil Direset', 'Data profil dikembalikan ke bawaan (User · Role).', 'info');
  };

  const handleRevokeSession = (sessionId: string) => {
    const target = sessions.find((s) => s.id === sessionId);
    if (!target || target.current) return;
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    triggerToast('Sesi Diakhiri', `Perangkat ${target.device} telah dikeluarkan.`, 'info');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Lengkapi seluruh kolom kata sandi terlebih dahulu.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Kata sandi baru minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    setPasswordError('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    triggerToast('Kata Sandi Diperbarui', 'Keamanan akun Anda telah diperbarui.', 'success');
  };

  return (
    <div className="flex-1 min-h-0 w-full overflow-y-auto overscroll-contain bg-white dark:bg-[#121418] transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-7 py-6 sm:py-8 space-y-8">
        {/* Top Back Action & Page Title */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E4E7EE] dark:border-white/[0.08]">
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setActivePage('uikit')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A5D67] dark:text-gray-400 hover:text-[#1C1D21] dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke UI KIT</span>
            </button>
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#1C1D21] dark:text-[#F3F4F6]">
              Profile
            </h1>
            <p className="text-sm text-[#646772] dark:text-gray-400">
              Pratinjau kartu profil interaktif, informasi akun, preferensi tampilan, dan keamanan sesi Anda.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetProfile}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E4E7EE] dark:border-white/[0.12] bg-white dark:bg-[#16191F] text-xs font-semibold text-[#374151] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#1E222B] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>
          </div>
        </div>

        {/* Main 2-Column Layout: Sticky Portrait Profile Card (Left) + Editable Account & Settings (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Glassmorphic Portrait Profile Card */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col items-center gap-4 lg:sticky lg:top-6">
            <ProfileCard
              name={name.trim() || 'User'}
              email={email.trim() || userProfile.email}
              role={role.trim() || 'Role'}
              avatarSrc={userProfile.avatarSrc}
              initials={userProfile.initials}
              verified={verified}
              bezel={cardBezel}
              onAvatarSelect={(dataUrl) => {
                updateUserProfile({ avatarSrc: dataUrl });
                triggerToast('Foto Profil Diperbarui', 'Foto pada kartu profil dan sidebar telah diganti.', 'success');
              }}
            />

            {/* Compact Frame & Metadata Summary below Card */}
            <div className="w-full max-w-[348px] rounded-2xl bg-[#FAFBFD] dark:bg-[#16191F] border border-[#E4E7EE] dark:border-white/[0.08] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#374151] dark:text-gray-300">
                  Bingkai Kartu
                </span>
                <div className="inline-flex p-0.5 rounded-lg bg-gray-100 dark:bg-[#121418] border border-black/[0.06] dark:border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setCardBezel('dark')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      cardBezel === 'dark'
                        ? 'bg-[#1E1F23] text-white shadow-2xs'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    Dark Frame
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardBezel('light')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      cardBezel === 'light'
                        ? 'bg-white dark:bg-[#232730] text-[#1C1D21] dark:text-white shadow-2xs'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    Light Frame
                  </button>
                </div>
              </div>

              <div className="pt-2.5 border-t border-[#ECEFF5] dark:border-white/[0.06] space-y-2 text-xs text-[#646772] dark:text-gray-400">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{email || userProfile.email}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Briefcase className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{department || userProfile.department}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{location || userProfile.location}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{timezone || userProfile.timezone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Account Details, Preferences, Security & Password */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Account Details Form */}
            <form
              onSubmit={handleSaveProfile}
              className="rounded-2xl bg-white dark:bg-[#16191F] border border-[#E4E7EE] dark:border-white/[0.08] p-5 sm:p-6 space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#E4E7EE] dark:border-white/[0.08]">
                <div>
                  <h2 className="text-[15px] font-semibold text-[#1C1D21] dark:text-[#F3F4F6]">
                    Informasi Akun
                  </h2>
                  <p className="text-xs text-[#646772] dark:text-gray-400 mt-0.5">
                    Perubahan nama, role, dan bio langsung terlihat di Profile Card serta footer sidebar.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#374151] dark:text-gray-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={verified}
                    onChange={(e) => setVerified(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#ee2e65] cursor-pointer"
                  />
                  <span>Verified Badge</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="block text-xs font-semibold text-[#374151] dark:text-gray-300">
                    Nama
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="User"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#121418] border border-[#D7DCE5] dark:border-white/[0.12] text-sm text-[#1C1D21] dark:text-gray-100 focus:outline-none focus:border-[#ee2e65] transition-colors"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="block text-xs font-semibold text-[#374151] dark:text-gray-300">
                    Role
                  </span>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Role"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#121418] border border-[#D7DCE5] dark:border-white/[0.12] text-sm text-[#1C1D21] dark:text-gray-100 focus:outline-none focus:border-[#ee2e65] transition-colors"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="block text-xs font-semibold text-[#374151] dark:text-gray-300">
                    Email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@designsystem.app"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#121418] border border-[#D7DCE5] dark:border-white/[0.12] text-sm text-[#1C1D21] dark:text-gray-100 focus:outline-none focus:border-[#ee2e65] transition-colors"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="block text-xs font-semibold text-[#374151] dark:text-gray-300">
                    Divisi / Tim
                  </span>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Product Design"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#121418] border border-[#D7DCE5] dark:border-white/[0.12] text-sm text-[#1C1D21] dark:text-gray-100 focus:outline-none focus:border-[#ee2e65] transition-colors"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="block text-xs font-semibold text-[#374151] dark:text-gray-300">
                    Lokasi
                  </span>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Jakarta, Indonesia"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#121418] border border-[#D7DCE5] dark:border-white/[0.12] text-sm text-[#1C1D21] dark:text-gray-100 focus:outline-none focus:border-[#ee2e65] transition-colors"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="block text-xs font-semibold text-[#374151] dark:text-gray-300">
                    Zona Waktu
                  </span>
                  <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="Asia/Jakarta (WIB)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#121418] border border-[#D7DCE5] dark:border-white/[0.12] text-sm text-[#1C1D21] dark:text-gray-100 focus:outline-none focus:border-[#ee2e65] transition-colors"
                  />
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="block text-xs font-semibold text-[#374151] dark:text-gray-300">
                  Bio Singkat
                </span>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Ceritakan singkat peran Anda..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#121418] border border-[#D7DCE5] dark:border-white/[0.12] text-sm text-[#1C1D21] dark:text-gray-100 focus:outline-none focus:border-[#ee2e65] transition-colors resize-none"
                />
              </label>

              <div className="pt-2 flex items-center justify-between gap-3">
                <span className="text-xs text-[#646772] dark:text-gray-400">
                  {hasChanges ? 'Ada perubahan belum disimpan.' : 'Semua informasi tersinkron.'}
                </span>
                <button
                  type="submit"
                  disabled={!hasChanges}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    hasChanges
                      ? 'bg-[#ee2e65] hover:bg-[#d82358] text-white cursor-pointer shadow-xs'
                      : 'bg-gray-100 dark:bg-[#1F232C] text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>

            {/* Workspace Preferences */}
            <div className="rounded-2xl bg-white dark:bg-[#16191F] border border-[#E4E7EE] dark:border-white/[0.08] p-5 sm:p-6 space-y-4">
              <div className="pb-3 border-b border-[#E4E7EE] dark:border-white/[0.08]">
                <h2 className="text-[15px] font-semibold text-[#1C1D21] dark:text-[#F3F4F6]">
                  Preferensi Workspace
                </h2>
                <p className="text-xs text-[#646772] dark:text-gray-400 mt-0.5">
                  Sesuaikan tema dan tata letak sidebar secara langsung.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {theme === 'dark' ? (
                    <Moon className="w-4 h-4 text-[#C6F135] shrink-0" />
                  ) : (
                    <Sun className="w-4 h-4 text-[#5A5D67] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#1C1D21] dark:text-gray-100">
                      Tema Tampilan
                    </div>
                    <div className="text-xs text-[#646772] dark:text-gray-400">
                      {theme === 'dark' ? 'Mode Gelap aktif' : 'Mode Terang aktif'}
                    </div>
                  </div>
                </div>
                <div className="inline-flex p-0.5 rounded-lg bg-gray-100 dark:bg-[#121418] border border-black/[0.06] dark:border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      theme === 'light'
                        ? 'bg-white text-[#1C1D21] shadow-2xs'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-[#232730] text-white shadow-2xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Dark
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#F0F2F6] dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <PanelLeft className="w-4 h-4 text-[#5A5D67] dark:text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#1C1D21] dark:text-gray-100">
                      Ukuran Sidebar
                    </div>
                    <div className="text-xs text-[#646772] dark:text-gray-400">
                      {sidebarOpen ? 'Melebar (260px)' : 'Ringkas (84px)'}
                    </div>
                  </div>
                </div>
                <div className="inline-flex p-0.5 rounded-lg bg-gray-100 dark:bg-[#121418] border border-black/[0.06] dark:border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      sidebarOpen
                        ? 'bg-white dark:bg-[#232730] text-[#1C1D21] dark:text-white shadow-2xs'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    Full
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      !sidebarOpen
                        ? 'bg-white dark:bg-[#232730] text-[#1C1D21] dark:text-white shadow-2xs'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    Mini
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#F0F2F6] dark:border-white/[0.06]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Bell className="w-4 h-4 text-[#5A5D67] dark:text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#1C1D21] dark:text-gray-100">
                      Notifikasi Pembaruan
                    </div>
                    <div className="text-xs text-[#646772] dark:text-gray-400">
                      Pemberitahuan rilis komponen UI KIT
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={uiUpdatesNotify}
                  onClick={() => setUiUpdatesNotify((v) => !v)}
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                    uiUpdatesNotify ? 'bg-[#ee2e65]' : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      uiUpdatesNotify ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#F0F2F6] dark:border-white/[0.06]">
                <div className="min-w-0 pl-6.5">
                  <div className="text-sm font-medium text-[#1C1D21] dark:text-gray-100">
                    Ringkasan Mingguan
                  </div>
                  <div className="text-xs text-[#646772] dark:text-gray-400">
                    Kirim ringkasan perubahan via email
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={weeklyDigest}
                  onClick={() => setWeeklyDigest((v) => !v)}
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                    weeklyDigest ? 'bg-[#ee2e65]' : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      weeklyDigest ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Security & Sessions */}
            <div className="rounded-2xl bg-white dark:bg-[#16191F] border border-[#E4E7EE] dark:border-white/[0.08] p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EE] dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#ee2e65]" />
                  <h2 className="text-[15px] font-semibold text-[#1C1D21] dark:text-[#F3F4F6]">
                    Keamanan &amp; Sesi Aktif
                  </h2>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={twoFactorEnabled}
                  onClick={() => {
                    setTwoFactorEnabled((prev) => {
                      const next = !prev;
                      triggerToast(
                        'Autentikasi 2 Faktor',
                        next ? 'Verifikasi 2FA diaktifkan.' : 'Verifikasi 2FA dinonaktifkan.',
                        next ? 'success' : 'info'
                      );
                      return next;
                    });
                  }}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                    twoFactorEnabled
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <span>2FA: {twoFactorEnabled ? 'Aktif' : 'Nonaktif'}</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#FAFBFD] dark:bg-[#121418] border border-[#ECEFF5] dark:border-white/[0.06]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {s.type === 'desktop' ? (
                        <Monitor className="w-4 h-4 text-[#5A5D67] dark:text-gray-400 shrink-0" />
                      ) : (
                        <Smartphone className="w-4 h-4 text-[#5A5D67] dark:text-gray-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#1C1D21] dark:text-gray-100 truncate">
                          {s.device}
                        </div>
                        <div className="text-[11px] text-[#646772] dark:text-gray-400 truncate">
                          {s.platform} · {s.location} · {s.lastActive}
                        </div>
                      </div>
                    </div>
                    {s.current ? (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                        Perangkat ini
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRevokeSession(s.id)}
                        title="Akhiri sesi perangkat ini"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                      >
                        <Minus className="w-3 h-3" />
                        <span>Keluar</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Password Update Form */}
            <form
              onSubmit={handlePasswordSubmit}
              className="rounded-2xl bg-white dark:bg-[#16191F] border border-[#E4E7EE] dark:border-white/[0.08] p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-center gap-2 pb-3 border-b border-[#E4E7EE] dark:border-white/[0.08]">
                <KeyRound className="w-4 h-4 text-[#5A5D67] dark:text-gray-400" />
                <div>
                  <h2 className="text-[15px] font-semibold text-[#1C1D21] dark:text-[#F3F4F6]">
                    Ubah Kata Sandi
                  </h2>
                  <p className="text-xs text-[#646772] dark:text-gray-400">
                    Gunakan minimal 8 karakter untuk menjaga keamanan akun Anda.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="block space-y-1.5">
                  <span className="block text-xs font-semibold text-[#374151] dark:text-gray-300">
                    Kata Sandi Saat Ini
                  </span>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#121418] border border-[#D7DCE5] dark:border-white/[0.12] text-sm text-[#1C1D21] dark:text-gray-100 focus:outline-none focus:border-[#ee2e65] transition-colors"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="block text-xs font-semibold text-[#374151] dark:text-gray-300">
                    Kata Sandi Baru
                  </span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="Minimal 8 karakter"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#121418] border border-[#D7DCE5] dark:border-white/[0.12] text-sm text-[#1C1D21] dark:text-gray-100 focus:outline-none focus:border-[#ee2e65] transition-colors"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="block text-xs font-semibold text-[#374151] dark:text-gray-300">
                    Konfirmasi Kata Sandi
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="Ulangi kata sandi baru"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#121418] border border-[#D7DCE5] dark:border-white/[0.12] text-sm text-[#1C1D21] dark:text-gray-100 focus:outline-none focus:border-[#ee2e65] transition-colors"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="text-xs text-rose-600 dark:text-rose-400 min-h-[1rem]">
                  {passwordError}
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1C1D21] dark:bg-white text-white dark:text-[#121418] text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Perbarui Kata Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
