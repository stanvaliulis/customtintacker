'use client';

import { useId } from 'react';

interface ProductImagePlaceholderProps {
  shape: 'square' | 'rectangle' | 'circle' | 'can' | 'bottle-cap' | 'die-cut' | 'shield' | 'arrow' | 'street-sign' | 'license-plate';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  productName?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ProductImagePlaceholder({
  shape,
  size: _size,
  label,
  productName,
}: ProductImagePlaceholderProps) {
  const uid = useId().replace(/:/g, '');

  // Use different viewBox aspect ratios per shape
  const viewBoxes: Record<string, string> = {
    square: '0 0 400 400',
    rectangle: '0 0 480 360',
    circle: '0 0 400 400',
    can: '0 0 300 500',
    'bottle-cap': '0 0 400 400',
    'die-cut': '0 0 400 400',
    shield: '0 0 360 440',
    arrow: '0 0 500 320',
    'street-sign': '0 0 600 120',
    'license-plate': '0 0 480 240',
  };

  const viewBox = viewBoxes[shape] || '0 0 400 400';
  const [, , vbW, vbH] = viewBox.split(' ').map(Number);

  const cx = vbW / 2;
  const cy = vbH / 2;

  const displayText = productName || 'YOUR BRAND';
  const subText = productName ? 'CUSTOM TIN TACKER' : 'YOUR DESIGN HERE';

  // Scoped IDs to avoid collisions when multiple placeholders are on the page
  const id = (suffix: string) => `${suffix}${uid}`;
  const ref = (suffix: string) => `url(#${id(suffix)})`;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className="select-none"
      role="img"
      aria-label={productName || label || `${shape} tin tacker sign`}
    >
      <defs>
        {/* Background gradient - subtle radial for depth */}
        <radialGradient id={id('bg')} cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#1e2330" />
          <stop offset="100%" stopColor="#0f1219" />
        </radialGradient>

        {/* Brushed aluminum base - horizontal linear gradient */}
        <linearGradient id={id('alum')} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#b8bcc6" />
          <stop offset="15%" stopColor="#d1d5de" />
          <stop offset="30%" stopColor="#c4c8d1" />
          <stop offset="45%" stopColor="#dcdfe6" />
          <stop offset="55%" stopColor="#c8ccd5" />
          <stop offset="70%" stopColor="#d6d9e1" />
          <stop offset="85%" stopColor="#c0c4cd" />
          <stop offset="100%" stopColor="#b5b9c3" />
        </linearGradient>

        {/* Vertical sheen overlay for metallic look */}
        <linearGradient id={id('sheen')} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
          <stop offset="25%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="75%" stopColor="rgba(255,255,255,0.02)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.08)" />
        </linearGradient>

