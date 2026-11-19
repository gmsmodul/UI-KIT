import React, { useState, useRef } from 'react';
import { ShieldCheck, Camera } from 'lucide-react';

export interface ProfileCardProps {
  name: string;
  email: string;
  role: string;
  avatarSrc: string;
  initials?: string;
  verified?: boolean;
  bezel?: 'dark' | 'light';
  onChangeClick?: () => void;
  onAvatarSelect?: (dataUrl: string) => void;
  className?: string;
}

const VerifiedSealIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-label="Verified"
    className={className}
  >
    <path
      d="M12 2.25l2.12 1.54 2.61-.21 1.07 2.4 2.27 1.31-.28 2.61 1.51 2.14-1.51 2.14.28 2.61-2.27 1.31-1.07 2.4-2.61-.21L12 21.75l-2.12-1.54-2.61.21-1.07-2.4-2.27-1.31.28-2.61L2.7 12l1.51-2.14-.28-2.61 2.27-1.31 1.07-2.4 2.61.21L12 2.25z"
      fill="#FFFFFF"
    />
    <path
      d="M8.75 12.25l2.15 2.15 4.45-4.65"
      stroke="#18191D"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ProfileCard: React.FC<ProfileCardProps> = ({
  name,
  email,
  role,
  avatarSrc,
  initials = 'US',
  verified = true,
  bezel = 'dark',
  onChangeClick,
  onAvatarSelect,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Display only the single highest / primary role
  const highestRole = role.split(/[,/|·]/)[0]?.trim() || 'Role';

  const handleChangeButtonClick = () => {
    if (onAvatarSelect) {
      fileInputRef.current?.click();
      return;
    }
    onChangeClick?.();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAvatarSelect) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImgError(false);
        onAvatarSelect(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div
      className={`w-full max-w-[348px] p-[10px] rounded-[42px] transition-colors duration-200 ${
        bezel === 'dark'
          ? 'bg-[#1E1F23] ring-1 ring-white/[0.10] shadow-[0_24px_60px_-16px_rgba(0,0,0,0.42)]'
          : 'bg-[#ECEFF5] ring-1 ring-black/[0.08] shadow-[0_24px_56px_-18px_rgba(15,23,42,0.16)]'
      } ${className}`}
    >
      <div
        style={{ clipPath: 'inset(0 round 32px)' }}
        className="relative w-full aspect-[3/4.65] rounded-[32px] overflow-hidden isolate bg-[#B8BEC6] select-none"
      >
        {/* Full-bleed Portrait Image */}
        {imgError ? (
          <div className="w-full h-full bg-gradient-to-br from-[#CFD5DF] to-[#8C95A6] flex items-center justify-center">
            <span className="text-5xl font-bold text-white/90 tracking-tight">{initials}</span>
          </div>
        ) : (
          <>
            <img
              src={avatarSrc}
              alt={name}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover object-top"
            />
            {/* Progressive Frosted Blur Layer using masked blurred portrait (zero corner bleed) */}
            <div
              aria-hidden="true"
              style={{
                maskImage:
                  'linear-gradient(to bottom, transparent 38%, rgba(0,0,0,0.45) 58%, rgba(0,0,0,0.92) 76%, black 100%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, transparent 38%, rgba(0,0,0,0.45) 58%, rgba(0,0,0,0.92) 76%, black 100%)',
              }}
              className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[32px]"
            >
              <img
                src={avatarSrc}
                alt=""
                aria-hidden="true"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top scale-[1.12] blur-[18px]"
              />
            </div>
          </>
        )}

        {/* Soft Mist Contrast Scrim */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] z-10 rounded-b-[32px] bg-gradient-to-t from-[#1A1A1E]/76 via-[#333238]/38 to-transparent"
        />

        {/* Subtle Inner Edge Highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[32px] ring-1 ring-inset ring-white/25 z-20"
        />

        {/* Hidden photo input when Change triggers avatar upload */}
        {onAvatarSelect && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        )}

        {/* Foreground Content Overlay: Name, Email, Single Highest Role + Change CTA */}
        <div className="absolute inset-x-0 bottom-0 z-20 px-6 pb-6 pt-10 flex flex-col gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-[26px] font-bold tracking-[-0.02em] text-white leading-tight truncate drop-shadow-[0_1px_8px_rgba(0,0,0,0.18)]">
                {name}
              </h3>
              {verified && (
                <VerifiedSealIcon className="w-[24px] h-[24px] shrink-0 drop-shadow-[0_1px_6px_rgba(0,0,0,0.18)]" />
              )}
            </div>
            <p className="mt-1.5 text-[14.5px] leading-snug text-white/85 font-normal truncate drop-shadow-[0_1px_4px_rgba(0,0,0,0.18)]">
              {email}
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-0.5">
            <div
              className="inline-flex items-center gap-2 min-w-0 text-[15px] font-semibold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.18)]"
              title={`Role tertinggi: ${highestRole}`}
            >
              <ShieldCheck className="w-[18px] h-[18px] text-white/90 shrink-0 stroke-[1.9]" />
              <span className="truncate">{highestRole}</span>
            </div>

            <button
              type="button"
              onClick={handleChangeButtonClick}
              className="rounded-full px-5 py-2.5 text-[14.5px] font-semibold inline-flex items-center gap-1.5 bg-white/92 hover:bg-white text-[#151619] transition-all duration-200 active:scale-[0.97] cursor-pointer shrink-0 shadow-[0_6px_18px_rgba(0,0,0,0.16)]"
            >
              <Camera className="w-4 h-4 stroke-[2]" />
              <span>Change</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
