/**
 * LOGO OPTION A — "The Letterpress"
 * Vintage print shop / old Americana feel.
 * Cream background, deep red + black, serif-style type.
 * Like a stamp on an old shipping crate.
 */

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 48,
  md: 72,
  lg: 120,
  xl: 180,
};

export default function LogoOptionA({ size = 'md', className = '' }: LogoProps) {
  const px = sizes[size];
  const showFullText = size === 'lg' || size === 'xl';

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Custom Tin Tackers logo"
      role="img"
    >
      {/* Cream/off-white background circle */}
      <circle cx="100" cy="100" r="96" fill="#FAF3E8" stroke="#1A1A1A" strokeWidth="3" />

      {/* Outer ring */}
      <circle cx="100" cy="100" r="88" fill="none" stroke="#8B1A1A" strokeWidth="2.5" />

      {/* Inner ring */}
      <circle cx="100" cy="100" r="82" fill="none" stroke="#8B1A1A" strokeWidth="1" />

      {/* Top arc: CUSTOM */}
      {showFullText && (
        <>
          <defs>
            <path id="topArcA" d="M 30,100 a 70,70 0 1,1 140,0" />
          </defs>
          <text
            fill="#1A1A1A"
            fontSize="14"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontWeight="700"
            letterSpacing="8"
          >
            <textPath href="#topArcA" startOffset="50%" textAnchor="middle">
              CUSTOM
            </textPath>
          </text>
        </>
      )}

      {/* Star dividers */}
      <text x="32" y="106" fill="#8B1A1A" fontSize="14" fontFamily="serif">&#9733;</text>
      <text x="160" y="106" fill="#8B1A1A" fontSize="14" fontFamily="serif">&#9733;</text>

      {/* Center: TIN TACKERS stacked in bold serif */}
      <text
        x="100"
        y="92"
        textAnchor="middle"
        fill="#8B1A1A"
        fontSize="28"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="900"
        letterSpacing="2"
      >
        TIN
      </text>
      <text
        x="100"
        y="120"
        textAnchor="middle"
        fill="#1A1A1A"
        fontSize="22"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="900"
        letterSpacing="3"
      >
        TACKERS
      </text>

      {/* Decorative line under */}
      <line x1="50" y1="130" x2="150" y2="130" stroke="#8B1A1A" strokeWidth="1.5" />

      {/* Bottom arc: EST. or tagline */}
      {showFullText && (
        <>
          <defs>
            <path id="bottomArcA" d="M 35,110 a 65,65 0 0,0 130,0" />
          </defs>
          <text
            fill="#1A1A1A"
            fontSize="11"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontWeight="400"
            letterSpacing="4"
          >
            <textPath href="#bottomArcA" startOffset="50%" textAnchor="middle">
              EMBOSSED SIGNS
            </textPath>
          </text>
        </>
      )}
    </svg>
  );
}