        {/* Embossed border highlight (top-left lit) */}
        <linearGradient id={id('bevelHi')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eef0f4" />
          <stop offset="50%" stopColor="#c8ccd5" />
          <stop offset="100%" stopColor="#8a8e98" />
        </linearGradient>

        {/* Embossed border shadow (bottom-right) */}
        <linearGradient id={id('bevelLo')} x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#707480" />
          <stop offset="50%" stopColor="#9a9ea8" />
          <stop offset="100%" stopColor="#c0c4ce" />
        </linearGradient>

        {/* Inner emboss line gradient */}
        <linearGradient id={id('embossLine')} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
        </linearGradient>

        {/* Mounting hole gradient */}
        <radialGradient id={id('hole')} cx="35%" cy="35%">
          <stop offset="0%" stopColor="#2a2d36" />
          <stop offset="60%" stopColor="#1a1d24" />
          <stop offset="85%" stopColor="#0d0f14" />
          <stop offset="100%" stopColor="#4a4e58" />
        </radialGradient>

        {/* Mounting hole rim */}
        <radialGradient id={id('holeRim')} cx="40%" cy="40%">
          <stop offset="0%" stopColor="#e0e2e8" />
          <stop offset="100%" stopColor="#888c96" />
        </radialGradient>

        {/* Shadow beneath the sign */}
        <filter id={id('dropShadow')} x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="rgba(0,0,0,0.5)" />
        </filter>

        {/* Subtle emboss filter for text */}
        <filter id={id('textEmboss')} x="-5%" y="-15%" width="110%" height="140%">
          <feOffset dx="0" dy="1" in="SourceAlpha" result="off1" />
          <feGaussianBlur in="off1" stdDeviation="0.5" result="blur1" />
          <feFlood floodColor="rgba(255,255,255,0.4)" result="white" />
          <feComposite in="white" in2="blur1" operator="in" result="highlight" />
          <feOffset dx="0" dy="-0.5" in="SourceAlpha" result="off2" />
          <feGaussianBlur in="off2" stdDeviation="0.5" result="blur2" />
          <feFlood floodColor="rgba(0,0,0,0.3)" result="black" />
          <feComposite in="black" in2="blur2" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="highlight" />
          </feMerge>
        </filter>

        {/* Brushed aluminum texture pattern */}
        <pattern id={id('brushTex')} width="200" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(0)">
          <line x1="0" y1="0" x2="200" y2="0" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <line x1="0" y1="2" x2="200" y2="2" stroke="rgba(0,0,0,0.04)" strokeWidth="0.3" />
        </pattern>

        {/* Clip paths for each shape */}
        {shape === 'square' && (
          <clipPath id={id('signClip')}>
            <rect x={cx - 155} y={cy - 155} width={310} height={310} rx={8} />
          </clipPath>
        )}
        {shape === 'rectangle' && (
          <clipPath id={id('signClip')}>
            <rect x={cx - 200} y={cy - 135} width={400} height={270} rx={8} />
          </clipPath>
        )}
        {shape === 'circle' && (
          <clipPath id={id('signClip')}>
            <circle cx={cx} cy={cy} r={155} />
          </clipPath>
        )}
        {shape === 'can' && (
          <clipPath id={id('signClip')}>
            <path d={canPath(cx, cy)} />
          </clipPath>
        )}
        {shape === 'bottle-cap' && (
          <clipPath id={id('signClip')}>
            <polygon points={bottleCapPoints(cx, cy, 170, 155, 32)} />
          </clipPath>
        )}
        {shape === 'die-cut' && (
          <clipPath id={id('signClip')}>
            <path d={dieCutPath(cx, cy)} />
          </clipPath>
        )}
        {shape === 'shield' && (
          <clipPath id={id('signClip')}>
            <path d={shieldPath(cx, cy)} />
          </clipPath>
        )}
        {shape === 'arrow' && (
          <clipPath id={id('signClip')}>
            <polygon points={arrowPoints(cx, cy)} />
          </clipPath>
        )}
        {shape === 'street-sign' && (
          <clipPath id={id('signClip')}>
            <rect x={cx * 0.1} y={cy * 0.15} width={cx * 1.8} height={cy * 1.7} rx={6} />
          </clipPath>
        )}
        {shape === 'license-plate' && (
          <clipPath id={id('signClip')}>
            <rect x={cx * 0.1} y={cy * 0.15} width={cx * 1.8} height={cy * 1.7} rx={8} />
          </clipPath>
        )}
      </defs>

      {/* ===== Background ===== */}
      <rect width={vbW} height={vbH} fill={ref('bg')} />

      {/* Subtle dot pattern in background */}
      {Array.from({ length: 12 }).map((_, row) =>
        Array.from({ length: 12 }).map((_, col) => (
          <circle
            key={`dot-${row}-${col}`}
            cx={vbW * 0.08 + col * (vbW * 0.84) / 11}
            cy={vbH * 0.08 + row * (vbH * 0.84) / 11}
            r={0.8}
            fill="rgba(255,255,255,0.04)"
          />
        ))
      )}

      {/* ===== Main sign group with drop shadow ===== */}
      <g filter={ref('dropShadow')}>
        {renderSign(shape, cx, cy, ref, id, displayText, subText, label)}
      </g>
    </svg>
  );
}

/* ======================================================================
   SIGN RENDERER — delegates to shape-specific functions
   ====================================================================== */

function renderSign(
  shape: string,
  cx: number,
  cy: number,
  ref: (s: string) => string,
  id: (s: string) => string,
  displayText: string,
  subText: string,
  label?: string,
) {
  switch (shape) {
    case 'rectangle':
      return renderRectangle(cx, cy, ref, id, displayText, subText, label);
    case 'square':
      return renderSquare(cx, cy, ref, id, displayText, subText, label);
    case 'circle':
      return renderCircle(cx, cy, ref, id, displayText, subText, label);
    case 'can':
      return renderCan(cx, cy, ref, id, displayText, subText, label);
    case 'bottle-cap':
      return renderBottleCap(cx, cy, ref, id, displayText, subText, label);
    case 'die-cut':
      return renderDieCut(cx, cy, ref, id, displayText, subText, label);
    case 'shield':
      return renderShield(cx, cy, ref, id, displayText, subText, label);
    case 'arrow':
      return renderArrow(cx, cy, ref, id, displayText, subText, label);
    case 'street-sign':
      return renderRectangle(cx, cy, ref, id, displayText, subText, label);
    case 'license-plate':
      return renderRectangle(cx, cy, ref, id, displayText, subText, label);
    default:
      return renderSquare(cx, cy, ref, id, displayText, subText, label);
  }
}

