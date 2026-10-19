import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 4,
          background: '#111827',
          border: '2px solid #d97706',
          fontSize: 14,
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
