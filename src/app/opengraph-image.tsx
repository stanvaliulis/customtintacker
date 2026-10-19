import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Custom Tin Tackers — Embossed Aluminum Signs Made in USA';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Border accent */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            bottom: 16,
            border: '3px solid #d97706',
            borderRadius: 16,
            display: 'flex',
          }}
        />

        {/* CTT badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: 12,
            background: '#111827',
            border: '3px solid #d97706',
            marginBottom: 24,
            fontSize: 28,
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: -1,
          }}
        >
          CTT
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.1,
            letterSpacing: -2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span>Custom Tin Tackers</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: '#d97706',
            marginTop: 16,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: 'uppercase' as const,
            display: 'flex',
          }}
        >
          Embossed Aluminum Signs
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 18,
            color: '#9ca3af',
            marginTop: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span>Made in USA</span>
          <span style={{ color: '#4b5563' }}>|</span>
          <span>Factory-Direct Pricing</span>
          <span style={{ color: '#4b5563' }}>|</span>
          <span>Breweries &amp; Bars</span>
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: 'absolute',
            bottom: 36,
            fontSize: 14,
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>customtintackers.com</span>
          <span style={{ color: '#4b5563' }}>—</span>
          <span>by Interstate Graphics, Machesney Park, IL</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