/* ======================================================================
   MOUNTING HOLE — reusable
   ====================================================================== */

function MountingHole({ x, y, r = 5 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      {/* Hole rim */}
      <circle cx={x} cy={y} r={r + 1.5} fill="#a0a4ae" />
      <circle cx={x} cy={y} r={r + 0.5} fill="#888c96" />
      {/* Hole itself */}
      <circle cx={x} cy={y} r={r} fill="#0a0c10" />
      {/* Slight highlight on rim */}
      <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.4} fill="rgba(255,255,255,0.15)" />
    </g>
  );
}

/* ======================================================================
   ALUMINUM FILL LAYERS — reusable; call after drawing the base shape
   ====================================================================== */

function AluminumOverlay({
  cx, cy, ref, id,
}: { cx: number; cy: number; ref: (s: string) => string; id: (s: string) => string }) {
  return (
    <>
      {/* Sheen overlay clipped to sign shape */}
      <rect x={0} y={0} width={999} height={999} fill={ref('sheen')} clipPath={ref('signClip')} />
      {/* Brushed texture overlay */}
      <rect x={0} y={0} width={999} height={999} fill={ref('brushTex')} clipPath={ref('signClip')} />
    </>
  );
}

/* ======================================================================
   EMBOSSED TEXT BLOCK — reusable centered text with emboss effect
   ====================================================================== */

function EmbossedText({
  cx,
  cy,
  displayText,
  subText,
  id,
  mainSize = 22,
  subSize = 9,
  label,
  labelSize = 8,
  maxWidth,
}: {
  cx: number;
  cy: number;
  displayText: string;
  subText: string;
  id: (s: string) => string;
  mainSize?: number;
  subSize?: number;
  label?: string;
  labelSize?: number;
  maxWidth?: number;
}) {
  // Truncate display text to fit if needed
  const truncated = maxWidth && displayText.length > Math.floor(maxWidth / (mainSize * 0.6))
    ? displayText.substring(0, Math.floor(maxWidth / (mainSize * 0.6))) + '...'
    : displayText;

  return (
    <g filter={`url(#${id('textEmboss')})`}>
      {/* Decorative line above */}
      <line
        x1={cx - 50}
        y1={cy - mainSize * 0.9}
        x2={cx + 50}
        y2={cy - mainSize * 0.9}
        stroke="#8a8e98"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Main text */}
      <text
        x={cx}
        y={cy + mainSize * 0.15}
        textAnchor="middle"
        fill="#5a5e68"
        fontSize={mainSize}
        fontWeight="800"
        fontFamily="'Georgia', 'Times New Roman', serif"
        letterSpacing={mainSize > 16 ? 3 : 2}
      >
        {truncated.toUpperCase()}
      </text>
      {/* Sub text */}
      <text
        x={cx}
        y={cy + mainSize * 0.15 + subSize * 2.2}
        textAnchor="middle"
        fill="#7a7e88"
        fontSize={subSize}
        fontWeight="600"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing={subSize > 7 ? 3 : 2}
      >
        {subText}
      </text>
      {/* Decorative line below */}
      <line
        x1={cx - 40}
        y1={cy + mainSize * 0.15 + subSize * 3.5}
        x2={cx + 40}
        y2={cy + mainSize * 0.15 + subSize * 3.5}
        stroke="#8a8e98"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
      {/* Label at bottom if present */}
      {label && (
        <text
          x={cx}
          y={cy + mainSize * 0.15 + subSize * 5.5}
          textAnchor="middle"
          fill="#9a9eaa"
          fontSize={labelSize}
          fontWeight="500"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing={1.5}
        >
          {label.toUpperCase()}
        </text>
      )}
    </g>
  );
}

/* ======================================================================
   RECTANGLE SIGN
   ====================================================================== */

