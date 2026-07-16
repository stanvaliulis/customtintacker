'use client';

import { useMemo } from 'react';
import { getShapeDefinition } from '@/lib/design/shapes';
import type { ProductShape } from '@/types/product';

interface EmbossedMockupProps {
  imageUrl: string;
  shape: ProductShape;
  width: number;
  height: number;
  productName: string;
}

export default function EmbossedMockup({
  imageUrl,
  shape,
  width,
  height,
  productName,
}: EmbossedMockupProps) {
  const size = 500;
  const aspect = width / height;
  const svgW = aspect >= 1 ? size : size * aspect;
  const svgH = aspect >= 1 ? size / aspect : size;
  const pad = 30;
  const cx = svgW / 2;
  const cy = svgH / 2;
  const holeR = Math.min(svgW, svgH) * 0.012;
  const holeInset = Math.min(svgW, svgH) * 0.06;

  const shapePath = useMemo(() => {
    try {
      const def = getShapeDefinition(shape);
      return def.getPath(svgW, svgH);
    } catch {
      const r = Math.min(svgW, svgH) * 0.02;
      return `M ${r},0 L ${svgW - r},0 Q ${svgW},0 ${svgW},${r} L ${svgW},${svgH - r} Q ${svgW},${svgH} ${svgW - r},${svgH} L ${r},${svgH} Q 0,${svgH} 0,${svgH - r} L 0,${r} Q 0,0 ${r},0 Z`;
    }
  }, [shape, svgW, svgH]);

  const isCircular = shape === 'circle' || shape === 'bottle-cap';
  const holePositions = useMemo(() => {
    if (isCircular) {
      return [
        { x: cx, y: holeInset },
        { x: cx, y: svgH - holeInset },
        { x: holeInset, y: cy },
        { x: svgW - holeInset, y: cy },
      ];
    }
    return [
      { x: holeInset, y: holeInset },
      { x: svgW - holeInset, y: holeInset },
      { x: holeInset, y: svgH - holeInset },
      { x: svgW - holeInset, y: svgH - holeInset },
    ];
  }, [isCircular, cx, cy, svgW, svgH, holeInset]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative inline-block rounded-2xl overflow-hidden bg-[#1a1a1a] p-4">
        <svg
          viewBox={`${-pad} ${-pad} ${svgW + pad * 2} ${svgH + pad * 2}`}
          width="100%"
          style={{ maxWidth: svgW + pad * 2 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <clipPath id="tc">
              <path d={shapePath} />
            </clipPath>

            {/* Emboss — raises the image edges with directional light */}
            <filter id="emboss" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
              {/* Bevel highlight from top-left */}
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="a1" />
              <feOffset in="a1" dx="-2" dy="-2" result="offH" />
              <feComposite in="offH" in2="a1" operator="out" result="highlightEdge" />
              <feFlood floodColor="#ffffff" floodOpacity="0.5" result="wh" />
              <feComposite in="wh" in2="highlightEdge" operator="in" result="highlight" />

              {/* Shadow from bottom-right */}
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="a2" />
              <feOffset in="a2" dx="2" dy="2" result="offS" />
              <feComposite in="offS" in2="a2" operator="out" result="shadowEdge" />
              <feFlood floodColor="#000000" floodOpacity="0.5" result="bk" />
              <feComposite in="bk" in2="shadowEdge" operator="in" result="shadow" />

              {/* Merge: source + highlight + shadow */}
              <feMerge>
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="highlight" />
                <feMergeNode in="shadow" />
              </feMerge>
            </filter>

            {/* Specular lighting for metallic sheen */}
            <filter id="metalSheen" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
              <feSpecularLighting in="blur" surfaceScale="6" specularConstant="1.2" specularExponent="30" result="spec">
                <feDistantLight azimuth="225" elevation="45" />
              </feSpecularLighting>
              <feComposite in="spec" in2="SourceAlpha" operator="in" result="specClip" />
              <feComposite in="SourceGraphic" in2="specClip" operator="arithmetic" k1="0" k2="1" k3="0.5" k4="0" />
            </filter>

            {/* Sign edge shadow */}
            <filter id="signShadow">
              <feDropShadow dx="4" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.5" />
            </filter>

            {/* Mounting hole shadow */}
            <filter id="holeShadow">
              <feDropShadow dx="0.5" dy="1" stdDeviation="0.5" floodColor="#000" floodOpacity="0.6" />
            </filter>

            {/* Aluminum base gradient */}
            <radialGradient id="alumBg" cx="40%" cy="35%">
              <stop offset="0%" stopColor="#e8e8ec" />
              <stop offset="50%" stopColor="#d0d0d6" />
              <stop offset="100%" stopColor="#b0b0b8" />
            </radialGradient>

            {/* Edge bevel gradient */}
            <linearGradient id="bevelTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="bevelBot" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Sign body with drop shadow */}
          <g filter="url(#signShadow)">
            {/* Aluminum base */}
            <path d={shapePath} fill="url(#alumBg)" />

            {/* Artwork clipped to shape — with emboss filter */}
            <g clipPath="url(#tc)" filter="url(#emboss)">
              <image
                href={imageUrl}
                x="0" y="0"
                width={svgW} height={svgH}
                preserveAspectRatio="xMidYMid slice"
              />
            </g>

            {/* Metallic specular pass over artwork */}
            <g clipPath="url(#tc)" filter="url(#metalSheen)" opacity="0.3">
              <image
                href={imageUrl}
                x="0" y="0"
                width={svgW} height={svgH}
                preserveAspectRatio="xMidYMid slice"
              />
            </g>

            {/* Top edge highlight */}
            <path d={shapePath} fill="none" stroke="url(#bevelTop)" strokeWidth="3" />
            {/* Bottom edge shadow */}
            <path d={shapePath} fill="none" stroke="url(#bevelBot)" strokeWidth="2" transform="translate(1,1)" />
            {/* Outer edge */}
            <path d={shapePath} fill="none" stroke="rgba(80,80,90,0.5)" strokeWidth="1" />

            {/* Mounting holes */}
            {holePositions.map((pos, i) => (
              <g key={i} filter="url(#holeShadow)">
                <circle cx={pos.x} cy={pos.y} r={holeR + 1} fill="rgba(0,0,0,0.4)" />
                <circle cx={pos.x} cy={pos.y} r={holeR} fill="#888" />
                <circle cx={pos.x} cy={pos.y} r={holeR * 0.5} fill="#555" />
                <circle cx={pos.x - holeR * 0.2} cy={pos.y - holeR * 0.2} r={holeR * 0.25} fill="rgba(255,255,255,0.4)" />
              </g>
            ))}
          </g>
        </svg>
      </div>
      <p className="mt-4 text-sm text-gray-400 text-center">
        Embossed aluminum mockup — {productName}
      </p>
    </div>
  );
}
