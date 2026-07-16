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

  const shapePath = useMemo(() => {
    try {
      const def = getShapeDefinition(shape);
      return def.getPath(svgW, svgH);
    } catch {
      const r = Math.min(svgW, svgH) * 0.02;
      return `M ${r},0 L ${svgW - r},0 Q ${svgW},0 ${svgW},${r} L ${svgW},${svgH - r} Q ${svgW},${svgH} ${svgW - r},${svgH} L ${r},${svgH} Q 0,${svgH} 0,${svgH - r} L 0,${r} Q 0,0 ${r},0 Z`;
    }
  }, [shape, svgW, svgH]);

  const clipId = 'tacker-clip';
  const filterId = 'emboss-filter';
  const sheenId = 'metal-sheen';
  const bgGradId = 'aluminum-bg';
  const edgeShadowId = 'edge-shadow';

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative inline-block rounded-2xl overflow-hidden"
        style={{ background: '#2a2a2a' }}
      >
        <svg
          viewBox={`-20 -20 ${svgW + 40} ${svgH + 40}`}
          width="100%"
          style={{ maxWidth: svgW + 40, maxHeight: svgH + 40 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <clipPath id={clipId}>
              <path d={shapePath} />
            </clipPath>

            {/* Aluminum background gradient */}
            <linearGradient id={bgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4d4d8" />
              <stop offset="25%" stopColor="#e4e4e7" />
              <stop offset="50%" stopColor="#f4f4f5" />
              <stop offset="75%" stopColor="#d4d4d8" />
              <stop offset="100%" stopColor="#c4c4c8" />
            </linearGradient>

            {/* Metallic sheen overlay */}
            <linearGradient id={sheenId} x1="0%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.3" />
              <stop offset="30%" stopColor="white" stopOpacity="0.05" />
              <stop offset="60%" stopColor="white" stopOpacity="0.15" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>

            {/* Embossing bevel effect */}
            <filter id={filterId}>
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
              <feSpecularLighting
                in="blur"
                surfaceScale="4"
                specularConstant="0.8"
                specularExponent="25"
                result="specOut"
              >
                <fePointLight x={-svgW * 0.3} y={-svgH * 0.3} z="200" />
              </feSpecularLighting>
              <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specClip" />
              <feComposite in="SourceGraphic" in2="specClip" operator="arithmetic" k1="0" k2="1" k3="0.6" k4="0" />
            </filter>

            {/* Drop shadow for the sign */}
            <filter id={edgeShadowId}>
              <feDropShadow dx="3" dy="3" stdDeviation="6" floodColor="#000" floodOpacity="0.4" />
              <feDropShadow dx="-1" dy="-1" stdDeviation="2" floodColor="#fff" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Sign body with shadow */}
          <g filter={`url(#${edgeShadowId})`}>
            {/* Aluminum base */}
            <path d={shapePath} fill={`url(#${bgGradId})`} />

            {/* Artwork clipped to shape */}
            <g clipPath={`url(#${clipId})`}>
              <image
                href={imageUrl}
                x="0"
                y="0"
                width={svgW}
                height={svgH}
                preserveAspectRatio="xMidYMid slice"
              />
            </g>

            {/* Embossing highlight effect */}
            <g clipPath={`url(#${clipId})`} filter={`url(#${filterId})`}>
              <image
                href={imageUrl}
                x="0"
                y="0"
                width={svgW}
                height={svgH}
                preserveAspectRatio="xMidYMid slice"
                opacity="0.4"
              />
            </g>

            {/* Metallic sheen */}
            <path d={shapePath} fill={`url(#${sheenId})`} />

            {/* Edge highlight (stamped look) */}
            <path
              d={shapePath}
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.5"
            />
            <path
              d={shapePath}
              fill="none"
              stroke="rgba(0,0,0,0.2)"
              strokeWidth="0.5"
              transform="translate(1,1)"
            />
          </g>
        </svg>
      </div>
      <p className="mt-4 text-sm text-gray-400 text-center">
        Embossed preview — {productName}
      </p>
    </div>
  );
}