function renderRectangle(
  cx: number, cy: number,
  ref: (s: string) => string, id: (s: string) => string,
  displayText: string, subText: string, label?: string,
) {
  const w = 400;
  const h = 270;
  const x0 = cx - w / 2;
  const y0 = cy - h / 2;
  const r = 8;

  return (
    <g>
      {/* Outer bevel (highlight) */}
      <rect x={x0 - 2} y={y0 - 2} width={w + 4} height={h + 4} rx={r + 2} fill={ref('bevelHi')} />
      {/* Outer bevel (shadow) */}
      <rect x={x0 - 1} y={y0 - 1} width={w + 2} height={h + 2} rx={r + 1} fill={ref('bevelLo')} />
      {/* Main aluminum body */}
      <rect x={x0} y={y0} width={w} height={h} rx={r} fill={ref('alum')} />
      <AluminumOverlay cx={cx} cy={cy} ref={ref} id={id} />

      {/* Inner embossed border */}
      <rect
        x={x0 + 14} y={y0 + 14} width={w - 28} height={h - 28} rx={4}
        fill="none" stroke={ref('embossLine')} strokeWidth={1.5}
      />
      <rect
        x={x0 + 18} y={y0 + 18} width={w - 36} height={h - 36} rx={3}
        fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={0.8}
      />

      {/* Corner mounting holes */}
      <MountingHole x={x0 + 22} y={y0 + 22} />
      <MountingHole x={x0 + w - 22} y={y0 + 22} />
      <MountingHole x={x0 + 22} y={y0 + h - 22} />
      <MountingHole x={x0 + w - 22} y={y0 + h - 22} />

      {/* Decorative corner accents */}
      <path d={`M${x0 + 35},${y0 + 32} L${x0 + 55},${y0 + 32}`} stroke="#9a9ea8" strokeWidth="1" strokeLinecap="round" />
      <path d={`M${x0 + 32},${y0 + 35} L${x0 + 32},${y0 + 55}`} stroke="#9a9ea8" strokeWidth="1" strokeLinecap="round" />
      <path d={`M${x0 + w - 35},${y0 + 32} L${x0 + w - 55},${y0 + 32}`} stroke="#9a9ea8" strokeWidth="1" strokeLinecap="round" />
      <path d={`M${x0 + w - 32},${y0 + 35} L${x0 + w - 32},${y0 + 55}`} stroke="#9a9ea8" strokeWidth="1" strokeLinecap="round" />

      {/* Text content */}
      <EmbossedText
        cx={cx} cy={cy - 8}
        displayText={displayText} subText={subText}
        id={id} mainSize={24} subSize={9} label={label}
        maxWidth={w - 80}
      />

      {/* Small diamond decorations flanking text */}
      <polygon points={`${cx - 80},${cy - 28} ${cx - 75},${cy - 23} ${cx - 80},${cy - 18} ${cx - 85},${cy - 23}`} fill="#9a9ea8" />
      <polygon points={`${cx + 80},${cy - 28} ${cx + 85},${cy - 23} ${cx + 80},${cy - 18} ${cx + 75},${cy - 23}`} fill="#9a9ea8" />
    </g>
  );
}

/* ======================================================================
   SQUARE SIGN
   ====================================================================== */

function renderSquare(
  cx: number, cy: number,
  ref: (s: string) => string, id: (s: string) => string,
  displayText: string, subText: string, label?: string,
) {
  const s = 310;
  const x0 = cx - s / 2;
  const y0 = cy - s / 2;
  const r = 8;

  return (
    <g>
      <rect x={x0 - 2} y={y0 - 2} width={s + 4} height={s + 4} rx={r + 2} fill={ref('bevelHi')} />
      <rect x={x0 - 1} y={y0 - 1} width={s + 2} height={s + 2} rx={r + 1} fill={ref('bevelLo')} />
      <rect x={x0} y={y0} width={s} height={s} rx={r} fill={ref('alum')} />
      <AluminumOverlay cx={cx} cy={cy} ref={ref} id={id} />

      {/* Inner embossed border */}
      <rect x={x0 + 14} y={y0 + 14} width={s - 28} height={s - 28} rx={4} fill="none" stroke={ref('embossLine')} strokeWidth={1.5} />
      <rect x={x0 + 18} y={y0 + 18} width={s - 36} height={s - 36} rx={3} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={0.8} />

      {/* Second inner border for more emboss detail */}
      <rect x={x0 + 26} y={y0 + 26} width={s - 52} height={s - 52} rx={2} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={0.5} />

      {/* Corner mounting holes */}
      <MountingHole x={x0 + 22} y={y0 + 22} />
      <MountingHole x={x0 + s - 22} y={y0 + 22} />
      <MountingHole x={x0 + 22} y={y0 + s - 22} />
      <MountingHole x={x0 + s - 22} y={y0 + s - 22} />

      {/* Text */}
      <EmbossedText
        cx={cx} cy={cy - 10}
        displayText={displayText} subText={subText}
        id={id} mainSize={22} subSize={9} label={label}
        maxWidth={s - 80}
      />

      {/* Decorative diamonds */}
      <polygon points={`${cx - 75},${cy - 30} ${cx - 70},${cy - 25} ${cx - 75},${cy - 20} ${cx - 80},${cy - 25}`} fill="#9a9ea8" />
      <polygon points={`${cx + 75},${cy - 30} ${cx + 80},${cy - 25} ${cx + 75},${cy - 20} ${cx + 70},${cy - 25}`} fill="#9a9ea8" />
    </g>
  );
}

/* ======================================================================
   CIRCLE SIGN
   ====================================================================== */

