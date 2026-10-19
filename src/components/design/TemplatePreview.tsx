'use client';
import { useId } from 'react';
import { getShapeDefinition } from '@/lib/design/shapes';
import type { ProductShape } from '@/types/product';

/** Accessible vector previews of the same editable objects used by Fabric. */
export default function TemplatePreview({ canvas, shape, label }: { canvas: Record<string, unknown>; shape: ProductShape; label: string }) {
  const id = useId().replace(/:/g, '');
  const w = Number(canvas.width), h = Number(canvas.height);
  const objects = canvas.objects as Record<string, unknown>[];
  return <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className="w-full h-full">
    <defs><clipPath id={id}><path d={getShapeDefinition(shape).getPath(w, h)} /></clipPath></defs>
    <g clipPath={`url(#${id})`}>
      <rect width={w} height={h} fill={String(canvas.background || '#ffffff')} />
      {objects.map((o, i) => {
        const type = String(o.type).toLowerCase();
        const x = Number(o.left || 0), y = Number(o.top || 0);
        const fill = String(o.fill || 'none'), stroke = o.stroke ? String(o.stroke) : undefined;
        if (type === 'circle') return <circle key={i} cx={x} cy={y} r={Number(o.radius)} fill={fill} stroke={stroke} strokeWidth={Number(o.strokeWidth || 1)} />;
        if (type === 'rect') return <rect key={i} x={x} y={y} width={Number(o.width)} height={Number(o.height)} rx={Number(o.rx || 0)} fill={fill} stroke={stroke} strokeWidth={Number(o.strokeWidth || 1)} />;
        if (type !== 'textbox') return null;
        const lines = String(o.text || '').split('\n'), size = Number(o.fontSize);
        return <text key={i} x={x} y={y} fill={fill} fontFamily={String(o.fontFamily)} fontSize={size} fontWeight={String(o.fontWeight || 'normal')} textAnchor="middle">
          {lines.map((line, j) => <tspan key={j} x={x} y={y + (j - (lines.length - 1) / 2) * size * 1.12 + size * .34}>{line}</tspan>)}
        </text>;
      })}
    </g>
  </svg>;
}
