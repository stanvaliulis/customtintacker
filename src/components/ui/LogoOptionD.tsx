/**
 * LOGO OPTION D — "The Craft Label"
 * Horizontal banner with ribbon tails, like a craft beer label.
 * Rich forest green + gold/cream. Ornate but bold.
 * Premium, handcrafted feel — think whiskey label or brewery.
 */

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: { w: 70, h: 44 },
  md: { w: 110, h: 70 },
  lg: { w: 200, h: 126 },
  xl: { w: 300, h: 190 },
};

export default function LogoOptionD({ size = 'md', className = '' }: LogoProps) {
  const dims = sizes[size];
  const showFullText = size === 'lg' || size === 'xl';

  return (
    <svg
      width={dims.w}
      height={dims.h}
      viewBox="0 0 300 190"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Custom Tin Tackers logo"
      role="img"
    >
      {/* Main green banner shape */}
      <path
        d="M 30 30 L 270 30 L 270 140 L 150 170 L 30 140 Z"
        fill="#14532D"
      />

      {/* Gold border on banner */}
      <path
        d="M 30 30 L 270 30 L 270 140 L 150 170 L 30 140 Z"
        fill="none"
        stroke="#CA8A04"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* Inner border */}
      <path
        d="M 40 38 L 260 38 L 260 134 L 150 160 L 40 134 Z"
        fill="none"
        stroke="#CA8A04"
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity="0.6"
      />

      {/* Left ribbon tail */}
      <path d="M 10 20 L 40 20 L 40 50 L 10 40 Z" fill="#CA8A04" />
      <path d="M 10 20 L 40 20 L 40 50 L 10 40 Z" fill="none" stroke="#A16207" strokeWidth="1" />

      {/* Right ribbon tail */}
      <path d="M 290 20 L 260 20 L 260 50 L 290 40 Z" fill="#CA8A04" />
      <path d="M 290 20 L 260 20 L 260 50 L 290 40 Z" fill="none" stroke="#A16207" strokeWidth="1" />

      {/* Top ribbon bar */}
      <rect x="30" y="16" width="240" height="18" rx="2" fill="#CA8A04" />

      {showFullText ? (
        <>
          {/* CUSTOM — on gold ribbon */}
          <text
            x="150"
            y="30"
            textAnchor="middle"
            fill="#14532D"
            fontSize="12"
            fontFamily="'Georgia', 'Times New Roman', serif"
            fontWeight="700"
            letterSpacing="8"
          >
            CUSTOM
          </text>

          {/* TIN TACKERS — main text */}
          <text
            x="150"
            y="88"
            textAnchor="middle"
            fill="#FDE68A"
            fontSize="34"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontWeight="900"
            letterSpacing="4"
          >
            TIN TACKERS
          </text>

          {/* Decorative line */}
          <line x1="65" y1="98" x2="235" y2="98" stroke="#CA8A04" strokeWidth="1.5" />

          {/* Subline */}
          <text
            x="150"
            y="118"
            textAnchor="middle"
            fill="#86EFAC"
            fontSize="11"
            fontFamily="'Georgia', 'Times New Roman', serif"
            fontWeight="600"
            letterSpacing="5"
          >
            EMBOSSED ALUMINUM
          </text>

          {/* SIGNS — bottom */}
          <text
            x="150"
            y="145"
            textAnchor="middle"
            fill="#FDE68A"
            fontSize="16"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontWeight="700"
            letterSpacing="10"
          >
            SIGNS
          </text>
        </>
      ) : (
        <>
          {/* Compact: CTT */}
          <text
            x="150"
            y="30"
            textAnchor="middle"
            fill="#14532D"
            fontSize="11"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontWeight="700"
            letterSpacing="4"
          >
            CTT
          </text>

          <text
            x="150"
            y="100"
            textAnchor="middle"
            fill="#FDE68A"
            fontSize="42"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontWeight="900"
            letterSpacing="4"
          >
            CTT
          </text>
        </>
      )}
    </svg>
  );
}
