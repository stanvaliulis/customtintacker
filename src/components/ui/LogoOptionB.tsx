/**
 * LOGO OPTION B — "The Modern Wordmark"
 * Ultra-clean, minimal, contemporary.
 * Black + electric blue accent. No borders, no badges.
 * Think modern DTC brand — simple and confident.
 */

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: { w: 80, h: 32 },
  md: { w: 130, h: 48 },
  lg: { w: 220, h: 80 },
  xl: { w: 320, h: 116 },
};

export default function LogoOptionB({ size = 'md', className = '' }: LogoProps) {
  const dims = sizes[size];
  const showFullText = size === 'lg' || size === 'xl';

  return (
    <svg
      width={dims.w}
      height={dims.h}
      viewBox="0 0 320 116"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Custom Tin Tackers logo"
      role="img"
    >
      {/* Embossed aluminum "T" icon — a raised letter on a metal plate */}
      <rect x="0" y="20" width="76" height="76" rx="6" fill="#E5E7EB" />
      <rect x="4" y="24" width="68" height="68" rx="4" fill="#D1D5DB" />
      {/* Raised T shape */}
      <rect x="18" y="34" width="40" height="10" rx="2" fill="#374151" />
      <rect x="30" y="34" width="16" height="48" rx="2" fill="#374151" />
      {/* Emboss highlight on the T */}
      <rect x="18" y="34" width="40" height="3" rx="1.5" fill="#6B7280" opacity="0.5" />
      <rect x="30" y="34" width="5" height="48" rx="1.5" fill="#6B7280" opacity="0.3" />

      {showFullText ? (
        <>
          {/* TIN TACKERS — clean sans-serif */}
          <text
            x="94"
            y="58"
            fill="#111827"
            fontSize="32"
            fontFamily="'Helvetica Neue', Arial, sans-serif"
            fontWeight="800"
            letterSpacing="1"
          >
            TIN TACKERS
          </text>

          {/* Tagline */}
          <text
            x="94"
            y="80"
            fill="#6B7280"
            fontSize="13"
            fontFamily="'Helvetica Neue', Arial, sans-serif"
            fontWeight="500"
            letterSpacing="3"
          >
            CUSTOM EMBOSSED SIGNS
          </text>
        </>
      ) : (
        <>
          {/* Compact: brand name only */}
          <text
            x="90"
            y="70"
            fill="#111827"
            fontSize="34"
            fontFamily="'Helvetica Neue', Arial, sans-serif"
            fontWeight="800"
            letterSpacing="2"
          >
            CTT
          </text>
        </>
      )}
    </svg>
  );
}