function renderCircle(
  cx: number, cy: number,
  ref: (s: string) => string, id: (s: string) => string,
  displayText: string, subText: string, label?: string,
) {
  const R = 155;

  return (
    <g>
      {/* Outer bevel */}
      <circle cx={cx} cy={cy} r={R + 3} fill={ref('bevelHi')} />
      <circle cx={cx} cy={cy} r={R + 1.5} fill={ref('bevelLo')} />
      {/* Main body */}
      <circle cx={cx} cy={cy} r={R} fill={ref('alum')} />
      <AluminumOverlay cx={cx} cy={cy} ref={ref} id={id} />

      {/* Concentric embossed rings */}
      <circle cx={cx} cy={cy} r={R - 12} fill="none" stroke={ref('embossLine')} strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={R - 16} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={0.8} />
      <circle cx={cx} cy={cy} r={R - 28} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={0.5} />
      <circle cx={cx} cy={cy} r={R - 30} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={0.5} />

      {/* Mounting holes at compass points */}
      <MountingHole x={cx} y={cy - R + 20} r={4} />
      <MountingHole x={cx} y={cy + R - 20} r={4} />
      <MountingHole x={cx - R + 20} y={cy} r={4} />
      <MountingHole x={cx + R - 20} y={cy} r={4} />

      {/* Text */}
      <EmbossedText
        cx={cx} cy={cy - 6}
        displayText={displayText} subText={subText}
        id={id} mainSize={20} subSize={8} label={label}
        maxWidth={R * 2 - 100}
      />

      {/* Small decorative dots around inner ring */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i * 15 * Math.PI) / 180;
        const dotR = R - 22;
        return (
          <circle
            key={i}
            cx={cx + Math.cos(angle) * dotR}
            cy={cy + Math.sin(angle) * dotR}
            r={1.2}
            fill="#9a9ea8"
          />
        );
      })}
    </g>
  );
}

/* ======================================================================
   CAN SHAPE SIGN
   ====================================================================== */

function canPath(cx: number, cy: number): string {
  // Tall narrow can shape with curved dome top and slight taper
  const w = 100;
  const h = 200;
  const topR = 25;
  const botR = 8;
  const domeH = 18;

  const left = cx - w;
  const right = cx + w;
  const top = cy - h;
  const bot = cy + h;

  return [
    `M ${left + topR},${top + domeH}`,
    // Dome curve across top
    `Q ${left + topR},${top} ${cx},${top}`,
    `Q ${right - topR},${top} ${right - topR},${top + domeH}`,
    // Right side
    `L ${right},${top + domeH + 20}`,
    `L ${right},${bot - botR}`,
    // Bottom right curve
    `Q ${right},${bot} ${right - botR},${bot}`,
    // Bottom
    `L ${left + botR},${bot}`,
    // Bottom left curve
    `Q ${left},${bot} ${left},${bot - botR}`,
    // Left side
    `L ${left},${top + domeH + 20}`,
    `Z`,
  ].join(' ');
}

function renderCan(
  cx: number, cy: number,
  ref: (s: string) => string, id: (s: string) => string,
  displayText: string, subText: string, label?: string,
) {
  const path = canPath(cx, cy);

  return (
    <g>
      {/* Outer bevel via slightly larger shape */}
      <g transform={`translate(${cx},${cy}) scale(1.015) translate(${-cx},${-cy})`}>
        <path d={path} fill={ref('bevelHi')} />
      </g>
      <g transform={`translate(${cx},${cy}) scale(1.008) translate(${-cx},${-cy})`}>
        <path d={path} fill={ref('bevelLo')} />
      </g>

      {/* Main body */}
      <path d={path} fill={ref('alum')} />
      <AluminumOverlay cx={cx} cy={cy} ref={ref} id={id} />

      {/* Tab/pull ring at top */}
      <ellipse cx={cx} cy={cy - 175} rx={20} ry={6} fill="none" stroke="#9a9ea8" strokeWidth={1.5} />
      <circle cx={cx} cy={cy - 175} r={3} fill="#a8acb6" />

      {/* Ridges near top and bottom */}
      <line x1={cx - 85} y1={cy - 155} x2={cx + 85} y2={cy - 155} stroke="rgba(255,255,255,0.2)" strokeWidth={0.8} />
      <line x1={cx - 85} y1={cy - 153} x2={cx + 85} y2={cy - 153} stroke="rgba(0,0,0,0.1)" strokeWidth={0.5} />
      <line x1={cx - 95} y1={cy + 175} x2={cx + 95} y2={cy + 175} stroke="rgba(255,255,255,0.2)" strokeWidth={0.8} />
      <line x1={cx - 95} y1={cy + 177} x2={cx + 95} y2={cy + 177} stroke="rgba(0,0,0,0.1)" strokeWidth={0.5} />

      {/* Label area inner border */}
      <rect
        x={cx - 75} y={cy - 100} width={150} height={200} rx={4}
        fill="none" stroke={ref('embossLine')} strokeWidth={1}
      />

      {/* Mounting holes */}
      <MountingHole x={cx} y={cy - 185} r={4} />
      <MountingHole x={cx} y={cy + 190} r={4} />

      {/* Text */}
      <EmbossedText
        cx={cx} cy={cy - 15}
        displayText={displayText} subText={subText}
        id={id} mainSize={16} subSize={7} label={label} labelSize={7}
        maxWidth={130}
      />
    </g>
  );
}

