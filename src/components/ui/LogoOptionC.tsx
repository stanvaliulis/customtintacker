/**
 * LOGO OPTION C — "The Neon Sign"
 * Inspired by the neon signs you'd see in a bar window.
 * Dark background, bright glowing outlines.
 * Electric coral/pink + warm yellow on near-black.
 * Fun, memorable, on-brand for the bar/brewery world.
 */

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: { w: 60, h: 60 },
  md: { w: 90, h: 90 },
  lg: { w: 150, h: 150 },
  xl: { w: 220, h: 220 },
};

export default function LogoOptionC({ size = 'md', className = '' }: LogoProps) {
  const dims = sizes[size];
  const showFullText = size === 'lg' || size === 'xl';

  return (
    <svg
      width={dims.w}
      height={dims.h}
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Custom Tin Tackers logo"
      role="img"
    >
      {/* Dark background */}
      <rect width="220" height="220" rx="16" fill="#0F172A" />

      {/* Outer neon border — warm yellow glow */}
      <rect
        x="10" y="10" width="200" height="200" rx="12"
        fill="none" stroke="#FBBF24" strokeWidth="3"
      />

      {/* Inner neon border — coral/red */}
      <rect
        x="20" y="20" width="180" height="180" rx="8"
        fill="none" stroke="#F87171" strokeWidth="2"
      />

      {/* Arrow / tin tacker shape outline in neon */}
      <path
        d="M 110 40 L 170 70 L 170 150 L 110 180 L 50 150 L 50 70 Z"
        fill="none"
        stroke="#FBBF24"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {showFullText ? (
        <>
          {/* CUSTOM — top */}
          <text
            x="110"
            y="78"
            textAnchor="middle"
            fill="#F87171"
            fontSize="14"
            fontFamily="'Arial', 'Helvetica Neue', sans-serif"
            fontWeight="700"
            letterSpacing="6"
          >
            CUSTOM
          </text>

          {/* TT — big neon letters */}
          <text
            x="110"
            y="128"
            textAnchor="middle"
            fill="#FBBF24"
            fontSize="52"
            fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
            fontWeight="900"
            letterSpacing="6"
          >
            TT
          </text>

          {/* TIN TACKERS — bottom */}
          <text
            x="110"
            y="158"
            textAnchor="middle"
            fill="#F87171"
            fontSize="12"
            fontFamily="'Arial', 'Helvetica Neue', sans-serif"
            fontWeight="700"
            letterSpacing="4"
          >
            TIN TACKERS
          </text>
        </>
      ) : (
        <>
          {/* Compact: TT */}
          <text
            x="110"
            y="126"
            textAnchor="middle"
            fill="#FBBF24"
            fontSize="56"
            fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
            fontWeight="900"
            letterSpacing="6"
          >
            TT
          </text>
        </>
      )}
    </svg>
  );
}
