import type { Product } from '@/types/product';

export const sizeFilters = [
  { value: '6', label: '6"' },
  { value: '12', label: '12"' },
  { value: '14', label: '14"' },
  { value: '15', label: '15"' },
  { value: '16', label: '16"' },
  { value: '18', label: '18"' },
  { value: '22', label: '22"' },
  { value: '24', label: '24"' },
  { value: 'custom', label: 'Custom Size' },
];

export const shapeFilters = [
  { value: 'square', label: 'Square' },
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'circle', label: 'Circle' },
  { value: 'can', label: 'Can Shape' },
  { value: 'bottle-cap', label: 'Bottle Cap' },
  { value: 'arrow', label: 'Arrow' },
  { value: 'street-sign', label: 'Street Sign' },
  { value: 'license-plate', label: 'License Plate' },
  { value: 'die-cut', label: 'Die Cut' },
];

export const categoryFilters = [
  { value: 'standard', label: 'Standard Tackers' },
  { value: 'circle', label: 'Circle Tackers' },
  { value: 'can-shape', label: 'Can Shapes' },
  { value: 'specialty', label: 'Specialty Shapes' },
  { value: 'street-sign', label: 'Street Signs' },
  { value: 'license-plate', label: 'License Plates' },
  { value: 'corrugated', label: 'Corrugated Tackers' },
  { value: 'custom', label: 'Custom / Die-Cut' },
];

// ─── Catalog: material → sub category ───────────────────────────────────
// Every product lands in exactly one material and one sub category.
// URL: /products?material=aluminum&sub=circles


export type Material = 'aluminum' | 'vinyl';

export interface Subcategory {
  value: string;
  label: string;
  description: string;
}

export interface MaterialGroup {
  value: Material;
  label: string;
  description: string;
  subcategories: Subcategory[];
}

export const catalog: MaterialGroup[] = [
  {
    value: 'aluminum',
    label: 'Embossed Aluminum',
    description: 'Our classic tin tacker: recycled aluminum, full-color print, raised embossing.',
    subcategories: [
      { value: 'squares', label: 'Squares', description: '6" to 24" square tackers.' },
      { value: 'rectangles', label: 'Rectangles', description: 'Poster and banner proportions.' },
      { value: 'circles', label: 'Circles', description: 'Round tackers from 12" to 18".' },
      { value: 'cans', label: 'Can Shapes', description: 'Slim, standard, tall boy and large cans.' },
      { value: 'bottle-caps', label: 'Bottle Caps', description: 'The brewery favorite.' },
      { value: 'signs-plates', label: 'Street Signs & License Plates', description: 'Road-sign and plate formats.' },
      { value: 'shields-arrows', label: 'Shields & Arrows', description: 'Route shields and directional arrows.' },
      { value: 'corrugated', label: 'Corrugated', description: 'Ribbed, industrial-look aluminum.' },
      { value: 'states', label: 'State Shapes', description: 'All 50 states plus the USA.' },
      { value: 'custom', label: 'Custom Shapes', description: 'Any outline you want. Quote only.' },
    ],
  },
  {
    value: 'vinyl',
    label: 'Embossed Vinyl',
    description: 'Lightweight, lower-cost embossed vinyl in our most popular shapes.',
    subcategories: [
      { value: 'squares', label: 'Squares', description: '6" to 24" vinyl squares.' },
      { value: 'rectangles', label: 'Rectangles', description: 'Vinyl rectangles.' },
      { value: 'circles', label: 'Circles', description: 'Vinyl circles from 12" to 24".' },
      { value: 'cans', label: 'Can Shapes', description: 'Vinyl can shapes.' },
      { value: 'plates', label: 'License Plates', description: 'Standard and euro plates.' },
    ],
  },
];

export function getMaterial(p: Pick<Product, 'metadata'>): Material {
  return /vinyl/i.test(p.metadata?.material ?? '') ? 'vinyl' : 'aluminum';
}

export function getSubcategory(p: Pick<Product, 'metadata' | 'shape' | 'category' | 'slug'>): string {
  if (getMaterial(p) === 'vinyl') {
    if (p.shape === 'license-plate') return 'plates';
    if (p.shape === 'can') return 'cans';
    if (p.shape === 'circle') return 'circles';
    if (p.shape === 'square') return 'squares';
    return 'rectangles';
  }
  if (p.category === 'corrugated') return 'corrugated';
  if (p.category === 'custom') return 'custom';
  if (/state|united-states/.test(p.slug) && p.shape === 'die-cut') return 'states';
  switch (p.shape) {
    case 'square': return 'squares';
    case 'rectangle': return 'rectangles';
    case 'circle': return 'circles';
    case 'can': return 'cans';
    case 'bottle-cap': return 'bottle-caps';
    case 'street-sign':
    case 'license-plate': return 'signs-plates';
    case 'shield':
    case 'arrow': return 'shields-arrows';
    default: return 'custom';
  }
}

export function getMaterialGroup(value: string): MaterialGroup | undefined {
  return catalog.find((m) => m.value === value);
}

export function getSubcategoryLabel(material: string, sub: string): string | undefined {
  return getMaterialGroup(material)?.subcategories.find((s) => s.value === sub)?.label;
}