/* ======================================================================
   BOTTLE CAP SIGN
   ====================================================================== */

function bottleCapPoints(
  cx: number, cy: number,
  outerR: number, innerR: number, teeth: number,
): string {
  const pts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const outerAngle = (i * 2 * Math.PI) / teeth - Math.PI / 2;
    const innerAngle = ((i + 0.5) * 2 * Math.PI) / teeth - Math.PI / 2;
    pts.push(`${cx + Math.cos(outerAngle) * outerR},${cy + Math.sin(outerAngle) * outerR}`);
    pts.push(`${cx + Math.cos(innerAngle) * innerR},${cy + Math.sin(innerAngle) * innerR}`);
  }
  return pts.join(' ');
}

function renderBottleCap(
  cx: number, cy: number,
  ref: (s: string) => string, id: (s: string) => string,
  displayText: string, subText: string, label?: string,
) {
  const outerR = 170;
  const innerR = 155;
  const teeth = 32;

  return (
    <g>
      {/* Bevel effect via scaled copies */}
      <polygon
        points={bottleCapPoints(cx, cy, outerR + 3, innerR + 3, teeth)}
        fill={ref('bevelHi')} strokeLinejoin="round"
      />
      <polygon
        points={bottleCapPoints(cx, cy, outerR + 1.5, innerR + 1.5, teeth)}
        fill={ref('bevelLo')} strokeLinejoin="round"
      />

      {/* Main body */}
      <polygon
        points={bottleCapPoints(cx, cy, outerR, innerR, teeth)}
        fill={ref('alum')} strokeLinejoin="round"
      />
      <AluminumOverlay cx={cx} cy={cy} ref={ref} id={id} />

      {/* Inner circles */}
      <circle cx={cx} cy={cy} r={130} fill="none" stroke={ref('embossLine')} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={126} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth={0.8} />
      <circle cx={cx} cy={cy} r={110} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
      <circle cx={cx} cy={cy} r={108} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={0.5} />

      {/* Radial lines between inner rings for decoration */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * 22.5 * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={cx + Math.cos(angle) * 110}
            y1={cy + Math.sin(angle) * 110}
            x2={cx + Math.cos(angle) * 126}
            y2={cy + Math.sin(angle) * 126}
            stroke="rgba(150,154,164,0.3)"
            strokeWidth={0.8}
          />
        );
      })}

      {/* Center mounting hole */}
      <MountingHole x={cx} y={cy + 65} r={4} />

      {/* Text */}
      <EmbossedText
        cx={cx} cy={cy - 12}
        displayText={displayText} subText={subText}
        id={id} mainSize={20} subSize={8} label={label}
        maxWidth={180}
      />
    </g>
  );
}

/* ======================================================================
   DIE-CUT SIGN — irregular / state-outline-like shape
   ====================================================================== */

function dieCutPath(cx: number, cy: number): string {
  // An irregular organic shape suggesting custom die-cut capability
  return [
    `M ${cx - 40},${cy - 160}`,
    `C ${cx - 140},${cy - 155} ${cx - 165},${cy - 100} ${cx - 155},${cy - 50}`,
    `C ${cx - 148},${cy - 10} ${cx - 170},${cy + 20} ${cx - 150},${cy + 70}`,
    `C ${cx - 130},${cy + 120} ${cx - 100},${cy + 155} ${cx - 40},${cy + 160}`,
    `C ${cx},${cy + 165} ${cx + 50},${cy + 150} ${cx + 90},${cy + 140}`,
    `C ${cx + 140},${cy + 125} ${cx + 165},${cy + 80} ${cx + 160},${cy + 30}`,
    `C ${cx + 155},${cy - 20} ${cx + 170},${cy - 70} ${cx + 150},${cy - 120}`,
    `C ${cx + 130},${cy - 160} ${cx + 60},${cy - 165} ${cx - 40},${cy - 160}`,
    `Z`,
  ].join(' ');
}

