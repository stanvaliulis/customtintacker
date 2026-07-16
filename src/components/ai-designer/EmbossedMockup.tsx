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
              Core emboss effect: uses the image luminance as a bump map.
              Bright areas (text, logos) appear raised; dark areas stay flat.
              The feSpecularLighting creates highlights where edges are,
              simulating light hitting raised metal surfaces.
            */}
            <filter id="embossStamp" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
              {/* Create bump map from image luminance */}
              <feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="luma" />
              <feGaussianBlur in="luma" stdDeviation="1.5" result="bumpMap" />

              {/* Specular highlight — light from upper-left hitting raised surfaces */}
              <feSpecularLighting in="bumpMap" surfaceScale="8" specularConstant="1.5" specularExponent="20" result="specHi" lightingColor="#ffffff">
                <feDistantLight azimuth="225" elevation="35" />
              </feSpecularLighting>
              <feComposite in="specHi" in2="SourceAlpha" operator="in" result="specClipped" />

              {/* Second diffuse light for depth */}
              <feDiffuseLighting in="bumpMap" surfaceScale="6" diffuseConstant="1.0" result="diffuse" lightingColor="#e0ddd5">
                <feDistantLight azimuth="225" elevation="50" />
              </feDiffuseLighting>
              <feComposite in="diffuse" in2="SourceAlpha" operator="in" result="diffClipped" />

              {/* Combine: original artwork + diffuse shading + specular highlights */}
              <feComposite in="SourceGraphic" in2="diffClipped" operator="arithmetic" k1="0.15" k2="0.85" k3="0.25" k4="0" result="lit" />
              <feComposite in="lit" in2="specClipped" operator="arithmetic" k1="0" k2="1" k3="0.6" k4="0" />
            </filter>

            {/* Edge emboss for the sign border — stamped edge look */}
            <filter id="edgeEmboss">
              <feConvolveMatrix
                order="3"
                kernelMatrix="-2 -1 0 -1 1 1 0 1 2"
                preserveAlpha="true"
              />
            </filter>

            {/* Sign drop shadow */}
            <filter id="signShadow">
              <feDropShadow dx="4" dy="4" stdDeviation="8" floodColor="#000" floodOpacity="0.5" />
            </filter>

            {/* Hole shadow */}
            <filter id="holeShadow">
              <feDropShadow dx="0.5" dy="1" stdDeviation="0.5" floodColor="#000" floodOpacity="0.6" />
            </filter>

            {/* Aluminum base */}
            <radialGradient id="alumBg" cx="40%" cy="35%">
              <stop offset="0%" stopColor="#e8e8ec" />
              <stop offset="50%" stopColor="#d0d0d6" />
              <stop offset="100%" stopColor="#b0b0b8" />
            </radialGradient>

            {/* Top-left light reflection on the sign surface */}
            <radialGradient id="surfaceSheen" cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.05" />
            </radialGradient>

            {/* Edge bevels */}
            <linearGradient id="bevelTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="bevelBot" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          <g filter="url(#signShadow)">
            {/* Aluminum base underneath */}
            <path d={shapePath} fill="url(#alumBg)" />

            {/* Artwork with emboss stamp effect */}
            <g clipPath="url(#tc)" filter="url(#embossStamp)">
              <image
                href={imageUrl}
                x="0" y="0"
                width={svgW} height={svgH}
                preserveAspectRatio="xMidYMid slice"
              />
            </g>

            {/* Surface sheen overlay */}
            <path d={shapePath} fill="url(#surfaceSheen)" />

            {/* Edge highlight (top-left light) */}
            <path d={shapePath} fill="none" stroke="url(#bevelTop)" strokeWidth="2.5" />
            {/* Edge shadow (bottom-right) */}
            <path d={shapePath} fill="none" stroke="url(#bevelBot)" strokeWidth="2" transform="translate(1,1)" />
            {/* Fine outer edge */}
            <path d={shapePath} fill="none" stroke="rgba(60,60,70,0.4)" strokeWidth="0.8" />

            {/* Mounting holes */}
            {holePositions.map((pos, i) => (
              <g key={i} filter="url(#holeShadow)">
                <circle cx={pos.x} cy={pos.y} r={holeR * 1.3} fill="rgba(0,0,0,0.35)" />
                <circle cx={pos.x} cy={pos.y} r={holeR} fill="#999" />
                <circle cx={pos.x} cy={pos.y} r={holeR * 0.55} fill="#666" />
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
