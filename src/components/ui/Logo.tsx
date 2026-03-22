import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light';
  className?: string;
}

/**
 * Custom Tin Tackers logo — shaped like an actual tin tacker sign.
 *
 * variant="dark"  → for light backgrounds (header): black text on white
 * variant="light" → for dark backgrounds (hero, footer): white text on dark, with amber tint
 */
export default function Logo({ size = 'md', variant = 'dark', className = '' }: LogoProps) {
  const dims = {
    sm:  { w: 160, h: 40 },
    md:  { w: 220, h: 55 },
    lg:  { w: 340, h: 85 },
    xl:  { w: 480, h: 120 },
  };

  const { w, h } = dims[size];

  // Both variants use the black-on-white flat version.
  // For dark backgrounds, CSS invert + lighten blend makes it white-on-transparent.
  const src = '/images/custom_tin_tackers_black_on_white_exact_flat.png';

  return (
    <Image
      src={src}
      alt="Custom Tin Tackers"
      width={w}
      height={h}
      className={className}
      priority={size === 'xl' || size === 'lg'}
      style={{
        width: w,
        height: 'auto',
        ...(variant === 'light' ? {
          filter: 'invert(1)',
          mixBlendMode: 'lighten' as const,
        } : {}),
      }}
    />
  );
}