function renderDieCut(
  cx: number, cy: number,
  ref: (s: string) => string, id: (s: string) => string,
  displayText: string, subText: string, label?: string,
) {
  const path = dieCutPath(cx, cy);

  return (
    <g>
      {/* Bevel */}
      <g transform={`translate(${cx},${cy}) scale(1.02) translate(${-cx},${-cy})`}>
        <path d={path} fill={ref('bevelHi')} />
      </g>
      <g transform={`translate(${cx},${cy}) scale(1.01) translate(${-cx},${-cy})`}>
        <path d={path} fill={ref('bevelLo')} />
      </g>

      {/* Main body */}
      <path d={path} fill={ref('alum')} />
      <AluminumOverlay cx={cx} cy={cy} ref={ref} id={id} />

      {/* Dashed outline to suggest cut line */}
      <g transform={`translate(${cx},${cy}) scale(0.88) translate(${-cx},${-cy})`}>
        <path
          d={path} fill="none"
          stroke={ref('embossLine')} strokeWidth={1.5}
          strokeDasharray="8 4"
        />
      </g>

      {/* Scissors icon at top to suggest die-cutting */}
      <g transform={`translate(${cx + 60},${cy - 130})`}>
        <circle cx={-4} cy={4} r={5} fill="none" stroke="#8a8e98" strokeWidth={1.2} />
        <circle cx={4} cy={4} r={5} fill="none" stroke="#8a8e98" strokeWidth={1.2} />
        <line x1={-2} y1={0} x2={3} y2={-10} stroke="#8a8e98" strokeWidth={1.2} strokeLinecap="round" />
        <line x1={2} y1={0} x2={-3} y2={-10} stroke="#8a8e98" strokeWidth={1.2} strokeLinecap="round" />
      </g>

      {/* Mounting holes */}
      <MountingHole x={cx - 15} y={cy - 130} r={4} />
      <MountingHole x={cx + 5} y={cy + 130} r={4} />

      {/* Text */}
      <EmbossedText
        cx={cx} cy={cy - 8}
        displayText={displayText === 'YOUR BRAND' ? 'CUSTOM SHAPE' : displayText}
        subText={subText === 'YOUR DESIGN HERE' ? 'ANY SHAPE YOU NEED' : subText}
        id={id} mainSize={18} subSize={8} label={label}
        maxWidth={200}
      />
    </g>
  );
}

/* ======================================================================
   SHIELD SIGN
   ====================================================================== */

function shieldPath(cx: number, cy: number): string {
  const w = 140;
  const topH = 30;
  const bodyH = 140;
  const pointH = 60;

  return [
    `M ${cx},${cy - topH - bodyH}`,
    // Top edge with slight crest
    `C ${cx + w * 0.3},${cy - topH - bodyH - 8} ${cx + w * 0.7},${cy - topH - bodyH + 5} ${cx + w},${cy - bodyH}`,
    // Right side curves inward
    `L ${cx + w},${cy + bodyH * 0.3}`,
    `C ${cx + w},${cy + bodyH * 0.6} ${cx + w * 0.6},${cy + bodyH * 0.85} ${cx},${cy + bodyH + pointH}`,
    // Bottom point to left side
    `C ${cx - w * 0.6},${cy + bodyH * 0.85} ${cx - w},${cy + bodyH * 0.6} ${cx - w},${cy + bodyH * 0.3}`,
    `L ${cx - w},${cy - bodyH}`,
    `C ${cx - w * 0.7},${cy - topH - bodyH + 5} ${cx - w * 0.3},${cy - topH - bodyH - 8} ${cx},${cy - topH - bodyH}`,
    `Z`,
  ].join(' ');
}

