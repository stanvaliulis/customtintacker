import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'AI Artwork Review and Sign Preview',
  description: 'Upload artwork for AI-assisted feedback and an embossed sign preview. Choose your product, review suggestions, and request a production proof.',
  alternates: { canonical: '/ai-designer' },
  openGraph: { title: 'AI Artwork Review and Sign Preview', url: '/ai-designer' },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
