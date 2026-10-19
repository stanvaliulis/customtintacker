import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 32,
          background: '#111827',
          border: '6px solid #d97706',
          fontSize: 64,
          fontWeight: 900,
          color: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        CTT
      </div>
    ),
    { ...size }
  );
}
