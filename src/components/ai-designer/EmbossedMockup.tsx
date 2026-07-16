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

            {/*
              Emboss highlight overlay — generates ONLY the raised-edge
              highlights and shadows from the artwork luminance, rendered
              as a transparent overlay so original colors stay untouched.
            */}
            <filter id="embossOverlay" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
              <feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="luma" />
              <feGaussianBlur in="luma" stdDeviation="1.2" result="bump" />

              {/* Specular highlights on raised edges */}
              <feSpecularLighting in="bump" surfaceScale="10" specularConstant="1.8" specularExponent="25" result="spec" lightingColor="#ffffff">
                <feDistantLight azimuth="225" elevation="40" />
              </feSpecularLighting>
              <feComposite in="spec" in2="SourceAlpha" operator="in" />
            </filter>

            {/*
              Shadow overlay — dark edges on the bottom-right of raised areas
            */}
            <filter id="embossShadow" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
              <feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="luma" />
              <feGaussianBlur in="luma" stdDeviation="1.5" result="bump" />

              <feDiffuseLighting in="bump" surfaceScale="5" diffuseConstant="0.8" result="diff" lightingColor="#000000">
                <feDistantLight azimuth="45" elevation="30" />
              </feDiffuseLighting>
              <feColorMatrix in="diff" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1 1 1 0 0" result="shadowMask" />
              <feComponentTransfer in="shadowMask" result="fadedShadow">
                <feFuncA type="linear" slope="0.15" />
              </feComponentTransfer>
              <feComposite in="fadedShadow" in2="SourceAlpha" operator="in" />
            </filter>

            {/* Sign drop shadow */}
            <filter id="signShadow">
              <feDropShadow dx="4" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.5" />
            </filter>

            <filter id="holeShadow">
              <feDropShadow dx="0.5" dy="1" stdDeviation="0.5" floodColor="#000" floodOpacity="0.6" />
            </filter>

            {/* White aluminum base */}
            <radialGradient id="alumBg" cx="40%" cy="35%">
              <stop offset="0%" stopColor="#f5f5f7" />
              <stop offset="50%" stopColor="#ececf0" />
              <stop offset="100%" stopColor="#dddde2" />
            </radialGradient>

            {/* Subtle surface reflection */}
            <radialGradient id="surfaceSheen" cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.03" />
            </radialGradient>

            <linearGradient id="bevelTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="bevelBot" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          <g filter="url(#signShadow)">
            {/* White aluminum base */}
            <path d={shapePath} fill="url(#alumBg)" />

            {/* Full-color artwork — NO filter, colors untouched */}
            <g clipPath="url(#tc)">
              <image
                href={imageUrl}
                x="0" y="0"
                width={svgW} height={svgH}
                preserveAspectRatio="xMidYMid slice"
              />
            </g>

            {/* Emboss highlights — white edges on raised areas, blended on top */}
            <g clipPath="url(#tc)" style={{ mixBlendMode: 'screen' }} opacity="0.7">
              <g filter="url(#embossOverlay)">
                <image
                  href={imageUrl}
                  x="0" y="0"
                  width={svgW} height={svgH}
                  preserveAspectRatio="xMidYMid slice"
                />
              </g>
            </g>

            {/* Emboss shadows — dark edges on bottom-right of raised areas */}
            <g clipPath="url(#tc)" style={{ mixBlendMode: 'multiply' }} opacity="0.5">
              <g filter="url(#embossShadow)">
                <image
                  href={imageUrl}
                  x="0" y="0"
                  width={svgW} height={svgH}
                  preserveAspectRatio="xMidYMid slice"
                />
              </g>
            </g>

            {/* Surface sheen */}
            <path d={shapePath} fill="url(#surfaceSheen)" />

            {/* Edge bevels */}
            <path d={shapePath} fill="none" stroke="url(#bevelTop)" strokeWidth="2.5" />
            <path d={shapePath} fill="none" stroke="url(#bevelBot)" strokeWidth="2" transform="translate(1,1)" />
            <path d={shapePath} fill="none" stroke="rgba(60,60,70,0.35)" strokeWidth="0.8" />

            {/* Mounting holes */}
            {holePositions.map((pos, i) => (
              <g key={i} filter="url(#holeShadow)">
                <circle cx={pos.x} cy={pos.y} r={holeR * 1.3} fill="rgba(0,0,0,0.3)" />
                <circle cx={pos.x} cy={pos.y} r={holeR} fill="#aaa" />
                <circle cx={pos.x} cy={pos.y} r={holeR * 0.55} fill="#777" />
                <circle cx={pos.x - holeR * 0.2} cy={pos.y - holeR * 0.2} r={holeR * 0.2} fill="rgba(255,255,255,0.5)" />
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
