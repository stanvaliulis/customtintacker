import type { ProductShape } from '@/types/product';
import { buildTemplateCanvas, type TemplateStyle } from '@/lib/design/template-layout';

export interface DesignTemplateData {
  id: string; name: string; slug: string; shape: ProductShape;
  width: number; height: number; thumbnail: string; canvasJson: string;
  category: string; tags: string; isActive: boolean; sortOrder: number;
  style?: TemplateStyle;
}
type Seed = [string, string, ProductShape, number, number, string, TemplateStyle];
// All eleven original IDs retained. Site content is separate from the layout engine.
const seeds: Seed[] = [
  ['classic-brewery', 'Classic Brewery', 'bottle-cap', 22, 22, 'brewery', { background: '#142d2c', ink: '#fff8e8', accent: '#e1b865', font: 'Georgia', kicker: 'INDEPENDENT CRAFT', title: 'YOUR\nBREWERY', detail: 'YOUR SIGNATURE BREW', footer: 'YOUR CITY · EST. YEAR' }],
  ['happy-hour', 'Happy Hour', 'rectangle', 24, 12, 'bar', { background: '#201e38', ink: '#fff4e4', accent: '#f7b58b', font: 'Arial', kicker: 'GOOD TIMES START HERE', title: 'HAPPY HOUR', detail: 'ADD YOUR DAYS & HOURS', footer: 'YOUR BAR · YOUR SPECIALS' }],
  ['simple-brand', 'Simple Brand', 'circle', 18, 18, 'general', { background: '#f5efdf', ink: '#20352c', accent: '#596b41', font: 'Georgia', kicker: 'MAKE IT YOURS', title: 'YOUR\nBRAND', detail: 'YOUR TAGLINE HERE', footer: 'YOUR CITY · EST. YEAR' }],
  ['craft-beer', 'Craft Beer Label', 'square', 18, 18, 'brewery', { background: '#133b52', ink: '#fff9ed', accent: '#edbc67', font: 'Arial', kicker: 'YOUR BREWERY', title: 'CRAFT\nBEER', detail: 'YOUR BEER STYLE', footer: 'YOUR CITY · YOUR STORY' }],
  ['directional', 'Directional', 'arrow', 23, 5.5, 'bar', { background: '#f1b943', ink: '#172823', accent: '#273d35', font: 'Arial', kicker: 'THIS WAY TO', title: 'YOUR PLACE', detail: '', footer: 'ADD YOUR DESTINATION' }],
  ['tap-room', 'Tap Room', 'square', 14, 14, 'brewery', { background: '#172a26', ink: '#f8f0db', accent: '#c8c998', font: 'Arial', kicker: 'YOUR BREWERY', title: 'TAP\nROOM', detail: 'ADD YOUR OPENING HOURS', footer: 'GOOD COMPANY · GREAT BEER' }],
  ['dispensary', 'Dispensary', 'circle', 14, 14, 'cannabis', { background: '#e9eddf', ink: '#204338', accent: '#657d43', font: 'Georgia', kicker: 'YOUR DISPENSARY', title: 'YOUR\nBRAND', detail: 'YOUR TAGLINE HERE', footer: 'YOUR CITY · EST. YEAR' }],
  ['restaurant', 'Restaurant Special', 'rectangle', 18, 12, 'restaurant', { background: '#602e2d', ink: '#fff1db', accent: '#e8ba83', font: 'Georgia', kicker: 'YOUR RESTAURANT', title: 'TODAY’S SPECIAL', detail: 'YOUR DISH & DESCRIPTION', footer: 'ADD YOUR PRICE OR HOURS' }],
  ['street-sign', 'Street Sign', 'street-sign', 15, 4, 'general', { background: '#154a3e', ink: '#ffffff', accent: '#c1dfd0', font: 'Arial', kicker: 'WELCOME TO', title: 'YOUR STREET', detail: '', footer: 'YOUR CITY' }],
  ['can-shape', 'Beer Can', 'can', 9, 17.5, 'brewery', { background: '#d6e5dc', ink: '#173f36', accent: '#4c6952', font: 'Arial', kicker: 'YOUR BREWERY', title: 'YOUR\nBEER', detail: 'YOUR BEER STYLE', footer: 'ADD YOUR DETAILS' }],
  ['license-plate', 'License Plate', 'license-plate', 12, 6, 'general', { background: '#e9e1cc', ink: '#20324c', accent: '#536987', font: 'Arial', kicker: 'YOUR STATE', title: 'YOUR TAG', detail: 'YOUR SLOGAN', footer: 'CUSTOM DISPLAY PLATE' }],
];
export const designTemplates: DesignTemplateData[] = seeds.map(([slug, name, shape, width, height, category, style], index) => ({
  id: `tpl-${slug}`, slug: slug === 'restaurant' ? 'restaurant-special' : slug === 'can-shape' ? 'beer-can' : slug, name, shape, width, height, category, style,
  tags: `${category},${name.toLowerCase()},editable`, thumbnail: '',
  canvasJson: JSON.stringify(buildTemplateCanvas(shape, width, height, style)), isActive: true, sortOrder: index + 1,
}));
export function getTemplatesByShape(shape?: string) {
  return designTemplates.filter(t => t.isActive && (!shape || t.shape === shape));
}
export function getTemplateById(id: string) { return designTemplates.find(t => t.isActive && t.id === id); }