function renderShield(
  cx: number, cy: number,
  ref: (s: string) => string, id: (s: string) => string,
  displayText: string, subText: string, label?: string,
) {
  const path = shieldPath(cx, cy);

  return (
    <g>
      {/* Bevel */}
      <g transform={`translate(${cx},${cy}) scale(1.02) translate(${-cx},${-cy})`}>
        <path d={path} fill={ref('bevelHi')} />
      </g>
      <g transform={`translate(${cx},${cy}) scale(1.01) translate(${-cx},${-cy})`}>
        <path d={path} fill={ref('bevelLo')} />
      </g>

      {/* Main body */}
      <path d={path} fill={ref('alum')} />
      <AluminumOverlay cx={cx} cy={cy} ref={ref} id={id} />

      {/* Inner embossed border */}
      <g transform={`translate(${cx},${cy}) scale(0.88) translate(${-cx},${-cy})`}>
        <path d={path} fill="none" stroke={ref('embossLine')} strokeWidth={1.5} />
      </g>
      <g transform={`translate(${cx},${cy}) scale(0.85) translate(${-cx},${-cy})`}>
        <path d={path} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={0.5} />
      </g>

      {/* Heraldic cross / accent at top */}
      <line x1={cx} y1={cy - 135} x2={cx} y2={cy - 105} stroke="#8a8e98" strokeWidth={1.5} strokeLinecap="round" />
      <line x1={cx - 15} y1={cy - 120} x2={cx + 15} y2={cy - 120} stroke="#8a8e98" strokeWidth={1.5} strokeLinecap="round" />

      {/* Star accent above text */}
      <polygon
        points={starPoints(cx, cy - 85, 8, 4, 5)}
        fill="#9a9ea8"
      />

      {/* Mounting holes */}
      <MountingHole x={cx} y={cy - 155} r={4} />
      <MountingHole x={cx} y={cy + 165} r={4} />

      {/* Text */}
      <EmbossedText
        cx={cx} cy={cy - 10}
        displayText={displayText} subText={subText}
        id={id} mainSize={18} subSize={8} label={label}
        maxWidth={180}
      />

      {/* Small stars below text */}
      <g>
        {[-20, 0, 20].map((offset) => (
          <polygon
            key={offset}
            points={starPoints(cx + offset, cy + 55, 4, 2, 5)}
            fill="#9a9ea8"
          />
        ))}
      </g>
    </g>
  );
}

/* ======================================================================
   ARROW SIGN
   ====================================================================== */

function arrowPoints(cx: number, cy: number): string {
  const bodyW = 160;
  const bodyH = 90;
  const pointW = 70;

  return [
    `${cx - bodyW - 10},${cy - bodyH * 0.55}`,   // top-left (slight angle)
    `${cx + bodyW},${cy - bodyH * 0.55}`,          // top-right before point
    `${cx + bodyW + pointW},${cy}`,                 // arrow tip
    `${cx + bodyW},${cy + bodyH * 0.55}`,          // bottom-right before point
    `${cx - bodyW - 10},${cy + bodyH * 0.55}`,     // bottom-left
    `${cx - bodyW - 30},${cy}`,                     // left notch
  ].join(' ');
}

function renderArrow(
  cx: number, cy: number,
  ref: (s: string) => string, id: (s: string) => string,
  displayText: string, subText: string, label?: string,
) {
  const points = arrowPoints(cx, cy);

  return (
    <g>
      {/* Bevel */}
      <g transform={`translate(${cx},${cy}) scale(1.02) translate(${-cx},${-cy})`}>
        <polygon points={points} fill={ref('bevelHi')} strokeLinejoin="round" />
      </g>
      <g transform={`translate(${cx},${cy}) scale(1.01) translate(${-cx},${-cy})`}>
        <polygon points={points} fill={ref('bevelLo')} strokeLinejoin="round" />
      </g>

      {/* Main body */}
      <polygon points={points} fill={ref('alum')} strokeLinejoin="round" />
      <AluminumOverlay cx={cx} cy={cy} ref={ref} id={id} />

      {/* Inner border */}
      <g transform={`translate(${cx},${cy}) scale(0.9) translate(${-cx},${-cy})`}>
        <polygon points={points} fill="none" stroke={ref('embossLine')} strokeWidth={1.5} strokeLinejoin="round" />
      </g>

      {/* Directional accent lines inside arrow head */}
      {[0, 1, 2].map((i) => (
        <line
          key={i}
          x1={cx + 130 + i * 15}
          y1={cy - 20 + i * 8}
          x2={cx + 130 + i * 15}
          y2={cy + 20 - i * 8}
          stroke="rgba(150,154,164,0.25)"
          strokeWidth={1}
          strokeLinecap="round"
        />
      ))}

      {/* Mounting holes */}
      <MountingHole x={cx - 130} y={cy} r={4} />
      <MountingHole x={cx + 100} y={cy} r={4} />

      {/* Text — shifted slightly left to account for arrow point */}
      <EmbossedText
        cx={cx - 10} cy={cy - 4}
        displayText={displayText} subText={subText}
        id={id} mainSize={18} subSize={7.5} label={label}
        maxWidth={240}
      />
    </g>
  );
}

/* ======================================================================
   UTILITY: Small star points generator
   ====================================================================== */

function starPoints(
  cx: number, cy: number,
  outerR: number, innerR: number, count: number,
): string {
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const oAngle = (i * 2 * Math.PI) / count - Math.PI / 2;
    const iAngle = ((i + 0.5) * 2 * Math.PI) / count - Math.PI / 2;
    pts.push(`${cx + Math.cos(oAngle) * outerR},${cy + Math.sin(oAngle) * outerR}`);
    pts.push(`${cx + Math.cos(iAngle) * innerR},${cy + Math.sin(iAngle) * innerR}`);
  }
  return pts.join(' ');
}
